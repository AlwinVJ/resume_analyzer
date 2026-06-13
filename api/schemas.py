from pydantic import BaseModel
class ScreeningRequest(BaseModel):
    job_description: str


class CandidateResponse(BaseModel):
    candidate: str
    score: float


class ScreeningResponse(BaseModel):
    candidates: list[CandidateResponse]