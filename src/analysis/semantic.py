"""Semantic similarity between a resume and a JD with the project's embedding model.

all-MiniLM-L6-v2 reads at most ~256 tokens per text, so both documents are split into
~120-word windows. For every JD window we take its best-matching resume window, then
average: "how much of the JD is covered somewhere in the resume".
The raw cosine (typically 0.1-0.7 for this model) is mapped linearly to 0..1 using
SEMANTIC_SIM_FLOOR / SEMANTIC_SIM_CEILING from settings.
"""
import threading

import numpy as np

from configs.settings import settings
from src.schemas.errors import ModelUnavailableError

WINDOW_WORDS = 120
STEP_WORDS = 90


def windows(text: str, size: int = WINDOW_WORDS, step: int = STEP_WORDS) -> list[str]:
    words = (text or "").split()
    if not words:
        return []
    if len(words) <= size:
        return [" ".join(words)]
    return [" ".join(words[i:i + size]) for i in range(0, max(1, len(words) - size + step), step)]


def resume_windows(sections: dict[str, str], full_text: str) -> list[str]:
    chunks = [w for text in sections.values() if text for w in windows(text)]
    return chunks or windows(full_text)


def scale(raw: float) -> float:
    floor, ceiling = settings.SEMANTIC_SIM_FLOOR, settings.SEMANTIC_SIM_CEILING
    return float(min(max((raw - floor) / (ceiling - floor), 0.0), 1.0))


class SemanticScorer:
    def __init__(self, encode=None):
        """encode: optional function list[str] -> array (tests pass a fake one)."""
        self._encode = encode
        self._lock = threading.Lock()

    def _get_encode(self):
        if self._encode is None:
            with self._lock:
                if self._encode is None:
                    try:
                        from src.rag.embedding import EmbeddingModel
                        self._encode = EmbeddingModel().encode
                    except Exception as e:
                        raise ModelUnavailableError(
                            "The embedding model could not be loaded. On first use it is downloaded "
                            "from Hugging Face, so an internet connection is needed once.") from e
        return self._encode

    def similarity(self, resume_chunks: list[str], jd_text: str) -> tuple[float, float]:
        """Return (raw cosine, scaled 0..1)."""
        jd_chunks = windows(jd_text)
        if not resume_chunks or not jd_chunks:
            return 0.0, 0.0
        encode = self._get_encode()
        vectors = np.asarray(encode(resume_chunks + jd_chunks), dtype="float32")
        vectors /= np.linalg.norm(vectors, axis=1, keepdims=True) + 1e-12
        resume_vecs, jd_vecs = vectors[:len(resume_chunks)], vectors[len(resume_chunks):]
        raw = float((jd_vecs @ resume_vecs.T).max(axis=1).mean())
        return raw, scale(raw)


semantic_scorer = SemanticScorer()
