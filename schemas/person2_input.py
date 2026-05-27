from pydantic import BaseModel
from typing import List


class Person2Input(BaseModel):
    resume_text: str
    jd_text: str