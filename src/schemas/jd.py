"""Job-description contract. Mirrors JDProfile in frontend/src/types/index.ts."""
import hashlib
from typing import Any

from pydantic import BaseModel, Field


class JDEducation(BaseModel):
    degree_level: str | None = None  # filled by degree normalisation (Milestone 4)
    field: str | None = None
    raw: str | None = None           # text as the JD parser returned it


class JDProfile(BaseModel):
    jd_id: str | None = None
    job_title: str | None = None
    job_level: str | None = None     # "fresher" | "mid" | "senior"
    experience_min: int | None = None
    experience_max: int | None = None
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    education: list[JDEducation] = Field(default_factory=list)
    raw_text_hash: str | None = None

    @staticmethod
    def hash_text(jd_text: str) -> str:
        return hashlib.sha256(jd_text.strip().encode("utf-8")).hexdigest()

    @classmethod
    def from_llm_output(cls, data: dict[str, Any], jd_text: str | None = None) -> "JDProfile":
        """Adapt JobDescriptionParserLLM.parse() output to a JDProfile."""
        experience = data.get("experience_required") or {}
        return cls(
            job_title=data.get("job_title"),
            experience_min=experience.get("min"),
            experience_max=experience.get("max"),
            required_skills=list(data.get("required_skills") or []),
            preferred_skills=list(data.get("preferred_skills") or []),
            education=[JDEducation(raw=e) for e in (data.get("education") or []) if e],
            raw_text_hash=cls.hash_text(jd_text) if jd_text else None,
        )

    def to_skill_engine_input(self) -> dict[str, list[str]]:
        """Shape accepted by src.skill_engine.jd_extractor.extract_jd_skills (dict branch),
        so the skill engine does not call the LLM a second time for the JD."""
        return {"required_skills": self.required_skills, "preferred_skills": self.preferred_skills}
