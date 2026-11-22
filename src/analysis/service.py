"""POST /analyze: one resume (PDF bytes) against one job description -> MatchResult.

LLM calls per request (Groq):
    job description parse ...... 1, only the first time a JD is seen (cached)
    skill engine (Athira) ...... 1-2 (resume skills, then verification if something is unmatched)
    profile facts .............. 1   (runs at the same time as the skill engine)
"""
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from configs.settings import settings
from src.analysis.dates import format_months
from src.analysis.education import assess_education, highest_label
from src.analysis.experience import assess_experience
from src.analysis.jd_cache import jd_cache as default_jd_cache
from src.analysis.pdf_text import extract_pdf_text
from src.analysis.profile import ResumeFacts, extract_facts
from src.analysis.semantic import resume_windows, semantic_scorer as default_semantic_scorer
from src.parsers.resume_parser import ResumeParser
from src.schemas.errors import InvalidInputError
from src.schemas.jd import JDProfile
from src.schemas.match import EvidenceItem, MatchResult, MissingSkill, ScoreBreakdown, SkillEvidence, SkillGap
from src.scoring.weighted_score import calculate_weighted_score, get_verdict, get_weights
from src.skill_engine import SkillPipeline
from src.skill_engine.gap_report import WEIGHTS as REQUIREMENT_WEIGHTS
from src.skill_engine.input_handler import DESCRIPTIVE_SECTIONS
from src.skill_engine.normalizer import normalize_skill, normalize_skills
from src.utils.logger import logger

MAX_EVIDENCE = 8
MAX_RECOMMENDATIONS = 6


def validate_job_description(jd_text: str | None) -> str:
    text = (jd_text or "").strip()
    if len(text) < settings.MIN_JD_CHARS:
        raise InvalidInputError(f"The job description is too short (minimum {settings.MIN_JD_CHARS} characters).")
    if len(text) > settings.MAX_JD_CHARS:
        raise InvalidInputError(f"The job description is too long (maximum {settings.MAX_JD_CHARS} characters).")
    return text


def _norm(text: str | None) -> str:
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def _name_from_file(file_name: str | None) -> str | None:
    stem = Path(file_name or "").stem
    stem = re.sub(r"(?i)[_\-\s]*(resume|cv)\b.*$", "", stem)
    stem = re.sub(r"[_\-]+", " ", stem).strip()
    return stem.title() if stem else None


def _skill_gap(report, jd: JDProfile, resume_text: str) -> tuple[SkillGap, float, list[EvidenceItem]]:
    """Adapt the skill engine's report to the API schema; return (gap, weighted overlap, evidence)."""
    required = set(normalize_skills(jd.required_skills))
    requirement = {skill: ("required" if skill in required else "preferred") for skill in report.jd_skills}

    def weight(skill: str) -> float:
        return REQUIREMENT_WEIGHTS[requirement.get(skill, "required")]

    total = sum(weight(s) for s in report.jd_skills)
    earned = sum(weight(s) for s in report.matched_skills) + 0.5 * sum(weight(s) for s in report.uncertain_skills)
    weighted = round(min(earned / total, 1.0), 4) if total else 0.0

    resume_norm = _norm(resume_text)
    evidence_map, evidence = {}, []
    for skill, info in (report.evidence_map or {}).items():
        quote = (info or {}).get("evidence")
        section = (info or {}).get("source_section") or "resume"
        grounded = bool(quote) and _norm(quote) in resume_norm
        evidence_map[skill] = SkillEvidence(source_section=section, quote=quote if grounded else None)
        if grounded and skill in report.matched_skills and len(evidence) < MAX_EVIDENCE:
            evidence.append(EvidenceItem(section=section.replace("_", " "), quote=quote, type="matched"))

    gap = SkillGap(
        resume_skills=report.resume_skills,
        jd_skills=report.jd_skills,
        matched_skills=report.matched_skills,
        missing_skills=[MissingSkill(skill=m.skill, importance=m.importance,
                                     type=requirement.get(m.skill, "required"))
                        for m in sorted(report.missing_skills, key=lambda m: -m.importance)],
        uncertain_skills=report.uncertain_skills,
        overlap_ratio=min(report.overlap_ratio, 1.0),
        weighted_overlap=weighted,
        gap_count=report.gap_count,
        evidence_map=evidence_map,
        status="ok" if report.jd_skills else "degraded",
        warnings=[] if report.jd_skills else ["No skills were found in the job description."],
    )
    return gap, weighted, evidence


def _recommendations(gap: SkillGap, experience, education, facts: ResumeFacts) -> list[str]:
    recs = []
    for missing in gap.missing_skills:
        if missing.type == "required":
            recs.append(f"Show concrete use of {missing.skill} (a required skill) in a role or project, if the candidate has it.")
    for skill in gap.uncertain_skills[:2]:
        recs.append(f"Make {skill} explicit: the resume only hints at it.")
    if experience.roles_without_dates:
        recs.append("Add start and end dates (month and year) to every role so experience can be measured.")
    if education.required and not education.qualifications:
        recs.append("Add an Education section with degree, field, institution and year.")
    return recs[:MAX_RECOMMENDATIONS]


