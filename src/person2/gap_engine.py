# Find skill gaps
def analyze_skill_gap(
    resume_skills,
    jd_skills
):

    matched_skills = []

    missing_skills = []

    # Compare JD skills against resume skills
    for skill in jd_skills:

        if skill in resume_skills:

            matched_skills.append(
                skill
            )

        else:

            missing_skills.append(
                skill
            )

    # Calculate match percentage
    if len(jd_skills) == 0:

        match_percentage = 0

    else:

        match_percentage = (
            len(matched_skills)
            / len(jd_skills)
        ) * 100

    # Return gap analysis results
    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": round(match_percentage,2)
    }




# Manual testing
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
