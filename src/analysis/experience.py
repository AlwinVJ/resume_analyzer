"""Experience: months from role dates, and compatibility with the JD minimum. No LLM here.

total_months      merged professional roles (overlaps counted once), internships excluded
relevant_months   merged professional roles the LLM marked as relevant to this job
internship_months merged internships, reported separately
The feature uses calculate_experience_match from the scoring engine; compatibility uses the
engine's insight thresholds (>= 0.75 High, >= 0.50 Medium, else Low).
"""
from dataclasses import dataclass

from src.analysis.dates import MonthIndex, format_months, merged_months
from src.schemas.match import ExperienceAssessment
from src.scoring.feature_engineering import calculate_experience_match


@dataclass
class Role:
    title: str | None
    company: str | None
    start: MonthIndex | None
    end: MonthIndex | None
    is_internship: bool = False
    relevant: bool = False
    relevance_reason: str | None = None

    @property
    def has_dates(self) -> bool:
        return self.start is not None and self.end is not None and self.start <= self.end


def compatibility_for(feature: float) -> str:
    if feature >= 0.75:
        return "High"
    if feature >= 0.50:
        return "Medium"
    return "Low"


def assess_experience(roles: list[Role], required_min_years: int | None) -> tuple[ExperienceAssessment, float]:
    """Return (assessment for the frontend, feature 0..1.2 for the scoring engine)."""
    dated = [r for r in roles if r.has_dates]
    undated = len(roles) - len(dated)
    professional = [(r.start, r.end) for r in dated if not r.is_internship]
    relevant = [(r.start, r.end) for r in dated if not r.is_internship and r.relevant]
    internships = [(r.start, r.end) for r in dated if r.is_internship]

    if roles and not dated:
        total = relevant_months = internship_months = None
    else:
        total = merged_months(professional)
        relevant_months = merged_months(relevant)
        internship_months = merged_months(internships)

    required = required_min_years if required_min_years and required_min_years > 0 else None
    note = f" {undated} role(s) without dates were not counted." if undated and dated else ""

    if required is None:
        assessment = ExperienceAssessment(
            total_months=total, relevant_months=relevant_months, internship_months=internship_months,
            roles_without_dates=undated, required_min_years=None, compatibility=None,
            basis="The job description states no minimum experience." + note)
        return assessment, 1.0

    if total is None:
        assessment = ExperienceAssessment(
            total_months=None, relevant_months=None, internship_months=None,
            roles_without_dates=undated, required_min_years=required, compatibility=None,
            basis="Could not measure experience: no role in the resume has readable dates.")
        return assessment, 0.0

    feature = calculate_experience_match(relevant_experience=relevant_months / 12, required_experience=required)
    if not roles:
        basis = f"No work experience found in the resume; {required}+ years required."
    else:
        basis = f"{format_months(relevant_months)} in relevant roles; {required}+ years required." + note
    assessment = ExperienceAssessment(
        total_months=total, relevant_months=relevant_months, internship_months=internship_months,
        roles_without_dates=undated, required_min_years=required,
        compatibility=compatibility_for(feature), basis=basis)
    return assessment, feature
