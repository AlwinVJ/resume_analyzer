from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# Missing skill and its priority weight
class MissingSkill(BaseModel):
    skill: str
    importance: float


# Final report comparing resume skills with job requirements
class SkillGapReport(BaseModel):
    resume_skills: List[str] = Field(default_factory=list)
    jd_skills: List[str] = Field(default_factory=list)
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[MissingSkill] = Field(default_factory=list)
    uncertain_skills: List[str] = Field(default_factory=list)
    evidence_map: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    overlap_ratio: float = 0.0
    gap_count: int = 0

    @property
    def skill_overlap(self) -> float:
        return self.overlap_ratio

    def to_dict(self) -> dict:
        data = self.model_dump()
        data["skill_overlap"] = self.overlap_ratio
        return data


# Skill found in candidate resume
class ExtractedResumeSkill(BaseModel):
    name: str
    source_section: Optional[str] = None
    evidence: Optional[str] = None
    has_practical_evidence: bool = False


# Skill requirement found in job description
class ExtractedJDSkill(BaseModel):
    name: str
    requirement: str = "required"
    evidence: Optional[str] = None

