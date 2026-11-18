import os
import json
import re
import urllib.request
import urllib.error


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


# Send POST request to Ollama and return JSON response
def _post_json(url: str, payload: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
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


# Local Ollama client using qwen2.5:3b
class OllamaProvider:
    def __init__(self, model: str = None, base_url: str = None, timeout: int = 120):
        self.model = model or os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.timeout = timeout

    # Send prompt to Ollama and return JSON text
    def generate(self, prompt: str) -> str:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1},
        }
        try:
            data = _post_json(url, payload, timeout=self.timeout)
            return strip_markdown(data.get("message", {}).get("content", "{}"))
        except Exception as e:
            raise LLMProviderError(
                f"Ollama request failed: {e}. Ensure Ollama is running ('ollama run {self.model}')."
            ) from e


# Alias for compatibility
RealLLMProvider = OllamaProvider

