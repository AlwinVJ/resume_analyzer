# Simple mock LLM client for fast tests without running Ollama
class FakeLLMClient:
    def __init__(self, default_response: str = "{}", handler=None):
        self.default_response = default_response
        self.handler = handler
        self.history = []

    def generate(self, prompt: str) -> str:
        self.history.append(prompt)
        if self.handler:
            return self.handler(prompt)
        return self.default_response

