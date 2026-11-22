"""An AI outage must fail loudly (API 503), never turn into "0 skills matched"."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.errors import register_error_handlers
from src.schemas.errors import LLMOutputInvalidError
from src.skill_engine import SkillPipeline
from src.skill_engine.llm_provider import LLMProviderError
from tests.mocks import FakeLLMClient


def _down(prompt):
    raise LLMProviderError("The AI service rate limit was reached.", status=429, retry_after=12, retryable=True)


@pytest.mark.parametrize("resume", [
    {"technical_skills": "Python", "experience": "Built APIs with FastAPI"},  # resume extraction call
    {"technical_skills": "Python"},                                          # JD extraction call
])
def test_skill_pipeline_raises_on_outage(resume):
    with pytest.raises(LLMProviderError):
        SkillPipeline(llm_client=FakeLLMClient(handler=_down)).run(resume, "Need Python and Docker")


def test_skill_pipeline_raises_when_verification_call_fails():
    calls = []

    def handler(prompt):
        calls.append(prompt)
        if len(calls) == 1:   # resume extraction
            return '{"skills": []}'
        if len(calls) == 2:   # JD extraction
            return '{"skills": [{"name": "Docker", "requirement": "required"}]}'
        raise LLMOutputInvalidError("bad")  # verification

    with pytest.raises(LLMOutputInvalidError):
        SkillPipeline(llm_client=FakeLLMClient(handler=handler)).run(
            {"technical_skills": "Python", "experience": "Built APIs"}, "Need Docker")


def test_api_turns_app_errors_into_json():
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/boom")
    def boom():
        _down("x")

    response = TestClient(app).get("/boom")
    assert response.status_code == 503
    assert response.json() == {"detail": "The AI service rate limit was reached.", "error_code": "LLM_UNAVAILABLE"}
    assert response.headers["retry-after"] == "13"
