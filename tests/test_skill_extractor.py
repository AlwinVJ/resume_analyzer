from src.person2.skill_extractor import (
    extract_skills
)


# Single Skill Extraction
def test_extract_single_skill():

    text = "Experienced in Python."

    skills = extract_skills(text)

    assert "python" in skills


# Multiple Skill Extraction
def test_extract_multiple_skills():

    text = """
    Experienced in Python,
    Docker and AWS.
    """

    skills = extract_skills(text)

    assert "python" in skills

    assert "docker" in skills

    assert "aws" in skills


# Alias Extraction
def test_extract_aliases():

    text = """
    Experienced in
    Amazon Web Services,
    Postgres and JS.
    """

    skills = extract_skills(text)

    assert "amazon web services" in skills

    assert "postgres" in skills

    assert "js" in skills


# No Skill Extraction
def test_extract_no_skills():

    text = """
    The weather is nice today.
    The cat is sleeping.
    """

    skills = extract_skills(text)

    assert skills == []