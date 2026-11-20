"""Resume-side contracts. Mirrors ContactInfo, EducationEntry, ExperienceEntry,
ResumeProfile and UploadResumeResponse in frontend/src/types + services/api/resumeApi.ts."""
from datetime import datetime

from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    links: list[str] = Field(default_factory=list)
    location: str | None = None


class EducationEntry(BaseModel):
    degree_level: str | None = None  # "bachelor", "master", "phd", "diploma", ... (normalised)
    degree_raw: str | None = None    # text as written in the resume
    field: str | None = None
    institution: str | None = None
    year: str | None = None


class ExperienceEntry(BaseModel):
    title: str | None = None
    company: str | None = None
    start: str | None = None
    end: str | None = None
    text: str | None = None
    years: float | None = None


class ResumeProfile(BaseModel):
    resume_id: str
    file_name: str
    file_size: int | None = None
    uploaded_at: datetime | None = None
    contact: ContactInfo = Field(default_factory=ContactInfo)
    sections: dict[str, str] = Field(default_factory=dict)
    education: list[EducationEntry] = Field(default_factory=list)
    experience: list[ExperienceEntry] = Field(default_factory=list)
    total_years: float | None = None
    skills: list[str] = Field(default_factory=list)
    parse_warnings: list[str] = Field(default_factory=list)


class UploadResumeResponse(BaseModel):
    resume_id: str
    file_name: str
    file_size: int | None = None
    parse_warnings: list[str] = Field(default_factory=list)
    uploaded_at: datetime | None = None
    profile: ResumeProfile | None = None
