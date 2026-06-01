import json

from schemas.person2_input import Person2Input
from schemas.person2_output import Person2Output

from .skill_extractor import extract_skills
from .skill_normalizer import normalize_skills
from .gap_engine import analyze_skill_gap



# Sample input
person2_input = Person2Input(
    resume_text="""
    Experienced in Python, Docker and AWS.
    """,

    jd_text="""
    Looking for experience in Python,
    Docker, TensorFlow and Kubernetes.
    """
)


# Extract skills
resume_skills = extract_skills(
    person2_input.resume_text
)

jd_skills = extract_skills(
    person2_input.jd_text
)


# Normalize skills
normalized_resume_skills = normalize_skills(
    resume_skills
)

normalized_jd_skills = normalize_skills(
    jd_skills
)


# Analyze skill gaps
gap_analysis = analyze_skill_gap(
    normalized_resume_skills,
    normalized_jd_skills
)



# Create structured output
person2_output = Person2Output(
    resume_skills=normalized_resume_skills,
    jd_skills=normalized_jd_skills,
    matched_skills=gap_analysis["matched_skills"],
    missing_skills=gap_analysis["missing_skills"],
    match_percentage=gap_analysis["match_percentage"]
)



# Save output to json
with open(
    "outputs/person2_output.json",
    "w"
) as file:

    json.dump(
        person2_output.model_dump(),
        file,
        indent=4
    )



# Display results
print(
    person2_output.model_dump()
)