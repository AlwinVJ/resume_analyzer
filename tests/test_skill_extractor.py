from src.person2.skill_extractor import extract_skills


def test_extract_single_skill():

    text = "Experienced in Python."

    skills = extract_skills(text)

    assert "python" in skills


def test_extract_multiple_skills():

    text = "Experienced in Python, Docker and AWS."

    skills = extract_skills(text)

    assert "python" in skills
    assert "docker" in skills
    assert "aws" in skills


def test_extract_no_skills():

    text = "Excellent communication and leadership."

    skills = extract_skills(text)

    assert skills == []