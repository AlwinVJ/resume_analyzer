import json

from schemas.person2_input import Person2Input
from schemas.person2_output import (
    Person2Output,
    RankedSkill
)

from .skill_extractor import extract_skills
from .skill_normalizer import normalize_skills
from .gap_engine import analyze_skill_gap
from .occupation_resolver import OccupationResolver
from .skill_ranker import SkillRanker


# Initialize Components
occupation_resolver = OccupationResolver()

skill_ranker = SkillRanker()


# Main Pipeline
def run_person2_pipeline(
    resume_text: str,
    jd_text: str,
    job_title: str | None = None
):

    # Create Input Object
    person2_input = Person2Input(
        resume_text=resume_text,
        jd_text=jd_text,
        job_title=job_title
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

    # Resolve Occupation
    occupation_result = (
        occupation_resolver.resolve(
            person2_input.job_title
        )
    )

    occupation = (
        occupation_result["occupation"]
    )

    # Rank Missing Skills
    ranked_missing_skills = (
        skill_ranker.rank_skills(
            gap_analysis["missing_skills"],
            occupation
        )
    )

    # Convert to Pydantic Models
    ranked_missing_skills = [

        RankedSkill(
            skill=item["skill"],
            importance=item["importance"]
        )

        for item in ranked_missing_skills
    ]


    # Create Output Object
    person2_output = Person2Output(

        resume_skills=
        normalized_resume_skills,

        jd_skills=
        normalized_jd_skills,

        matched_skills=
        gap_analysis["matched_skills"],

        missing_skills=
        gap_analysis["missing_skills"],

        match_percentage=
        gap_analysis["match_percentage"],

        occupation=
        occupation,

        ranked_missing_skills=
        ranked_missing_skills
    )

    return person2_output


# Application Entry Point
if __name__ == "__main__":

    output = run_person2_pipeline(

        job_title="Data Scientist",

        resume_text="""
        Experienced in Python,
        SQL,
        AWS and Pandas.
        """,

        jd_text="""
        Looking for experience in
        Python,
        SQL,
        AWS,
        Statistics and TensorFlow.
        """
    )


    # Save Output
    with open(
        "outputs/person2_output.json",
        "w"
    ) as file:

        json.dump(
            output.model_dump(),
            file,
            indent=4
        )


    # Display Output
    print(
        output.model_dump()
    )