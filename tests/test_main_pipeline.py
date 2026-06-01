from src.person2.main import run_person2_pipeline


def test_pipeline():

    result = run_person2_pipeline(
        resume_text="""
        Experienced in Python and Docker.
        """,
        jd_text="""
        Looking for Python, Docker
        and TensorFlow.
        """
    )

    assert "python" in result.matched_skills
    assert "docker" in result.matched_skills
    assert "tensorflow" in result.missing_skills
    assert result.match_percentage > 0