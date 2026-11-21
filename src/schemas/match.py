"""Analysis-result contracts. Mirrors MatchResult, SkillGapReport, CandidateScreeningResult
and ScreeningPayload in frontend/src/types/index.ts."""
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from src.scoring.weighted_score import get_verdict

Verdict = Literal["Strong Match", "Moderate Match", "Weak Match"]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ScoreBreakdown(BaseModel):
    """Points each feature contributes to final_score (they sum to final_score)."""
    skill_overlap: float = 0.0
    semantic_similarity: float = 0.0
    experience_match: float = 0.0
    education_match: float = 0.0


class MissingSkill(BaseModel):
    skill: str
    importance: float = Field(ge=0.0, le=1.0)
    type: Literal["required", "preferred", "other"] | None = None


class SkillEvidence(BaseModel):
    source_section: str | None = None
    quote: str | None = None


class SkillGap(BaseModel):
    resume_skills: list[str] = Field(default_factory=list)
    jd_skills: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[MissingSkill] = Field(default_factory=list)
    uncertain_skills: list[str] = Field(default_factory=list)
    overlap_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    weighted_overlap: float | None = Field(default=None, ge=0.0, le=1.0)
    gap_count: int = 0
    evidence_map: dict[str, SkillEvidence] = Field(default_factory=dict)
    status: Literal["ok", "degraded", "failed"] = "ok"
    warnings: list[str] = Field(default_factory=list)


CompatibilityLevel = Literal["High", "Medium", "Low"]
EducationCompatibility = Literal["Exceeds", "Meets", "Partially meets", "Does not meet"]


class ExperienceAssessment(BaseModel):
    """Mirrors ExperienceAssessment in frontend/src/types/index.ts. null = could not be determined."""
    total_months: int | None = None        # merged, non-overlapping professional roles (no internships)
    relevant_months: int | None = None     # months in roles relevant to this job
    internship_months: int | None = None   # internships, reported separately
    roles_without_dates: int = 0           # roles skipped because their dates were missing/unreadable
    required_min_years: int | None = None  # from the JD; null = no requirement stated
    compatibility: CompatibilityLevel | None = None
    basis: str | None = None


class EducationQualification(BaseModel):
    degree_raw: str
    degree_level: str | None = None        # "phd" | "master" | "bachelor" | "diploma" | "certificate" | ...
    field: str | None = None
    institution: str | None = None
    year: str | None = None


class EducationAssessment(BaseModel):
    qualifications: list[EducationQualification] = Field(default_factory=list)
    required: list[str] = Field(default_factory=list)
    compatibility: EducationCompatibility | None = None
    basis: str | None = None


class EvidenceItem(BaseModel):
    chunk_id: str | None = None
    section: str
    quote: str
    type: Literal["matched", "gap", "highlight"] | None = None


class MatchResult(BaseModel):
    final_score: float = Field(ge=0.0, le=100.0)
    verdict: Verdict
    summary: str | None = None
    breakdown: ScoreBreakdown
    breakdown_max: ScoreBreakdown | None = None   # maximum points per feature (the weights x 100)
    insights: list[str] = Field(default_factory=list)
    skill_gap: SkillGap
    evidence: list[EvidenceItem] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=_now)
    candidate_name: str | None = None
    file_name: str | None = None
    job_title: str | None = None
    experience_years: float | None = None
    education_level: str | None = None
    experience: ExperienceAssessment | None = None
    education: EducationAssessment | None = None

    @model_validator(mode="after")
    def _verdict_matches_score(self) -> "MatchResult":
        # One source of truth for thresholds: get_verdict() in src/scoring/weighted_score.py
        expected = get_verdict(self.final_score)
        if self.verdict != expected:
            raise ValueError(
                f"verdict {self.verdict!r} does not match final_score {self.final_score} "
                f"(expected {expected!r})"
            )
        return self


class CandidateScreeningResult(BaseModel):
    resume_id: str
    file_name: str
    candidate_name: str
    score: float = Field(ge=0.0, le=100.0)
    verdict: Verdict
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    experience_years: float | None = None
    experience_compatibility: CompatibilityLevel | None = None
    education_compatibility: EducationCompatibility | None = None
    match_result: MatchResult | None = None


class ScreeningResponse(BaseModel):
    job_title: str | None = None
    total_candidates: int
    candidates: list[CandidateScreeningResult]
    processed_at: datetime = Field(default_factory=_now)
