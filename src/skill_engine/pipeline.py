from src.skill_engine.input_handler import (
    validate_resume_sections,
    extract_technical_skills_text,
    extract_descriptive_sections,
    format_descriptive_text_for_llm,
)
from src.skill_engine.resume_extractor import (
    extract_explicit_skills,
    extract_llm_skills,
    merge_resume_skills,
)
from src.skill_engine.jd_extractor import extract_jd_skills
from src.skill_engine.normalizer import normalize_skill
from src.skill_engine.matcher import match_exact, verify_unmatched
from src.skill_engine.gap_report import generate_skill_gap_report
from src.skill_engine.llm_provider import OllamaProvider
from src.skill_engine.schemas import SkillGapReport


# Main pipeline comparing resume skills against a job description
class SkillPipeline:
    def __init__(self, llm_client=None, model: str = None, **kwargs):
        # Uses local Ollama qwen2.5:3b by default
        self.llm = llm_client or OllamaProvider(model=model, **kwargs)

    # Run the full skill extraction, matching, and gap report workflow
    def run(self, resume_sections, jd_text: str) -> SkillGapReport:
        if isinstance(resume_sections, str):
            resume_sections = {"experience": resume_sections}
        sections = validate_resume_sections(resume_sections)

        # 1. Extract skills from resume (listed skills + experience text)
        explicit = extract_explicit_skills(extract_technical_skills_text(sections))
        descriptive = extract_descriptive_sections(sections)
        llm_skills = extract_llm_skills(descriptive, self.llm)
        merged = merge_resume_skills(explicit, llm_skills)

        # 2. Extract skill requirements from job description
        jd_items = extract_jd_skills(jd_text, self.llm)
        jd_skills = [item.name for item in jd_items]
        req_map = {normalize_skill(item.name): item.requirement for item in jd_items}

        # 3. Match resume skills directly with JD skills
        match_res = match_exact(merged["skills"], jd_skills)
        matched_skills = list(match_res["matched_skills"])
        unmatched = match_res["unmatched_requirements"]

        # 4. Check if unmatched skills are mentioned in resume experience
        resume_text = format_descriptive_text_for_llm(descriptive)
        if unmatched and resume_text:
            verified = verify_unmatched(unmatched, resume_text, self.llm)
            matched_skills.extend(s for s in verified["verified_matched"] if s not in matched_skills)
            missing = verified["verified_missing"]
            uncertain = verified["verified_uncertain"]
        else:
            missing, uncertain = list(unmatched), []

        # 5. Generate final report with score and missing skills
        return generate_skill_gap_report(
            resume_skills=merged["skills"],
            jd_skills=jd_skills,
            matched_skills=matched_skills,
            missing_skills=missing,
            uncertain_skills=uncertain,
            requirement_map=req_map,
            evidence_map=merged.get("evidence_map", {}),
        )

