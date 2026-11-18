import json
from src.skill_engine.prompts import build_jd_extraction_prompt
from src.skill_engine.schemas import ExtractedJDSkill
from src.skill_engine.llm_provider import strip_markdown


# Extract required and preferred skills from job description text or dictionary
def extract_jd_skills(jd_input, llm_client=None) -> list:
    if not jd_input:
        return []

    # If raw text, ask LLM to extract skills
    if isinstance(jd_input, str):
        if not jd_input.strip() or llm_client is None:
            return []
        try:
            raw = llm_client.generate(build_jd_extraction_prompt(jd_input.strip()))
            data = json.loads(strip_markdown(raw))
            jd_input = data.get("skills", data) if isinstance(data, dict) else data
        except Exception:
            return []

    # If dictionary with required and preferred lists
    if isinstance(jd_input, dict):
        if "required_skills" in jd_input or "preferred_skills" in jd_input:
            reqs = [
                ExtractedJDSkill(name=str(s).strip(), requirement="required")
                for s in jd_input.get("required_skills", [])
                if s and str(s).strip()
            ]
            prefs = [
                ExtractedJDSkill(name=str(s).strip(), requirement="preferred")
                for s in jd_input.get("preferred_skills", [])
                if s and str(s).strip()
            ]
            return reqs + prefs
        jd_input = jd_input.get("skills", [])

    # If list of skill items
    if isinstance(jd_input, list):
        skills = []
        for item in jd_input:
            if isinstance(item, ExtractedJDSkill):
                skills.append(item)
            elif isinstance(item, dict) and item.get("name"):
                req = str(item.get("requirement", "required")).strip().lower()
                skills.append(
                    ExtractedJDSkill(
                        name=str(item["name"]).strip(),
                        requirement=req if req in {"required", "preferred", "other"} else "required",
                        evidence=item.get("evidence"),
                    )
                )
            elif isinstance(item, str) and item.strip():
                skills.append(ExtractedJDSkill(name=item.strip(), requirement="required"))
        return skills

    return []

