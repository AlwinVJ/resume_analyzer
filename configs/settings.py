from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Embeddings / retrieval ---
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    TOP_K: int = 3
    SIMILARITY_THRESHOLD: float = 0.30
    SEMANTIC_WEIGHT: float = 0.7
    BM25_WEIGHT: float = 0.3

    # --- Paths (absolute, so the app works from any working directory) ---
    DATA_DIR: Path = PROJECT_ROOT / "data" / "resumes"
    STORAGE_DIR: Path = PROJECT_ROOT / "storage"

    # --- LLM (Ollama) ---
    LLM_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "qwen2.5:3b"
    LLM_TIMEOUT_S: int = 120

    # --- API ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    MAX_UPLOAD_MB: int = 10
    MAX_PAGES: int = 10
    MIN_JD_CHARS: int = 50
    MAX_JD_CHARS: int = 20_000

    @property
    def INDEX_PATH(self) -> Path:
        return self.STORAGE_DIR / "faiss_index.bin"

    @property
    def METADATA_PATH(self) -> Path:
        return self.STORAGE_DIR / "metadata.pkl"


settings = Settings()

# Backward-compatible names still imported by src/rag/*. Remove once those modules use `settings`.
MODEL_NAME = settings.EMBEDDING_MODEL
TOP_K = settings.TOP_K
SIMILARITY_THRESHOLD = settings.SIMILARITY_THRESHOLD
SEMANTIC_WEIGHT = settings.SEMANTIC_WEIGHT
BM25_WEIGHT = settings.BM25_WEIGHT