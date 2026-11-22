"""Unit tests for the analysis building blocks (no network, no models)."""
import io
import json
from datetime import date

import fitz
import pytest

from src.analysis.dates import format_months, merged_months, parse_month
from src.analysis.education import Qualification, assess_education, detect_levels, required_level
from src.analysis.experience import Role, assess_experience
from src.analysis.jd_cache import JDCache, infer_job_level
from src.analysis.pdf_text import extract_pdf_text, read_limited
from src.analysis.profile import parse_facts
from src.schemas import JDProfile
from src.schemas.errors import (CorruptPDFError, FileTooLargeError, InvalidInputError, LLMOutputInvalidError,
                                ScannedPDFError, UnsupportedFileError)
from tests.fakes_analysis import JD_TEXT, FakeGroq

TODAY = date(2026, 11, 21)


def m(value):
    return parse_month(value, TODAY)


# ---------- dates ----------
@pytest.mark.parametrize("value,expected", [
    ("2024-01", (2024, 1)), ("Jan 2024", (2024, 1)), ("January, 2024", (2024, 1)), ("01/2024", (2024, 1)),
    ("Sept 2023", (2023, 9)), ("Jun '22", (2022, 6)), ("2019", (2019, 7)), ("present", (2026, 11)),
])
def test_parse_month(value, expected):
    assert m(value) == expected[0] * 12 + expected[1] - 1


@pytest.mark.parametrize("value", ["2030-01", "2024-13", "soon", "", None, "1900"])
def test_parse_month_rejects_bad_or_future_dates(value):
    assert m(value) is None


def test_overlapping_roles_are_counted_once():
    assert merged_months([(m("Jan 2024"), m("Dec 2024")), (m("Jun 2024"), m("Mar 2025"))]) == 15
    assert merged_months([(m("Jan 2020"), m("Dec 2020")), (m("Jan 2022"), m("Dec 2022"))]) == 24


def test_format_months_matches_frontend_wording():
    assert format_months(51) == "4 years, 3 months"
    assert format_months(12) == "1 year"
    assert format_months(5) == "5 months"


# ---------- experience ----------
def role(start, end, internship=False, relevant=True):
    return Role("Engineer", "Acme", m(start), m(end), internship, relevant)


def test_experience_totals_relevant_and_internships():
    roles = [role("Jan 2022", "Dec 2023"), role("Jan 2024", "Dec 2024", relevant=False),
             role("Jun 2021", "Aug 2021", internship=True)]
    exp, feature = assess_experience(roles, 3)
    assert (exp.total_months, exp.relevant_months, exp.internship_months) == (36, 24, 3)
    assert exp.compatibility == "Medium"            # 2 of 3 years = 0.67
    assert feature == pytest.approx(24 / 12 / 3)


def test_experience_high_and_capped_bonus():
    exp, feature = assess_experience([role("Jan 2018", "Dec 2023")], 3)
    assert exp.compatibility == "High" and feature == 1.2   # engine bonus; capped to 1.0 when scoring


def test_experience_without_dates_is_not_guessed():
    exp, feature = assess_experience([Role("Engineer", "Acme", None, None)], 3)
    assert exp.total_months is None and exp.compatibility is None and exp.roles_without_dates == 1
    assert feature == 0.0


def test_no_roles_means_zero_experience_and_low():
    exp, feature = assess_experience([], 2)
    assert exp.total_months == 0 and exp.compatibility == "Low" and feature == 0.0


def test_no_requirement_is_not_evaluated():
    exp, feature = assess_experience([role("Jan 2024", "Dec 2024")], None)
    assert exp.compatibility is None and exp.total_months == 12 and feature == 1.0


# ---------- education ----------
@pytest.mark.parametrize("text,levels", [
    ("B.S. in Computer Science", ["bachelor"]), ("B.Tech CSE", ["bachelor"]), ("BE (Electronics)", ["bachelor"]),
    ("M.Tech in Data Science", ["master"]), ("MS in CS", ["master"]), ("MBA", ["master"]),
    ("PhD Physics", ["phd"]), ("Diploma in IT", ["diploma"]), ("must be good at ms office", []),
])
def test_detect_levels(text, levels):
    assert detect_levels(text) == levels


def test_required_level_takes_the_lowest_accepted():
    assert required_level(["Bachelor's or Master's in CS"]) == "bachelor"


REQ = ["Bachelor's in Computer Science or related field"]


@pytest.mark.parametrize("quals,compat,feature", [
    ([Qualification("M.Tech in Data Science", "master", relation="related")], "Exceeds", 1.0),
    ([Qualification("B.Tech in CS", "bachelor", relation="same")], "Meets", 1.0),
    ([Qualification("Diploma in IT", "diploma", relation="related")], "Partially meets", 0.8),
    ([Qualification("B.A. in History", "bachelor", relation="unrelated")], "Does not meet", 0.2),
    ([Qualification("Some course", None, relation="same")], None, 0.3),
])
def test_education_compatibility(quals, compat, feature):
    edu, value = assess_education(quals, REQ)
    assert edu.compatibility == compat and value == feature


