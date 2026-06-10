from typing import List
from typing import Optional

from pydantic import BaseModel


# Ranked Missing Skill Schema
class RankedSkill(BaseModel):

    skill: str

    importance: str


# Person2 Output Schema
class Person2Output(BaseModel):

    # Extracted Resume Skills
    resume_skills: List[str]

    # Extracted JD Skills
    jd_skills: List[str]

    # Skills Present In Both
    matched_skills: List[str]

    # Skills Missing From Resume
    missing_skills: List[str]

    # Resume Match Percentage
    match_percentage: float

    # Resolved Occupation
    occupation: Optional[str] = None

    # Ranked Missing Skills
    ranked_missing_skills: List[RankedSkill]