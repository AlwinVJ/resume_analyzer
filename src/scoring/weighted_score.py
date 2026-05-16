# Function to give the verdict
def get_verdict(final_score):

    if final_score >= 80:
        return "Strong Match"

    elif final_score >= 65:
        return "Moderate Match"

    return "Weak Match"


# Function for reasoning
def generate_insights(resume_features):

    insights = []

    skill_overlap = resume_features.get("skill_overlap", 0)

    semantic_similarity = resume_features.get("semantic_similarity", 0)

    experience_match = resume_features.get("experience_match", 0)

    education_match = resume_features.get("education_match", 0)

    # Skills
    if skill_overlap >= 0.75:
        insights.append("Strong skill overlap")

    elif skill_overlap >= 0.50:
        insights.append("Moderate skill overlap")

    else:
        insights.append("Significant skill gaps")

    # Semantic similarity
    if semantic_similarity >= 0.75:
        insights.append("Strong semantic alignment")

    elif semantic_similarity >= 0.50:
        insights.append("Moderate semantic alignment")

    else:
        insights.append("Resume weakly aligned with JD")

    # Experience
    if experience_match >= 0.75:
        insights.append("Experience closely matches requirements")

    elif experience_match >= 0.50:
        insights.append("Experience partially meets requirements")

    else:
        insights.append("Experience below requirement")

    # Education
    if education_match == 1:
        insights.append("Education requirement satisfied")

    else:
        insights.append("Education mismatch")

    return insights


# Function to modify weight according to the job role
def get_weights(job_role):

    job_role = job_role.lower()

    if job_role == "fresher":

        return {
            "skill_overlap": 0.40,
            "semantic_similarity": 0.30,
            "experience_match": 0.10,
            "education_match": 0.20,
        }

    elif job_role == "mid":

        return {
            "skill_overlap": 0.35,
            "semantic_similarity": 0.25,
            "experience_match": 0.30,
            "education_match": 0.10,
        }

    elif job_role == "senior":

        return {
            "skill_overlap": 0.30,
            "semantic_similarity": 0.20,
            "experience_match": 0.40,
            "education_match": 0.10,
        }

    # Default fallback
    return {
        "skill_overlap": 0.40,
        "semantic_similarity": 0.25,
        "experience_match": 0.25,
        "education_match": 0.10,
    }


# Function to calculate the weighted score
def calculate_weighted_score(resume_features, job_role = "mid"):

    # Initialize weights according to the job role
    weights = get_weights(job_role)

    breakdown = {}

    for key, value in weights.items():

        breakdown[key] = resume_features.get(key, 0) * value * 100

    final_score = sum(breakdown.values())

    return {
        "final_score": round(final_score, 2),
        "verdict": get_verdict(final_score),
        "insights": generate_insights(resume_features),
        "breakdown": {key: round(value, 2) for key, value in breakdown.items()},
    }


if __name__ == "__main__":

    sample_resume = {
        "skill_overlap": 0.80,
        "semantic_similarity": 0.75,
        "experience_match": 0.60,
        # "education_match": 1.00
    }

    result = calculate_weighted_score(sample_resume, "senior")

    print(result)
