"""Skills-list parsing: brackets and category labels (src/skill_engine/resume_extractor.py)."""
from src.skill_engine.resume_extractor import extract_explicit_skills


def test_brackets_are_expanded_not_cut():
    assert extract_explicit_skills("Cloud & Deployment: AWS (EC2, S3), Heroku") == ["AWS", "EC2", "S3", "Heroku"]
    assert extract_explicit_skills("Containerization: Docker, Kubernetes (K8s)") == ["Docker", "Kubernetes", "K8s"]


def test_category_labels_are_not_skills():
    skills = extract_explicit_skills("Monitoring/Logging: Prometheus, Grafana\nOS: Linux")
    assert skills == ["Prometheus", "Grafana", "Linux"]


def test_label_with_nothing_after_colon_is_kept():
    assert extract_explicit_skills("Machine Learning:\nPython, C, R") == ["Machine Learning", "Python", "C", "R"]
