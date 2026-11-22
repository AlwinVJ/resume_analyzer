"""POST /analyze end to end with real PDFs, a fake LLM and a fake embedder."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import api.main as main
from src.analysis.dates import merged_months, parse_month
from src.analysis.jd_cache import JDCache
from src.analysis.semantic import SemanticScorer
from src.analysis.service import AnalysisService
from src.skill_engine.llm_provider import LLMProviderError
from tests.fakes_analysis import FACTS_JSON, JD_TEXT, FakeGroq, fake_encode
from tests.test_analysis_units import LONG, make_pdf

ALEX = Path("data/resumes/Alex_Mercer_ML_Backend_Resume.pdf")


@pytest.fixture
def llm(monkeypatch):
    fake = FakeGroq()
    service = AnalysisService(llm=fake, jd_cache=JDCache(), semantic_scorer=SemanticScorer(encode=fake_encode))
    monkeypatch.setattr(main, "analysis_service", service)
    return fake


client = TestClient(main.app)


def post(path=ALEX, jd=JD_TEXT, name=None, data=None):
    content = data if data is not None else path.read_bytes()
    return client.post("/analyze", files={"file": (name or path.name, content, "application/pdf")},
                       data={"job_description": jd})


def test_analyze_alex_full_result(llm):
    response = post()
    assert response.status_code == 200, response.text
    r = response.json()

    # identity
    assert r["candidate_name"] == "Alex Mercer" and r["file_name"] == ALEX.name
    assert r["job_title"] == "Machine Learning Engineer"

    # skills: python, django, sql (listed), docker (listed), aws/tensorflow (preferred); kubernetes missing
    gap = r["skill_gap"]
    assert "kubernetes" in [m["skill"] for m in gap["missing_skills"]]
    assert gap["missing_skills"][0]["type"] == "required"
    assert "amazon web services" in gap["matched_skills"]
    assert 0 < gap["weighted_overlap"] <= 1

    # experience: Jan 2024 - present, relevant, 3+ years required
    months = merged_months([(parse_month("2024-01"), parse_month("present"))])
    exp = r["experience"]
    assert exp["total_months"] == months and exp["relevant_months"] == months
    assert exp["internship_months"] == 0 and exp["required_min_years"] == 3
    expected = "High" if months / 36 >= 0.75 else "Medium" if months / 36 >= 0.5 else "Low"
    assert exp["compatibility"] == expected
    assert r["experience_years"] == round(months / 12, 1)

    # education
    edu = r["education"]
    assert edu["qualifications"][0]["degree_raw"] == "B.S. in Computer Science"
    assert edu["qualifications"][0]["degree_level"] == "bachelor"
    assert edu["compatibility"] == "Meets"

    # score: points per feature never exceed the maxima and add up to the total
    assert r["breakdown_max"] == {"skill_overlap": 35.0, "semantic_similarity": 25.0,
                                  "experience_match": 30.0, "education_match": 10.0}
    for key, value in r["breakdown"].items():
        assert 0 <= value <= r["breakdown_max"][key]
    assert r["final_score"] == round(sum(r["breakdown"].values()))   # whole number
    assert isinstance(r["final_score"], (int, float)) and float(r["final_score"]).is_integer()
    assert r["verdict"] in ("Strong Match", "Moderate Match", "Weak Match")
    assert len(r["insights"]) == 4

    # evidence only contains quotes that really appear in the resume
    quotes = [e["quote"] for e in r["evidence"]]
    assert quotes and all("invented" not in q for q in quotes)
    assert any("kubernetes" in rec.lower() for rec in r["recommendations"])
    assert any("could not be found" in w for w in r["warnings"])    # the invented NASA role


def test_bulk_reuses_the_parsed_job_description(llm):
    for _ in range(3):
        assert post().status_code == 200
    assert llm.calls["jd"] == 1 and llm.calls["facts"] == 3


def test_all_sample_resumes_analyse(llm):
    for pdf in sorted(Path("data/resumes").glob("*_Resume.pdf")):
        response = post(pdf)
        assert response.status_code == 200, (pdf.name, response.text)
        assert 0 <= response.json()["final_score"] <= 100


def test_resume_without_dates_or_degree(llm, monkeypatch):
    llm.facts = {"candidate_name": None, "roles": [{"title": "Line 1", "start": None, "end": None}], "qualifications": []}
    r = post(data=make_pdf(LONG), name="taylor.pdf").json()
    assert r["experience"]["total_months"] is None and r["experience"]["compatibility"] is None
    assert r["education"]["qualifications"] == [] and r["education"]["compatibility"] is None
    assert r["breakdown"]["experience_match"] == 0 and r["breakdown"]["education_match"] == 0
    assert "could not be measured" in " ".join(r["insights"]).lower()
    assert r["candidate_name"] == "Taylor"                           # from the file name


@pytest.mark.parametrize("kwargs,status,code", [
    ({"jd": "too short"}, 422, "INVALID_INPUT"),
    ({"data": b"not a pdf", "name": "cv.docx"}, 415, "UNSUPPORTED_FILE"),
    ({"data": b"%PDF-1.4 broken", "name": "cv.pdf"}, 422, "CORRUPT_PDF"),
    ({"data": make_pdf(""), "name": "scan.pdf"}, 422, "SCANNED_PDF"),
])
def test_input_errors_are_readable(llm, kwargs, status, code):
    response = post(**kwargs)
    assert response.status_code == status
    body = response.json()
    assert body["error_code"] == code and isinstance(body["detail"], str) and body["detail"]


def test_missing_file_is_a_readable_422(llm):
    response = client.post("/analyze", data={"job_description": JD_TEXT})
    assert response.status_code == 422 and "PDF" in response.json()["detail"]


def test_llm_outage_is_a_503_with_cors(llm):
    def down(prompt):
        raise LLMProviderError("The AI service rate limit was reached.", status=429, retry_after=5, retryable=True)
    llm.handler = down
    response = client.post("/analyze", files={"file": (ALEX.name, ALEX.read_bytes(), "application/pdf")},
                           data={"job_description": JD_TEXT}, headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 503
    assert response.json()["error_code"] == "LLM_UNAVAILABLE"
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_unexpected_errors_become_500_json_with_cors(llm, monkeypatch):
    monkeypatch.setattr(main.analysis_service, "analyze", lambda *a, **k: 1 / 0)
    response = client.post("/analyze", files={"file": (ALEX.name, ALEX.read_bytes(), "application/pdf")},
                           data={"job_description": JD_TEXT}, headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 500 and response.json()["error_code"] == "INTERNAL_ERROR"
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
