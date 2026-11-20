from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import (
    ScreeningRequest,
    ScreeningResponse,
    CandidateResponse
)
from configs.settings import settings

from src.services.screening_service import ScreeningService


app = FastAPI(
    title="Resume Analyzer API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = settings.CORS_ORIGINS,
    allow_credentials = False,
    allow_methods = ["GET", "POST", "DELETE",],
    allow_headers = ["*"],
)


@app.get("/")
def root():
    return {
        "message": "Resume Screening API"
    }


@app.post("/screen", response_model=ScreeningResponse)
def screen_candidates(request: ScreeningRequest):
    results = (
        ScreeningService.rank_candidates(
            request.job_description
        )
    )

    candidates = [
        CandidateResponse(
            candidate=resume,
            score=score
        )
        for resume, score in results
    ]

    return ScreeningResponse(candidates=candidates)