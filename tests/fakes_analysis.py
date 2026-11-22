"""Fakes for /analyze tests: an LLM that answers each prompt type, and a word-hash embedder."""
import hashlib
import json
import re
from collections import Counter

import numpy as np

from tests.mocks import FakeLLMClient

JD_TEXT = """Machine Learning Engineer
We need 3+ years of experience building backend and ML systems in production.
Required: Python, Django, SQL, Docker, Kubernetes.
Nice to have: AWS, TensorFlow.
Education: Bachelor's in Computer Science or a related field."""

JD_JSON = {
    "job_title": "Machine Learning Engineer",
    "experience_required": {"min": 3, "max": None},
    "required_skills": ["Python", "Django", "SQL", "Docker", "Kubernetes"],
    "preferred_skills": ["AWS", "TensorFlow"],
    "education": ["Bachelor's in Computer Science or a related field"],
}

RESUME_SKILLS_JSON = {"skills": [
    {"name": "Python", "source_section": "experience",
     "evidence": "Architected and deployed scalable backend services utilizing Python and the Django MVT"},
    {"name": "Django", "source_section": "experience", "evidence": "Django REST Framework for web and mobile clients"},
    {"name": "AWS", "source_section": "experience", "evidence": "Configured AWS EC2 instances"},
    {"name": "Machine Learning", "source_section": "experience", "evidence": "an invented quote not in the resume"},
]}

VERIFY_JSON = {"verifications": [{"skill": "kubernetes", "status": "missing"}]}

FACTS_JSON = {
    "candidate_name": "Alex Mercer",
    "roles": [
        {"title": "Software Engineer", "company": "DataTech Solutions", "dates_as_written": "Jan 2024 – Present",
         "start": "2024-01", "end": "present", "is_internship": False, "relevant_to_job": True,
         "relevance_reason": "Backend and ML work in Python"},
        {"title": "Astronaut", "company": "NASA", "start": "2010-01", "end": "2015-01",
         "is_internship": False, "relevant_to_job": False},  # invented: must be dropped
    ],
    "qualifications": [
        {"degree_as_written": "B.S. in Computer Science", "degree_level": "bachelor", "field": "Computer Science",
         "institution": "University of California, Berkeley", "year": "2023", "field_relation_to_requirement": "same"},
    ],
}


class FakeGroq(FakeLLMClient):
    model = "fake-model"

    def __init__(self, facts=None, jd=None):
        super().__init__(handler=self._answer)
        self.facts = facts or FACTS_JSON
        self.jd = jd or JD_JSON
        self.calls = Counter()

    def _answer(self, prompt: str) -> str:
        if "<job_description>" in prompt:
            self.calls["jd"] += 1
            return json.dumps(self.jd)
        if "<resume>" in prompt:
            self.calls["facts"] += 1
            return json.dumps(self.facts)
        if "unmatched skills" in prompt:
            self.calls["verify"] += 1
            return json.dumps(VERIFY_JSON)
        self.calls["skills"] += 1
        return json.dumps(RESUME_SKILLS_JSON)


def fake_encode(texts):
    """Bag-of-words vectors: texts sharing words get a higher cosine, like a real embedder."""
    vectors = np.zeros((len(texts), 256), dtype="float32")
    for i, text in enumerate(texts):
        for word in re.findall(r"[a-z]+", text.lower()):
            vectors[i, int(hashlib.md5(word.encode()).hexdigest(), 16) % 256] += 1
    return vectors
