"""One LLM call that reads the resume and returns facts: name, roles with dates, qualifications.

The model only copies facts and makes two judgements (is a role relevant to this job, is a
degree's field related to the requirement). Python then:
  * checks every role, date and qualification against the resume text and drops invented ones,
  * parses the dates and does all arithmetic (dates.py / experience.py).
"""
import json
import re
from dataclasses import dataclass, field

from src.analysis.dates import parse_month
from src.analysis.education import Qualification, degree_level
from src.analysis.experience import Role
from src.schemas.errors import LLMOutputInvalidError
from src.schemas.jd import JDProfile
from src.skill_engine.llm_provider import strip_markdown

PROMPT = """Read the resume inside the <resume> tags and extract facts as JSON.

Job context (use it only to judge relevance):
- Job title: <<JOB_TITLE>>
- Required skills: <<SKILLS>>
- Education requirement: <<EDUCATION>>

Return exactly this JSON shape:
{
  "candidate_name": "full name as written, or null",
  "roles": [
    {
      "title": "job title as written",
      "company": "employer as written, or null",
      "dates_as_written": "the date text exactly as it appears, e.g. 'Jan 2024 – Present', or null",
      "start": "YYYY-MM, or YYYY if no month is given, or null",
      "end": "YYYY-MM, YYYY, 'present', or null",
      "is_internship": false,
      "relevant_to_job": true,
      "relevance_reason": "max 12 words"
    }
  ],
  "qualifications": [
    {
      "degree_as_written": "e.g. 'B.S. in Computer Science'",
      "degree_level": "phd | master | bachelor | associate | diploma | certificate | bootcamp | high_school | other",
      "field": "field of study, or null",
      "institution": "as written, or null",
      "year": "graduation year as written, or null",
      "field_relation_to_requirement": "same | related | unrelated | unknown"
    }
  ]
}

Rules:
1. roles: only jobs, internships, freelance or contract work. Not projects, courses or education.
   Copy dates exactly; never estimate a missing date and never calculate durations.
2. is_internship: true only if the role is described as an internship, trainee or apprentice position.
3. relevant_to_job: true if the role's work is the same kind of work as the job or substantially uses
   its required skills.
4. qualifications: academic degrees, diplomas and bootcamps from the education section only.
   Do not include professional certifications (e.g. "AWS Certified", "CKA").
5. field_relation_to_requirement: compare the field of study with the education requirement.
   If the requirement names no field, or there is no requirement, use "same".
6. Use only what the resume states. Missing information is null or an empty list.

<resume>
<<RESUME>>
</resume>"""


def _norm(text: str | None) -> str:
    """Lowercase letters and digits only, for 'does this appear in the resume' checks."""
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def _str(value) -> str | None:
    if isinstance(value, (str, int, float)) and not isinstance(value, bool):
        text = str(value).strip()
        return text or None
    return None


@dataclass
class ResumeFacts:
    candidate_name: str | None = None
    roles: list[Role] = field(default_factory=list)
    qualifications: list[Qualification] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def build_prompt(resume_text: str, jd: JDProfile) -> str:
    education = "; ".join(e.raw for e in jd.education if e.raw) or "none stated"
    skills = ", ".join(jd.required_skills[:30]) or "none stated"
    return (PROMPT.replace("<<JOB_TITLE>>", jd.job_title or "not stated")
            .replace("<<SKILLS>>", skills)
            .replace("<<EDUCATION>>", education)
            .replace("<<RESUME>>", resume_text))


def _date_is_grounded(value: str | None, resume_norm: str) -> bool:
    """The year of a date must appear in the resume (catches invented dates)."""
    if value is None or str(value).strip().lower() in {"present", "current", "now"}:
        return True
    year = re.search(r"(19|20)\d{2}", str(value))
    return bool(year) and year.group() in resume_norm


def parse_facts(raw: str, resume_text: str) -> ResumeFacts:
    try:
        data = json.loads(strip_markdown(raw))
    except json.JSONDecodeError as e:
        raise LLMOutputInvalidError("The AI service returned an unreadable resume analysis.") from e
    if not isinstance(data, dict):
        raise LLMOutputInvalidError("The AI service returned an unexpected resume analysis.")

    resume_norm = _norm(resume_text)
    facts = ResumeFacts()

    name = _str(data.get("candidate_name"))
    if name and _norm(name) and _norm(name) in resume_norm:
        facts.candidate_name = name

    dropped_roles = 0
    for item in data.get("roles") or []:
        if not isinstance(item, dict):
            continue
        title, company = _str(item.get("title")), _str(item.get("company"))
        if not any(v and _norm(v) in resume_norm for v in (title, company)):
            dropped_roles += 1
            continue
        start_raw, end_raw = _str(item.get("start")), _str(item.get("end"))
        grounded = _date_is_grounded(start_raw, resume_norm) and _date_is_grounded(end_raw, resume_norm)
        start = parse_month(start_raw) if grounded else None
        end = parse_month(end_raw) if grounded else None
        facts.roles.append(Role(
            title=title, company=company, start=start, end=end,
            is_internship=item.get("is_internship") is True,
            relevant=item.get("relevant_to_job") is True,
            relevance_reason=_str(item.get("relevance_reason")),
        ))
    if dropped_roles:
        facts.warnings.append(f"Ignored {dropped_roles} role(s) that could not be found in the resume text.")

    dropped_quals = 0
    for item in data.get("qualifications") or []:
        if not isinstance(item, dict):
            continue
        degree = _str(item.get("degree_as_written"))
        institution = _str(item.get("institution"))
        if not degree or not any(v and _norm(v) in resume_norm for v in (degree, institution)):
            dropped_quals += 1
            continue
        relation = (_str(item.get("field_relation_to_requirement")) or "unknown").lower()
        facts.qualifications.append(Qualification(
            degree_raw=degree,
            level=degree_level(degree, _str(item.get("degree_level"))),
            field=_str(item.get("field")),
            institution=institution,
            year=_str(item.get("year")),
            relation=relation if relation in {"same", "related", "unrelated", "unknown"} else "unknown",
        ))
    if dropped_quals:
        facts.warnings.append(f"Ignored {dropped_quals} qualification(s) that could not be found in the resume text.")
    return facts


def extract_facts(resume_text: str, jd: JDProfile, llm) -> ResumeFacts:
    return parse_facts(llm.generate(build_prompt(resume_text, jd)), resume_text)
