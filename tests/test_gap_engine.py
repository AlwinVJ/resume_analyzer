from src.person2.gap_engine import (
    analyze_skill_gap
)


# Full Match
def test_full_match():

    result = analyze_skill_gap(
        ["python", "docker"],
        ["python", "docker"]
    )

    assert (
        result["match_percentage"]
        == 100.0
    )

    assert (
        result["missing_skills"]
        == []
    )


# Partial Match
def test_partial_match():

    result = analyze_skill_gap(
        ["python"],
        ["python", "docker"]
    )

    assert (
        result["match_percentage"]
        == 50.0
    )

    assert (
        result["missing_skills"]
        == ["docker"]
    )


# No Match
def test_no_match():

    result = analyze_skill_gap(
        ["aws"],
        ["python", "docker"]
    )

    assert (
        result["match_percentage"]
        == 0.0
    )


# Empty JD
def test_empty_jd():

    result = analyze_skill_gap(
        ["python"],
        []
    )

    assert (
        result["match_percentage"]
        == 0.0
    )