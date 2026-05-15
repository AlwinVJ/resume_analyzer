def calculate_weighted_score(resume_features):
    
    # Initialized hardcore weight for initial calculations
    weights = {
        "skill_overlap": 0.40,
        "semantic_similarity": 0.25,
        "experience_match": 0.25,
        "education_match": 0.10
    }

    breakdown = {}

    for key, value in weights.items():

        breakdown[key] = (
            resume_features.get(key, 0)
            * value
            * 100
        )

    final_score = sum(
        breakdown.values()
    )

    return {
        "final_score": round(
            final_score, 2
        ),
        "breakdown": {
            key: round(value, 2)
            for key, value
            in breakdown.items()
        }
    }


if __name__ == "__main__":

    sample_resume = {
        "skill_overlap": 0.80,
        "semantic_similarity": 0.75,
        "experience_match": 0.60,
        # "education_match": 1.00
    }

    result = calculate_weighted_score(sample_resume)

    print(result)