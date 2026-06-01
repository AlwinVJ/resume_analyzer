from pydantic import BaseModel
from typing import List


class Person2Output(BaseModel):

    resume_skills: List[str]

    jd_skills: List[str]

    matched_skills: List[str]

    missing_skills: List[str]

    match_percentage: float