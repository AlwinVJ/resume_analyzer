# Sections with detailed work or project descriptions
DESCRIPTIVE_SECTIONS = [
    "experience",
    "projects",
    "professional_summary",
    "certifications",
]


# Clean up resume dictionary keys and strip whitespace
def validate_resume_sections(resume_sections: dict) -> dict:
    if not isinstance(resume_sections, dict):
        raise ValueError(f"Expected dict, got {type(resume_sections).__name__}")
    return {
        str(k).strip().lower(): ("" if v is None else str(v).strip())
        for k, v in resume_sections.items()
    }


# Get text from skills sections (technical_skills, skills, core competencies)
def extract_technical_skills_text(resume_sections: dict) -> str:
    return (
        resume_sections.get("technical_skills")
        or resume_sections.get("skills")
        or resume_sections.get("core competencies")
        or ""
    )


# Filter sections that have text for skill extraction
def extract_descriptive_sections(resume_sections: dict) -> dict:
    return {
        sec: str(resume_sections[sec]).strip()
        for sec in DESCRIPTIVE_SECTIONS
        if resume_sections.get(sec) and str(resume_sections[sec]).strip()
    }


# Format experience and projects into labeled blocks for the prompt
def format_descriptive_text_for_llm(descriptive_sections: dict) -> str:
    return "\n\n".join(
        f"[{sec.replace('_', ' ').title()}]\n{text}"
        for sec, text in descriptive_sections.items()
    )

