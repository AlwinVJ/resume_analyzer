from src.person2.skill_normalizer import (
    normalize_skill,
    normalize_skills
)


# Exact Match
def test_exact_match():

    result = normalize_skill(
        "python"
    )

    assert result == "python"


# Typo Correction
def test_typo_python():

    result = normalize_skill(
        "pyhton"
    )

    assert result == "python"


def test_typo_docker():

    result = normalize_skill(
        "dockerr"
    )

    assert result == "docker"


# Alias Normalization
def test_alias_aws():

    result = normalize_skill(
        "amazon web services"
    )

    assert result == "aws"


def test_alias_javascript():

    result = normalize_skill(
        "js"
    )

    assert result == "javascript"


def test_alias_postgresql():

    result = normalize_skill(
        "postgres"
    )

    assert result == "postgresql"


# Skill List Normalization
def test_normalize_skill_list():

    result = normalize_skills(
        [
            "pyhton",
            "dockerr"
        ]
    )

    assert result == [
        "python",
        "docker"
    ]