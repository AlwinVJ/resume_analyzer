import os
import json
import re
import urllib.request
import urllib.error
from abc import ABC, abstractmethod


# Load .env variables if python-dotenv is installed, or read directly from .env file
def _load_env_file():
    try:
        from dotenv import load_dotenv
        load_dotenv()
        return
    except ImportError:
        pass

    env_path = os.path.join(os.getcwd(), ".env")
    if os.path.isfile(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip("'\""))
        except Exception:
            pass


_load_env_file()


# Custom error for LLM failures
class LLMProviderError(Exception):
    pass


# Remove markdown code blocks (```json ... ```) to get clean JSON
def strip_markdown(text: str) -> str:
    if not text or not isinstance(text, str):
        return "{}"
    cleaned = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    return match.group(1).strip() if match else cleaned


# Send POST request and return JSON response
def _post_json(url: str, payload: dict, headers: dict = None, timeout: int = 60) -> dict:
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=req_headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="replace")
        raise LLMProviderError(f"HTTP {e.code}: {err_msg}") from e
    except Exception as e:
        raise LLMProviderError(f"Request failed: {e}") from e


# Abstract base provider defining the common LLM interface
class BaseLLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        pass


# Universal client for any OpenAI-compatible completions API (Groq, OpenAI, Together, vLLM)
class OpenAICompatibleProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: str = None,
        base_url: str = None,
        model: str = None,
        temperature: float = 0.1,
        timeout: int = 60,
    ):
        self.api_key = api_key or ""
        self.base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        self.model = model or "gpt-4o-mini"
        self.temperature = temperature
        self.timeout = timeout

    # Send prompt to OpenAI-compatible chat completions endpoint and return JSON text
    def generate(self, prompt: str) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.temperature,
            "response_format": {"type": "json_object"},
        }
        try:
            data = _post_json(url, payload, headers=headers, timeout=self.timeout)
            choices = data.get("choices", [])
            if not choices:
                raise LLMProviderError("No choices returned in API response")
            content = choices[0].get("message", {}).get("content", "{}")
            return strip_markdown(content)
        except Exception as e:
            raise LLMProviderError(f"LLM request failed: {e}") from e


# Concrete provider for Groq API using OpenAI-compatible endpoints
class GroqProvider(OpenAICompatibleProvider):
    def __init__(
        self,
        api_key: str = None,
        base_url: str = None,
        model: str = None,
        temperature: float = 0.1,
        timeout: int = 60,
    ):
        key = api_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise LLMProviderError(
                "GROQ_API_KEY is not set. Please add it to your .env file or environment variables."
            )
        url = base_url or os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        chosen_model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        super().__init__(
            api_key=key,
            base_url=url,
            model=chosen_model,
            temperature=temperature,
            timeout=timeout,
        )


