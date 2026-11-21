from pathlib import Path

from pydantic import SecretStr
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

    # --- LLM (Groq, OpenAI-compatible API) ---
    # The key is a SecretStr so it never shows up when settings are printed or logged.
    GROQ_API_KEY: SecretStr | None = None
    # llama-3.3-70b-versatile was shut down on the free tier on 2026-08-16; Groq recommends gpt-oss-120b.
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_TEMPERATURE: float = 0.1
    LLM_TIMEOUT_S: int = 60
    LLM_MAX_TOKENS: int = 4096        # cap on the reply length incl. reasoning (Groq: max_completion_tokens)
    LLM_REASONING_EFFORT: str = "low" # gpt-oss models only: low | medium | high
    LLM_MAX_RETRIES: int = 2          # extra attempts after a 429 / 5xx / network error
    LLM_MAX_RETRY_WAIT_S: float = 20  # if Groq asks us to wait longer than this, fail fast

    # --- API ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    MAX_UPLOAD_MB: int = 10
    MAX_PAGES: int = 10
    MIN_JD_CHARS: int = 50
    MAX_JD_CHARS: int = 20_000

    # --- /analyze ---
    MIN_RESUME_CHARS: int = 200            # less text than this = probably a scanned (image) PDF
    MAX_RESUME_CHARS_FOR_LLM: int = 15_000 # longer resumes are cut before being sent to the LLM
    JD_CACHE_SIZE: int = 64                # parsed job descriptions kept in memory (bulk = 1 parse)
    DEFAULT_JOB_LEVEL: str = "mid"         # used when the JD gives no level or years
    # Raw cosine similarity from all-MiniLM-L6-v2 is mapped linearly onto 0..1 between these
    # two values. Tune with: python -m scripts.check_semantic_calibration
    SEMANTIC_SIM_FLOOR: float = 0.15
    SEMANTIC_SIM_CEILING: float = 0.65

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