from src.skill_engine.schemas import SkillGapReport, MissingSkill
from src.skill_engine.normalizer import normalize_skills

# Importance weights based on requirement level
WEIGHTS = {
    "required": 0.90,
    "preferred": 0.65,
    "other": 0.40,
}


# Build the final gap report with match score and missing skill weights
def generate_skill_gap_report(
    resume_skills: list,
    jd_skills: list,
    matched_skills: list,
    missing_skills: list,
    uncertain_skills: list = None,
    requirement_map: dict = None,
    evidence_map: dict = None,
) -> SkillGapReport:
    requirement_map = requirement_map or {}
    evidence_map = evidence_map or {}

    norm_resume = normalize_skills(resume_skills)
    norm_jd = normalize_skills(jd_skills)
    norm_matched = normalize_skills(matched_skills)
    norm_missing = normalize_skills(missing_skills)
    norm_uncertain = normalize_skills(uncertain_skills or [])

    # Calculate match percentage (0.0 to 1.0)
    overlap_ratio = round(len(norm_matched) / len(norm_jd), 2) if norm_jd else 0.0

    # Build missing skill items with their importance weight
    missing_objects = [
        MissingSkill(
            skill=skill,
            importance=WEIGHTS.get(str(requirement_map.get(skill, "required")).lower(), 0.90),
        )
        for skill in norm_missing
    ]

    return SkillGapReport(
        resume_skills=norm_resume,
        jd_skills=norm_jd,
        matched_skills=norm_matched,
        missing_skills=missing_objects,
        uncertain_skills=norm_uncertain,
        evidence_map=evidence_map,
        overlap_ratio=overlap_ratio,
        gap_count=len(missing_objects),
    )

