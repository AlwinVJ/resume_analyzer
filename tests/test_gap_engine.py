from src.person2.gap_engine import analyze_skill_gap


def test_full_match():

    result = analyze_skill_gap(
        ["python", "docker"],
        ["python", "docker"]
    )

    assert result["match_percentage"] == 100.0
    assert result["missing_skills"] == []


def test_partial_match():

    result = analyze_skill_gap(
        ["python"],
        ["python", "docker"]
    )

    assert result["match_percentage"] == 50.0
    assert result["missing_skills"] == [
        "docker"
    ]


def test_no_match():

    result = analyze_skill_gap(
        ["aws"],
        ["python", "docker"]
    )

    assert result["match_percentage"] == 0.0


def test_empty_jd():

    result = analyze_skill_gap(
        ["python"],
        []
    )

    assert result["match_percentage"] == 0.0