from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import (
    ScreeningRequest,
    ScreeningResponse,
    CandidateResponse
)
from api.errors import register_error_handlers
from configs.settings import settings
from src.analysis.pdf_text import read_limited
from src.analysis.service import AnalysisService
from src.schemas.errors import AppError, InvalidInputError
from src.schemas.match import MatchResult
from src.services.screening_service import ScreeningService
from src.utils.logger import logger

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

register_error_handlers(app)

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


analysis_service = AnalysisService()


@app.post("/analyze", response_model=MatchResult)
def analyze_resume(
    file: UploadFile | None = File(None),
    job_description: str | None = Form(None),
):
    """Analyse one PDF resume against a job description (multipart/form-data)."""
    if file is None:
        raise InvalidInputError("Upload a resume as a PDF file (form field 'file').")
    try:
        data = read_limited(file.file)
        return analysis_service.analyze(data, file.filename, job_description)
    except AppError:
        raise
    except Exception as e:
        # Raised as an AppError so the response keeps its CORS headers and a readable message.
        logger.exception("Unexpected error while analysing %s", file.filename)
        raise AppError("Something went wrong while analysing this resume. Please try again.") from e
