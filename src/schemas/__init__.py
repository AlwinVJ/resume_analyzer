"""Shared data contracts between backend modules and the frontend.

Every model here mirrors a TypeScript interface in frontend/src/types/index.ts.
If you change a field here, change it there too (and vice versa).
"""
from src.schemas.errors import (
    AppError,
    CorruptPDFError,
    FileTooLargeError,
    IndexNotReadyError,
    InvalidInputError,
    LLMOutputInvalidError,
    LLMUnavailableError,
    NotFoundError,
    ScannedPDFError,
    UnsupportedFileError,
)
from src.schemas.jd import JDEducation, JDProfile
from src.schemas.match import (
    CandidateScreeningResult,
    EvidenceItem,
    MatchResult,
    MissingSkill,
    ScoreBreakdown,
    ScreeningResponse,
    SkillEvidence,
    SkillGap,
    Verdict,
)
from src.schemas.resume import (
    ContactInfo,
    EducationEntry,
    ExperienceEntry,
    ResumeProfile,
    UploadResumeResponse,
)

__all__ = [
    "AppError", "CorruptPDFError", "FileTooLargeError", "IndexNotReadyError", "InvalidInputError",
    "LLMOutputInvalidError", "LLMUnavailableError", "NotFoundError", "ScannedPDFError",
    "UnsupportedFileError",
    "JDEducation", "JDProfile",
    "CandidateScreeningResult", "EvidenceItem", "MatchResult", "MissingSkill",
    "ScoreBreakdown", "ScreeningResponse", "SkillEvidence", "SkillGap", "Verdict",
    "ContactInfo", "EducationEntry", "ExperienceEntry", "ResumeProfile", "UploadResumeResponse",
]
