# Find Skill Gaps
def analyze_skill_gap(
    resume_skills,
    jd_skills
):

    # Remove Duplicate Skills
    resume_skills = list(
        dict.fromkeys(resume_skills)
    )

    jd_skills = list(
        dict.fromkeys(jd_skills)
    )

    # Initialize Results
    matched_skills = []

    missing_skills = []

    # Convert Resume Skills To Set
    resume_skill_set = set(
        resume_skills
    )

    # Compare JD Skills Against Resume Skills
    for skill in jd_skills:

        if skill in resume_skill_set:

            matched_skills.append(
                skill
            )

        else:

            missing_skills.append(
                skill
            )

    # Calculate Match Percentage
    if not jd_skills:

        match_percentage = 0

    else:

        match_percentage = (
            len(matched_skills)
            / len(jd_skills)
        ) * 100

    # Results
    return {

        "matched_skills": matched_skills,

        "missing_skills": missing_skills,

        "match_percentage": round(
            match_percentage,
            2
        )
    }



# Manual Testing
if __name__ == "__main__":

    resume_skills = [
        "python",
        "docker",
        "aws"
    ]

    jd_skills = [
        "python",
        "docker",
        "tensorflow",
        "kubernetes"
    ]

    result = analyze_skill_gap(
        resume_skills,
        jd_skills
    )

    print(result)