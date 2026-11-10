import json
from src.skill_engine.normalizer import normalize_skill, normalize_skills
from src.skill_engine.prompts import build_verification_prompt
from src.skill_engine.llm_provider import strip_markdown


# Compare resume skills directly with JD requirements
def match_exact(resume_skills: list, jd_skills: list) -> dict:
    resume_set = {normalize_skill(s) for s in resume_skills if s}
    matched = []
    unmatched = []
    seen = set()

    for jd_skill in jd_skills:
        norm = normalize_skill(jd_skill)
        if not norm or norm in seen:
            continue
        seen.add(norm)

        if norm in resume_set:
            matched.append(norm)
        else:
            unmatched.append(norm)

    return {
        "matched_skills": matched,
        "unmatched_requirements": unmatched,
    }


# Check if unmatched skills are mentioned in resume experience text
def verify_unmatched(unmatched_requirements: list, resume_context: str, llm_client) -> dict:
    norm_requirements = normalize_skills(unmatched_requirements)

    if not norm_requirements or not resume_context or not resume_context.strip() or llm_client is None:
        return {
            "verified_matched": [],
            "verified_missing": norm_requirements,
            "verified_uncertain": [],
        }

    prompt = build_verification_prompt(norm_requirements, resume_context)
    verified_matched = []
    verified_missing = []
    verified_uncertain = []

    try:
        raw = llm_client.generate(prompt)
        data = json.loads(strip_markdown(raw))
        items = data.get("verifications", []) if isinstance(data, dict) else data

        evaluated = {}
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    skill_key = normalize_skill(item.get("skill", ""))
                    evaluated[skill_key] = str(item.get("status", "missing")).strip().lower()

        # Group skills by status
        for req in norm_requirements:
            status = evaluated.get(req, "missing")
            if status == "matched":
                verified_matched.append(req)
            elif status == "uncertain":
                verified_uncertain.append(req)
            else:
                verified_missing.append(req)

    except Exception:
        # If verification fails, mark skills as uncertain instead of missing
        verified_matched = []
        verified_missing = []
        verified_uncertain = norm_requirements

    return {
        "verified_matched": verified_matched,
        "verified_missing": verified_missing,
        "verified_uncertain": verified_uncertain,
    }

