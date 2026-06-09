import json

from schemas.person2_input import Person2Input
from schemas.person2_output import Person2Output

from .skill_extractor import extract_skills
from .skill_normalizer import normalize_skills
from .gap_engine import analyze_skill_gap


# Main Pipeline
def run_person2_pipeline(
    resume_text: str,
    jd_text: str
):
    # Create Input Object
    person2_input = Person2Input(
        resume_text=resume_text,
        jd_text=jd_text
    )

    # Extract Skills
    resume_skills = extract_skills(
        person2_input.resume_text
    )

    jd_skills = extract_skills(
        person2_input.jd_text
    )

    # Normalize Skills
    normalized_resume_skills = normalize_skills(
        resume_skills
    )

    normalized_jd_skills = normalize_skills(
        jd_skills
    )

    # Analyze Skill Gaps
    gap_analysis = analyze_skill_gap(
        normalized_resume_skills,
        normalized_jd_skills
    )

    # Create Structured Output
    person2_output = Person2Output(
        resume_skills=normalized_resume_skills,
        jd_skills=normalized_jd_skills,
        matched_skills=gap_analysis["matched_skills"],
        missing_skills=gap_analysis["missing_skills"],
        match_percentage=gap_analysis["match_percentage"]
    )

    return person2_output


# Application Entry Point
if __name__ == "__main__":

    # Sample Input
    output = run_person2_pipeline(
        resume_text="""
        Experienced in Python, Docker and AWS.
        """,
        jd_text="""
        Looking for experience in Python,
        Docker, TensorFlow and Kubernetes.
        """
    )

    # Save Output to JSON
    with open(
        "outputs/person2_output.json",
        "w"
    ) as file:

        json.dump(
            output.model_dump(),
            file,
            indent=4
        )

    # Display Results
    print(
        output.model_dump()
    )