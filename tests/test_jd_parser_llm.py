"""Offline tests for JobDescriptionParserLLM using a fake LLM client."""
import json

import pytest

from src.parsers.job_description_parser_llm import JobDescriptionParserLLM as Parser
from src.schemas import JDProfile
from src.schemas.errors import InvalidInputError, LLMOutputInvalidError, LLMUnavailableError
from tests.mocks import FakeLLMClient

JD = "Senior ML Engineer. 3+ years with Python and PyTorch required. AWS is a plus. B.Tech in CS."


def parse(llm_output):
    raw = llm_output if isinstance(llm_output, str) else json.dumps(llm_output)
    return Parser.parse(JD, llm_client=FakeLLMClient(default_response=raw))


def test_clean_output_is_normalised():
    result = parse({
        "job_title": " Senior ML Engineer ",
        "experience_required": {"min": 3, "max": None},
        "required_skills": ["Python", "PyTorch", "python"],
        "preferred_skills": ["AWS", "Python"],
        "education": ["B.Tech in CS"],
    })
    assert result == {
        "job_title": "Senior ML Engineer",
        "experience_required": {"min": 3, "max": None},
        "required_skills": ["python", "pytorch"],
        "preferred_skills": ["aws"],          # "python" is already required
        "education": ["B.Tech in CS"],
    }


def test_prompt_wraps_jd_in_tags():
    fake = FakeLLMClient(default_response="{}")
    Parser.parse(JD, llm_client=fake)
    assert f"<job_description>\n{JD}\n</job_description>" in fake.history[0]


def test_messy_types_are_coerced():
    result = parse({
        "job_title": 123,
        "experience_required": {"min": "3-5 years", "max": None},
        "required_skills": "Python, FastAPI; Cloud (AWS, GCP)",
        "preferred_skills": None,
        "education": "Bachelor",
    })
    assert result["job_title"] is None
    assert result["experience_required"] == {"min": 3, "max": 5}
    assert result["required_skills"] == ["python", "fastapi", "cloud (aws, gcp)"]
    assert result["preferred_skills"] == []
    assert result["education"] == ["Bachelor"]


@pytest.mark.parametrize("value,expected", [
    (6, 6), ("6", 6), ("6+ years", 6), (2.5, 2), (True, None), ("many", None), (-1, None), (99, None),
])
def test_years_coercion(value, expected):
    assert Parser._to_years(value) == expected


def test_min_greater_than_max_is_swapped():
    result = parse({"experience_required": {"min": 8, "max": 5}})
    assert result["experience_required"] == {"min": 5, "max": 8}


def test_output_feeds_jdprofile():
    profile = JDProfile.from_llm_output(parse({"required_skills": ["Python"], "experience_required": {"min": 2}}), JD)
    assert profile.required_skills == ["python"] and profile.experience_min == 2
    assert profile.raw_text_hash == JDProfile.hash_text(JD)


def test_invalid_json_raises_output_invalid():
    with pytest.raises(LLMOutputInvalidError):
        parse("not json at all")


def test_non_object_json_raises_output_invalid():
    with pytest.raises(LLMOutputInvalidError):
        parse(["python"])


@pytest.mark.parametrize("bad", ["", "   ", None])
def test_empty_jd_is_rejected_without_calling_llm(bad):
    fake = FakeLLMClient()
    with pytest.raises(InvalidInputError):
        Parser.parse(bad, llm_client=fake)
    assert fake.history == []


def test_llm_outage_propagates():
    def down(prompt):
        raise LLMUnavailableError("down")
    with pytest.raises(LLMUnavailableError):
        Parser.parse(JD, llm_client=FakeLLMClient(handler=down))


def test_old_helper_scripts_still_work():
    # scripts/check_llm_validation.py and check_llm_normalization.py call these directly
    v = Parser._validate_output({"job_title": 123, "experience_required": {"min": "6"},
                                 "required_skills": "Python", "preferred_skills": None, "education": "Bachelor"})
    assert v["experience_required"]["min"] == 6 and v["required_skills"] == ["Python"]
    n = Parser._normalize_output({"required_skills": ["Python, FastAPI, API development"],
                                  "preferred_skills": ["AWS, Azure, GCP"]})
    assert n["required_skills"] == ["python", "fastapi", "api development"]
    assert n["preferred_skills"] == ["aws", "azure", "gcp"]
