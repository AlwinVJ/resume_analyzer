from typing import Optional

from pydantic import BaseModel


# Person2 Input Schema
class Person2Input(BaseModel):

    # Resume Content
    resume_text: str

    # Job Description Content
    jd_text: str

    # Optional Job Title
    job_title: Optional[str] = None