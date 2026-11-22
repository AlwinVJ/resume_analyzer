"""Parse each job description once and remember it.

Bulk screening sends one /analyze request per resume with the same JD; without this cache
the JD would be sent to the LLM once per resume.
"""
import re
import threading
from collections import OrderedDict

from configs.settings import settings
from src.analysis.education import detect_levels
from src.parsers.job_description_parser_llm import JobDescriptionParserLLM
from src.schemas.jd import JDProfile

_SENIOR = re.compile(r"\b(senior|sr\.?|lead|principal|staff|head|architect|manager)\b", re.I)
_FRESHER = re.compile(r"\b(intern|internship|trainee|fresher|graduate|entry[- ]level|junior|jr\.?)\b", re.I)


def infer_job_level(profile: JDProfile) -> str:
    """fresher | mid | senior: chooses the scoring weights (get_weights)."""
    title = profile.job_title or ""
    if _SENIOR.search(title):
        return "senior"
    if _FRESHER.search(title):
        return "fresher"
    years = profile.experience_min
    if years is None:
        return settings.DEFAULT_JOB_LEVEL
    if years <= 1:
        return "fresher"
    if years >= 6:
        return "senior"
    return "mid"


class JDCache:
    def __init__(self, max_size: int | None = None):
        self.max_size = max_size or settings.JD_CACHE_SIZE
        self._items: OrderedDict[str, JDProfile] = OrderedDict()
        self._lock = threading.Lock()

    def clear(self) -> None:
        with self._lock:
            self._items.clear()

    def get(self, jd_text: str, llm) -> tuple[JDProfile, bool]:
        """Return (profile, was_cached)."""
        key = f"{getattr(llm, 'model', type(llm).__name__)}:{JDProfile.hash_text(jd_text)}"
        with self._lock:
            if key in self._items:
                self._items.move_to_end(key)
                return self._items[key].model_copy(deep=True), True

        parsed = JobDescriptionParserLLM.parse(jd_text, llm_client=llm)
        profile = JDProfile.from_llm_output(parsed, jd_text)
        for education in profile.education:
            levels = detect_levels(education.raw)
            education.degree_level = levels[-1] if levels else None  # lowest level that is accepted
        profile.job_level = infer_job_level(profile)
        profile.jd_id = profile.raw_text_hash[:12] if profile.raw_text_hash else None

        with self._lock:
            self._items[key] = profile
            self._items.move_to_end(key)
            while len(self._items) > self.max_size:
                self._items.popitem(last=False)
        return profile.model_copy(deep=True), False


jd_cache = JDCache()
