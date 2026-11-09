import re
import json
from src.skill_engine.prompts import build_resume_extraction_prompt
from src.skill_engine.schemas import ExtractedResumeSkill
from src.skill_engine.input_handler import format_descriptive_text_for_llm
from src.skill_engine.normalizer import normalize_skill
from src.skill_engine.llm_provider import strip_markdown

# Delimiters used in resumes to separate skills
DELIMITERS = re.compile(r"[,;|\n•·*]+")

# Common headers to remove from skills text
CATEGORY_PREFIXES = {
    "languages",
    "programming languages",
    "tools",
    "frameworks",
    "libraries",
    "databases",
    "cloud",
    "cloud & devops",
    "platforms",
    "skills",
    "technical skills",
    "core competencies",
}


# Split listed skills by commas, bullets, and remove category headers
def extract_explicit_skills(text: str) -> list:
    if not text or not isinstance(text, str):
        return []

    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if ":" in line:
            head, _, tail = line.partition(":")
            if head.strip().lower() not in CATEGORY_PREFIXES:
                lines.append(head.strip())
            lines.append(tail.strip())
        else:
            lines.append(line)

    skills = []
    seen = set()
    for token in DELIMITERS.split("\n".join(lines)):
        item = token.strip()
        # Keep single-letter skills like C and R, drop other 1-letter characters
        if not item or (len(item) == 1 and item.lower() not in {"c", "r"}):
            continue
        key = item.lower()
        if key not in seen:
            seen.add(key)
            skills.append(item)
    return skills


# Use LLM to extract skills and project proof from experience and projects
def extract_llm_skills(descriptive_sections: dict, llm_client) -> list:
    if not descriptive_sections or llm_client is None:
        return []

    text = format_descriptive_text_for_llm(descriptive_sections)
    if not text.strip():
        return []

    try:
        raw = llm_client.generate(build_resume_extraction_prompt(text))
        data = json.loads(strip_markdown(raw))
        items = data.get("skills", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            return []

        skills = []
        for item in items:
            if isinstance(item, ExtractedResumeSkill):
                skills.append(item)
            elif isinstance(item, dict) and item.get("name"):
                skills.append(ExtractedResumeSkill.model_validate(item))
            elif isinstance(item, str) and item.strip():
                skills.append(ExtractedResumeSkill(name=item.strip()))
        return skills
    except Exception:
        return []


# Combine listed skills and LLM skills (project evidence takes priority)
def merge_resume_skills(explicit_skills: list, llm_skills: list) -> dict:
    evidence_map = {}

    # Add listed skills
    for s in explicit_skills or []:
        norm = normalize_skill(s)
        if norm and norm not in evidence_map:
            evidence_map[norm] = {
                "source_section": "technical_skills",
                "evidence": None,
                "has_practical_evidence": False,
            }

    # Add skills from experience/projects
    for item in llm_skills or []:
        name = getattr(item, "name", None) or (item.get("name") if isinstance(item, dict) else None)
        norm = normalize_skill(name) if name else ""
        if not norm:
            continue

        source = getattr(item, "source_section", None) or (item.get("source_section") if isinstance(item, dict) else None) or "experience"
        evidence = getattr(item, "evidence", None) or (item.get("evidence") if isinstance(item, dict) else None)
        has_evidence = bool(evidence and str(evidence).strip())

        # Update if not seen yet, or if it has real project proof
        if norm not in evidence_map or has_evidence or not evidence_map[norm].get("has_practical_evidence"):
            evidence_map[norm] = {
                "source_section": source,
                "evidence": evidence,
                "has_practical_evidence": has_evidence,
            }

    return {
        "skills": list(evidence_map.keys()),
        "evidence_map": evidence_map,
    }

