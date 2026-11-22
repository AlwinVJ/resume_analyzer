import pytest
from pydantic import ValidationError

from src.schemas import JDProfile, MatchResult, ScoreBreakdown, SkillGap
from src.scoring.weighted_score import get_verdict


def make_result(score: float, verdict: str) -> MatchResult:
    return MatchResult(
        final_score=score,
        verdict=verdict,
        breakdown=ScoreBreakdown(skill_overlap=score),
        skill_gap=SkillGap(),
    )


@pytest.mark.parametrize(
    "score, verdict",
    [(100, "Strong Match"), (80, "Strong Match"), (79.99, "Moderate Match"),
     (65, "Moderate Match"), (64.99, "Weak Match"), (0, "Weak Match")],
)
def test_verdict_thresholds_are_80_and_65(score, verdict):
    assert get_verdict(score) == verdict
    assert make_result(score, verdict).verdict == verdict


def test_verdict_inconsistent_with_score_rejected():
    with pytest.raises(ValidationError):
        make_result(70, "Strong Match")


@pytest.mark.parametrize("score", [-1, 100.01, 107])
def test_score_out_of_range_rejected(score):
    with pytest.raises(ValidationError):
        make_result(score, get_verdict(max(0, min(score, 100))))


def test_match_result_json_has_frontend_fields():
    data = make_result(85, "Strong Match").model_dump(mode="json")
    for key in ("final_score", "verdict", "breakdown", "insights", "skill_gap", "evidence", "created_at"):
        assert key in data
    for key in ("skill_overlap", "semantic_similarity", "experience_match", "education_match"):
        assert key in data["breakdown"]
    for key in ("matched_skills", "missing_skills", "overlap_ratio", "gap_count", "status"):
        assert key in data["skill_gap"]


def test_jdprofile_from_llm_parser_output():
    llm_output = {  # shape returned by JobDescriptionParserLLM.parse()
        "job_title": "ML Engineer",
        "experience_required": {"min": 3, "max": None},
        "required_skills": ["python", "pytorch"],
        "preferred_skills": ["kubernetes"],
        "education": ["Bachelor's in Computer Science"],
    }
    jd = JDProfile.from_llm_output(llm_output, jd_text="some jd")
    assert jd.experience_min == 3 and jd.experience_max is None
    assert jd.required_skills == ["python", "pytorch"]
    assert jd.education[0].raw == "Bachelor's in Computer Science"
    assert jd.raw_text_hash == JDProfile.hash_text("some jd")
    assert jd.to_skill_engine_input() == {
        "required_skills": ["python", "pytorch"], "preferred_skills": ["kubernetes"],
    }


def test_jdprofile_from_llm_output_handles_nulls():
    jd = JDProfile.from_llm_output({"job_title": None, "experience_required": None,
                                    "required_skills": None, "education": None})
    assert jd.required_skills == [] and jd.education == [] and jd.experience_min is None
