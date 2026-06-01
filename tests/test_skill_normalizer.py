from src.person2.skill_normalizer import normalize_skill
from src.person2.skill_normalizer import normalize_skills


def test_exact_match():

    result = normalize_skill("python")

    assert result == "python"


def test_typo_python():

    result = normalize_skill("pyhton")

    assert result == "python"


def test_typo_docker():

    result = normalize_skill("dockerr")

    assert result == "docker"


def test_normalize_skill_list():

    result = normalize_skills(
        ["pyhton", "dockerr"]
    )

    assert result == ["python","docker"]