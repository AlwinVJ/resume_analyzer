"""Offline tests for the Groq provider: no network, no API key needed."""
import email.message
import io
import json
import urllib.error

import pytest

from src.schemas.errors import LLMOutputInvalidError, LLMUnavailableError
from src.skill_engine import llm_provider
from src.skill_engine.llm_provider import GroqProvider, LLMProviderError, OpenAICompatibleProvider


class FakeResponse:
    def __init__(self, body: dict):
        self._raw = json.dumps(body).encode("utf-8")

    def read(self):
        return self._raw

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def ok(content='{"skills": []}', finish_reason="stop"):
    return FakeResponse({"choices": [{"message": {"content": content}, "finish_reason": finish_reason}]})


def http_error(code, body="{}", retry_after=None):
    headers = email.message.Message()
    if retry_after is not None:
        headers["retry-after"] = str(retry_after)
    return urllib.error.HTTPError("https://x/chat/completions", code, "err", headers, io.BytesIO(body.encode()))


@pytest.fixture
def fake_http(monkeypatch):
    """Queue of responses/exceptions returned by urlopen; records requests and sleeps."""
    state = {"queue": [], "requests": [], "sleeps": []}

    def fake_urlopen(req, timeout=None):
        state["requests"].append(json.loads(req.data.decode("utf-8")))
        state.setdefault("headers", []).append({k.lower(): v for k, v in req.header_items()})
        item = state["queue"].pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    monkeypatch.setattr(llm_provider.urllib.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(llm_provider.time, "sleep", lambda s: state["sleeps"].append(s))
    return state


def provider(**kw):
    kw.setdefault("max_retries", 2)
    return GroqProvider(api_key="test-key", **kw)


def test_success_returns_json_text_and_sends_system_prompt_and_limits(fake_http):
    fake_http["queue"] = [ok('```json\n{"a": 1}\n```')]
    assert provider().generate("Return JSON") == '{"a": 1}'
    sent = fake_http["requests"][0]
    assert sent["messages"][0]["role"] == "system"
    assert sent["messages"][1] == {"role": "user", "content": "Return JSON"}
    assert sent["response_format"] == {"type": "json_object"}
    assert sent["max_completion_tokens"] > 0


def test_sends_custom_user_agent_not_python_urllib(fake_http):
    fake_http["queue"] = [ok()]
    provider().generate("x")
    agent = fake_http["headers"][0]["user-agent"]
    assert agent and "python-urllib" not in agent.lower()
    assert fake_http["headers"][0]["authorization"] == "Bearer test-key"


def test_cloudflare_1010_is_not_reported_as_a_bad_key(fake_http):
    fake_http["queue"] = [http_error(403, "error code: 1010")]
    with pytest.raises(LLMProviderError) as info:
        provider().generate("x")
    assert "1010" in info.value.message and "GROQ_API_KEY" not in info.value.message
    assert len(fake_http["requests"]) == 1


def test_gpt_oss_gets_low_reasoning_and_hidden_reasoning(fake_http):
    fake_http["queue"] = [ok()]
    provider(model="openai/gpt-oss-120b").generate("x")
    sent = fake_http["requests"][0]
    assert sent["reasoning_effort"] == "low" and sent["include_reasoning"] is False


def test_non_reasoning_models_do_not_get_reasoning_fields(fake_http):
    fake_http["queue"] = [ok()]
    provider(model="qwen/qwen3.6-27b").generate("x")
    assert "reasoning_effort" not in fake_http["requests"][0]


def test_unknown_model_error_names_the_model(fake_http):
    fake_http["queue"] = [http_error(404, '{"error": {"code": "model_not_found"}}')]
    with pytest.raises(LLMProviderError) as info:
        provider(model="llama-3.3-70b-versatile").generate("x")
    assert "llama-3.3-70b-versatile" in info.value.message and "GROQ_MODEL" in info.value.message


def test_429_waits_for_retry_after_then_succeeds(fake_http):
    fake_http["queue"] = [http_error(429, retry_after=3), ok()]
    assert provider().generate("x") == '{"skills": []}'
    assert fake_http["sleeps"] == [3.0]


def test_5xx_and_network_errors_are_retried(fake_http):
    fake_http["queue"] = [http_error(503), urllib.error.URLError("down"), ok()]
    assert provider().generate("x") == '{"skills": []}'
    assert len(fake_http["sleeps"]) == 2


def test_gives_up_after_max_retries_with_friendly_503_error(fake_http):
    fake_http["queue"] = [http_error(429, retry_after=1) for _ in range(3)]
    with pytest.raises(LLMProviderError) as info:
        provider().generate("x")
    assert isinstance(info.value, LLMUnavailableError)  # API maps this to 503
    assert "rate limit" in info.value.message
    assert len(fake_http["requests"]) == 3


def test_long_retry_after_fails_fast_instead_of_hanging(fake_http):
    fake_http["queue"] = [http_error(429, retry_after=600)]
    with pytest.raises(LLMProviderError):
        provider().generate("x")
    assert fake_http["sleeps"] == []


def test_bad_key_is_not_retried(fake_http):
    fake_http["queue"] = [http_error(401, '{"error": {"message": "Invalid API Key"}}')]
    with pytest.raises(LLMProviderError) as info:
        provider().generate("x")
    assert "GROQ_API_KEY" in info.value.message
    assert len(fake_http["requests"]) == 1


def test_json_validate_failed_retries_then_reports_invalid_output(fake_http):
    body = '{"error": {"code": "json_validate_failed"}}'
    fake_http["queue"] = [http_error(400, body) for _ in range(3)]
    with pytest.raises(LLMOutputInvalidError):
        provider().generate("x")


def test_truncated_answer_is_invalid_output(fake_http):
    fake_http["queue"] = [ok('{"skills": [', finish_reason="length")]
    with pytest.raises(LLMOutputInvalidError):
        provider().generate("x")


def test_missing_key_raises_clear_error(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setattr(llm_provider.settings, "GROQ_API_KEY", None)
    with pytest.raises(LLMProviderError, match="GROQ_API_KEY is not set"):
        GroqProvider()


def test_placeholder_key_is_treated_as_missing(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "your_groq_api_key_here")
    monkeypatch.setattr(llm_provider.settings, "GROQ_API_KEY", None)
    with pytest.raises(LLMProviderError):
        GroqProvider()


def test_repr_never_contains_the_key():
    p = OpenAICompatibleProvider(api_key="gsk_secret123", model="m")
    assert "gsk_secret123" not in repr(p)