def test_best_qualification_wins_and_highest_listed_first():
    edu, value = assess_education([Qualification("B.Tech in CS", "bachelor", relation="same"),
                                   Qualification("M.Tech in DS", "master", relation="related")], REQ)
    assert edu.compatibility == "Exceeds" and edu.qualifications[0].degree_raw == "M.Tech in DS"


def test_education_missing_or_not_required():
    edu, value = assess_education([], REQ)
    assert edu.compatibility is None and value == 0.0
    edu, value = assess_education([Qualification("B.Tech", "bachelor")], [])
    assert edu.compatibility is None and value == 1.0


# ---------- profile facts: grounding ----------
RESUME = "Alex Mercer\nSoftware Engineer | DataTech Solutions\nJan 2024 – Present\nB.S. in Computer Science | Berkeley | 2023"


def facts_from(data):
    return parse_facts(json.dumps(data), RESUME)


def test_invented_roles_dates_and_degrees_are_dropped():
    facts = facts_from({
        "candidate_name": "Alex Mercer",
        "roles": [
            {"title": "Software Engineer", "company": "DataTech Solutions", "start": "2024-01", "end": "present",
             "relevant_to_job": True},
            {"title": "Astronaut", "company": "NASA", "start": "2010-01", "end": "2015-01"},
            {"title": "Software Engineer", "company": "DataTech Solutions", "start": "2019-01", "end": "2020-01"},
        ],
        "qualifications": [
            {"degree_as_written": "B.S. in Computer Science", "degree_level": "bachelor"},
            {"degree_as_written": "PhD in Physics", "institution": "MIT"},
        ],
    })
    assert facts.candidate_name == "Alex Mercer"
    assert len(facts.roles) == 2                      # NASA dropped
    assert facts.roles[0].has_dates and facts.roles[0].relevant
    assert not facts.roles[1].has_dates               # 2019/2020 do not appear in the resume
    assert [q.degree_raw for q in facts.qualifications] == ["B.S. in Computer Science"]
    assert facts.qualifications[0].level == "bachelor"
    assert len(facts.warnings) == 2


def test_invented_name_is_dropped():
    assert facts_from({"candidate_name": "John Smith"}).candidate_name is None


@pytest.mark.parametrize("raw", ["not json", "[1, 2]"])
def test_bad_llm_output_raises(raw):
    with pytest.raises(LLMOutputInvalidError):
        parse_facts(raw, RESUME)


# ---------- job description cache and level ----------
def test_jd_is_parsed_once_per_text():
    llm, cache = FakeGroq(), JDCache()
    first, cached1 = cache.get(JD_TEXT, llm)
    second, cached2 = cache.get(JD_TEXT + "\n", llm)    # same text after strip
    assert (cached1, cached2) == (False, True) and llm.calls["jd"] == 1
    assert first.job_level == "mid" and first.education[0].degree_level == "bachelor"
    second.required_skills.append("mutated")
    assert "mutated" not in cache.get(JD_TEXT, llm)[0].required_skills  # callers get copies


@pytest.mark.parametrize("title,years,level", [
    ("Senior Data Engineer", 2, "senior"), ("ML Intern", None, "fresher"), ("Engineer", 0, "fresher"),
    ("Engineer", 4, "mid"), ("Engineer", 8, "senior"), ("Engineer", None, "mid"),
])
def test_infer_job_level(title, years, level):
    assert infer_job_level(JDProfile(job_title=title, experience_min=years)) == level


# ---------- PDF checks ----------
def make_pdf(text="", pages=1, password=None) -> bytes:
    doc = fitz.open()
    for _ in range(pages):
        doc.new_page().insert_text((72, 72), text, fontsize=9)
    kwargs = {"encryption": fitz.PDF_ENCRYPT_AES_256, "user_pw": password, "owner_pw": password} if password else {}
    data = doc.tobytes(**kwargs)
    doc.close()
    return data


LONG = "\n".join(f"Line {i}: Python engineer with Django and SQL experience." for i in range(10))


def test_valid_pdf_text_is_extracted():
    text, pages = extract_pdf_text(make_pdf(LONG), "cv.pdf")
    assert pages == 1 and "Django" in text


@pytest.mark.parametrize("data,name,error", [
    (b"", "cv.pdf", InvalidInputError),
    (b"hello world", "cv.docx", UnsupportedFileError),
    (b"hello world", "cv.pdf", UnsupportedFileError),          # not really a PDF
    (b"%PDF-1.7 garbage", "cv.pdf", CorruptPDFError),
])
def test_bad_uploads(data, name, error):
    with pytest.raises(error):
        extract_pdf_text(data, name)


def test_scanned_pdf_is_detected():
    with pytest.raises(ScannedPDFError):
        extract_pdf_text(make_pdf(""), "scan.pdf")


def test_too_many_pages():
    with pytest.raises(InvalidInputError, match="pages"):
        extract_pdf_text(make_pdf(LONG, pages=11), "long.pdf")


def test_password_protected_pdf():
    with pytest.raises(CorruptPDFError, match="password"):
        extract_pdf_text(make_pdf(LONG, password="secret"), "locked.pdf")


def test_upload_size_limit_stops_reading_early():
    big = io.BytesIO(b"x" * (10 * 1024 * 1024 + 10))
    with pytest.raises(FileTooLargeError):
        read_limited(big)
    assert big.tell() == 10 * 1024 * 1024 + 1