def _insights(engine_insights: list[str], experience, education) -> list[str]:
    """Keep the engine's skill/semantic insights; describe experience and education from the
    assessments, so "could not be measured" is never reported as "below requirement"."""
    insights = list(engine_insights[:2])
    if experience.required_min_years is None:
        insights.append("No minimum experience stated in the job description")
    elif experience.compatibility is None:
        insights.append("Experience could not be measured (no readable dates in the resume)")
    else:
        insights.append(engine_insights[2])
    edu_text = {
        "Exceeds": "Education exceeds the requirement",
        "Meets": "Education requirement satisfied",
        "Partially meets": "Education partially meets the requirement",
        "Does not meet": "Education does not meet the requirement",
    }
    if not education.required:
        insights.append("No education requirement in the job description")
    elif not education.qualifications:
        insights.append("No qualification found in the resume")
    elif education.compatibility is None:
        insights.append("Education level could not be determined")
    else:
        insights.append(edu_text[education.compatibility])
    return insights


def _summary(verdict: str, gap: SkillGap, experience, education) -> str:
    parts = [f"Matches {len(gap.matched_skills)} of {len(gap.jd_skills)} job skills"]
    if experience.required_min_years and experience.relevant_months is not None:
        parts.append(f"{format_months(experience.relevant_months)} of relevant experience "
                     f"against {experience.required_min_years}+ years required")
    if education.compatibility:
        parts.append(f"education {education.compatibility.lower()} the requirement"
                     if education.compatibility != "Does not meet" else "education does not meet the requirement")
    return f"{verdict}: " + "; ".join(parts) + "."


class AnalysisService:
    def __init__(self, llm=None, jd_cache=None, semantic_scorer=None):
        self._llm = llm
        self.jd_cache = jd_cache or default_jd_cache
        self.semantic = semantic_scorer or default_semantic_scorer

    def _get_llm(self):
        if self._llm is None:
            from src.skill_engine.llm_provider import GroqProvider
            return GroqProvider()
        return self._llm

    def analyze(self, file_bytes: bytes, file_name: str | None, job_description: str | None) -> MatchResult:
        jd_text = validate_job_description(job_description)
        resume_text, _pages = extract_pdf_text(file_bytes, file_name)
        warnings: list[str] = []

        llm = self._get_llm()
        jd, cached = self.jd_cache.get(jd_text, llm)
        logger.info("Analyzing %s (JD %s, level %s)", file_name, "cached" if cached else "parsed", jd.job_level)

        sections = ResumeParser.parse(resume_text)
        if not any(sections.get(s) for s in DESCRIPTIVE_SECTIONS + ["technical_skills"]):
            sections = {"experience": resume_text}
            warnings.append("No standard resume sections were detected; the whole text was analysed as one section.")

        llm_text = resume_text
        if len(llm_text) > settings.MAX_RESUME_CHARS_FOR_LLM:
            llm_text = llm_text[:settings.MAX_RESUME_CHARS_FOR_LLM]
            warnings.append(f"The resume is long; only the first {settings.MAX_RESUME_CHARS_FOR_LLM} characters were sent to the AI.")

        # The skill engine and the profile extraction are independent: run them together.
        with ThreadPoolExecutor(max_workers=2) as pool:
            skills_job = pool.submit(SkillPipeline(llm_client=llm).run, sections, jd.to_skill_engine_input())
            facts_job = pool.submit(extract_facts, llm_text, jd, llm)
            report = skills_job.result()
            facts = facts_job.result()
        warnings.extend(facts.warnings)

        gap, skill_feature, evidence = _skill_gap(report, jd, resume_text)
        warnings.extend(gap.warnings)
        experience, experience_feature = assess_experience(facts.roles, jd.experience_min)
        education, education_feature = assess_education(
            facts.qualifications, [e.raw for e in jd.education if e.raw])
        if experience.roles_without_dates:
            warnings.append(f"{experience.roles_without_dates} role(s) had no readable dates and were not counted.")

        raw_similarity, semantic_feature = self.semantic.similarity(resume_windows(sections, resume_text), jd_text)
        logger.info("Semantic similarity raw=%.3f scaled=%.3f", raw_similarity, semantic_feature)

        features = {
            "skill_overlap": skill_feature,
            "semantic_similarity": semantic_feature,
            "experience_match": experience_feature,
            "education_match": education_feature,
        }
        scored = calculate_weighted_score(features, job_role=jd.job_level or settings.DEFAULT_JOB_LEVEL)
        weights = get_weights(jd.job_level or settings.DEFAULT_JOB_LEVEL)
        # Whole-number score, and the verdict taken from that same number, so the score shown
        # everywhere ("80%") always agrees with its verdict (80 -> Strong Match).
        final_score = round(scored["final_score"])
        verdict = get_verdict(final_score)

        return MatchResult(
            final_score=final_score,
            verdict=verdict,
            summary=_summary(verdict, gap, experience, education),
            breakdown=ScoreBreakdown(**scored["breakdown"]),
            breakdown_max=ScoreBreakdown(**{k: round(v * 100, 2) for k, v in weights.items()}),
            insights=_insights(scored["insights"], experience, education),
            skill_gap=gap,
            evidence=evidence,
            recommendations=_recommendations(gap, experience, education, facts),
            warnings=warnings,
            candidate_name=facts.candidate_name or _name_from_file(file_name),
            file_name=file_name,
            job_title=jd.job_title,
            experience_years=round(experience.total_months / 12, 1) if experience.total_months is not None else None,
            education_level=highest_label(facts.qualifications),
            experience=experience,
            education=education,
        )
