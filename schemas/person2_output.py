from pydantic import BaseModel
from typing import List


class MissingSkill(BaseModel):
    skill: str
    importance: float


class Person2Output(BaseModel):
    resume_skills: List[str]
    jd_skills: List[str]
    missing_skills: List[MissingSkill]
    skill_overlap_ratio: float
    missing_count: int