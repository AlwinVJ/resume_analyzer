"""Education: degree levels and compatibility with the JD requirement. No LLM here.

The LLM (profile.py) reports, for each qualification, whether its field is the
"same", "related" or "unrelated" to the JD requirement. Everything else is rules.

Feature values follow calculate_single_education_match in src/scoring/feature_engineering.py:
    same/related field, level >= required ... 1.0  (higher level -> "Exceeds", equal -> "Meets")
    same/related field, lower level ......... 0.8  ("Partially meets")
    certificate / bootcamp, related field ... 0.5  ("Partially meets")
    unrelated field ........................... 0.2  ("Does not meet")
    unknown degree level ...................... 0.3  (compatibility not evaluated)
"""
import re
from dataclasses import dataclass

from src.schemas.match import EducationAssessment, EducationQualification

LEVEL_RANK = {"diploma": 1, "associate": 1, "bachelor": 2, "master": 3, "phd": 4}
ALTERNATIVE_LEVELS = {"certificate", "bootcamp", "online course"}
LEVEL_LABEL = {"diploma": "Diploma", "associate": "Associate degree", "bachelor": "Bachelor's degree",
               "master": "Master's degree", "phd": "PhD"}
KNOWN_LEVELS = set(LEVEL_RANK) | ALTERNATIVE_LEVELS | {"high_school", "other"}

# Long forms are matched case-insensitively; short forms (B.S., ME, MS, BA) only in capitals,
# so ordinary words like "be" or "ms" in a sentence are not mistaken for degrees.
_PATTERNS = [
    ("phd", re.compile(r"\b(ph\.?\s?d|doctorate|doctoral|d\.phil)\b", re.I), None),
    ("master", re.compile(r"\b(masters?|master's|m\.?\s?tech|m\.?\s?sc|msc|mba|mca|m\.?\s?com|post\s?graduate|postgraduate)\b", re.I),
     re.compile(r"\b(M\.?\s?S|M\.?\s?E|M\.?\s?A|MS|ME|MA)\b\.?")),
    ("bachelor", re.compile(r"\b(bachelors?|bachelor's|b\.?\s?tech|b\.?\s?sc|bsc|bca|bba|b\.?\s?com|undergraduate)\b", re.I),
     re.compile(r"\b(B\.?\s?S|B\.?\s?E|B\.?\s?A|BS|BE|BA)\b\.?")),
    ("diploma", re.compile(r"\b(diploma|polytechnic)\b", re.I), None),
    ("associate", re.compile(r"\bassociate'?s?\s+(degree|of)\b", re.I), None),
]


def detect_levels(text: str | None) -> list[str]:
    """All degree levels mentioned in a string, highest first."""
    if not text:
        return []
    found = []
    for level, long_form, short_form in _PATTERNS:
        if long_form.search(text) or (short_form and short_form.search(text)):
            found.append(level)
    return found


def degree_level(degree_text: str | None, llm_level: str | None = None) -> str | None:
    levels = detect_levels(degree_text)
    if levels:
        return levels[0]
    llm_level = (llm_level or "").strip().lower().replace(" ", "_")
    return llm_level if llm_level in KNOWN_LEVELS else None


def required_level(requirements: list[str]) -> str | None:
    """Lowest level that satisfies the JD ("Bachelor's or Master's" -> bachelor)."""
    levels = [lvl for req in requirements for lvl in detect_levels(req) if lvl in LEVEL_RANK]
    return min(levels, key=LEVEL_RANK.get) if levels else None


@dataclass
class Qualification:
    degree_raw: str
    level: str | None
    field: str | None = None
    institution: str | None = None
    year: str | None = None
    relation: str = "unknown"   # field vs JD requirement: same | related | unrelated | unknown

    def to_schema(self) -> EducationQualification:
        return EducationQualification(degree_raw=self.degree_raw, degree_level=self.level, field=self.field,
                                      institution=self.institution, year=self.year)


def _score(q: Qualification, req_level: str | None) -> tuple[float, str | None, str]:
    """(feature, compatibility, basis) for one qualification."""
    field_ok = q.relation in ("same", "related", "unknown")
    field_words = "the required field" if q.relation == "same" else "a related field"
    label = LEVEL_LABEL.get(q.level or "", q.degree_raw)

    if q.level in ALTERNATIVE_LEVELS:
        if field_ok:
            return 0.5, "Partially meets", f"{q.degree_raw} is not a degree, but it is in {field_words}"
        return 0.2, "Does not meet", f"{q.degree_raw} is not a degree and is in an unrelated field"
    if q.level not in LEVEL_RANK:
        return 0.3, None, f"Could not determine the level of '{q.degree_raw}'"
    if not field_ok:
        return 0.2, "Does not meet", f"{label} is in an unrelated field"
    if req_level is None:
        return 1.0, "Meets", f"{label} in {field_words}"
    req_label = LEVEL_LABEL[req_level]
    if LEVEL_RANK[q.level] > LEVEL_RANK[req_level]:
        return 1.0, "Exceeds", f"{label} in {field_words} exceeds the {req_label} requirement"
    if LEVEL_RANK[q.level] == LEVEL_RANK[req_level]:
        return 1.0, "Meets", f"{label} in {field_words} meets the {req_label} requirement"
    return 0.8, "Partially meets", f"{label} is below the {req_label} requirement"


def assess_education(qualifications: list[Qualification], requirements: list[str]) -> tuple[EducationAssessment, float]:
    """Return (assessment for the frontend, feature 0..1 for the scoring engine)."""
    ordered = sorted(qualifications, key=lambda q: LEVEL_RANK.get(q.level or "", 0), reverse=True)
    schema_quals = [q.to_schema() for q in ordered]

    if not requirements:
        return EducationAssessment(qualifications=schema_quals, required=[], compatibility=None,
                                   basis="The job description states no education requirement."), 1.0
    if not ordered:
        return EducationAssessment(qualifications=[], required=requirements, compatibility=None,
                                   basis="No qualification was found in the resume."), 0.0

    req_level = required_level(requirements)
    scored = [(_score(q, req_level), q) for q in ordered]
    (feature, compatibility, basis), _best = max(scored, key=lambda item: item[0][0])
    return EducationAssessment(qualifications=schema_quals, required=requirements,
                               compatibility=compatibility, basis=basis), feature


def highest_label(qualifications: list[Qualification]) -> str | None:
    if not qualifications:
        return None
    best = max(qualifications, key=lambda q: LEVEL_RANK.get(q.level or "", 0))
    return best.degree_raw
