from scoring.feature_engineering import (
    calculate_experience_match,
    calculate_education_match,
)

from scoring.weighted_score import (
    calculate_weighted_score,
)


def build_resume_features(
    resume_data,
    jd_data,
):
    """
    Build normalized resume
    features for scoring.
    """

    experience_match = (
        calculate_experience_match(
            relevant_experience=
            resume_data[
                "relevant_experience"
            ],

            required_experience=
            jd_data[
                "required_experience"
            ],
        )
    )

    education_match = (
        calculate_education_match(
            candidate_education=
            resume_data[
                "education"
            ],

            required_degree=
            jd_data[
                "required_degree"
            ],

            required_field=
            jd_data[
                "required_field"
            ],
        )
    )

    return {
        "skill_overlap":
        resume_data[
            "skill_overlap"
        ],

        "semantic_similarity":
        resume_data[
            "semantic_similarity"
        ],

        "experience_match":
        experience_match,

        "education_match":
        education_match,
    }

# End to end resume scoring   
def score_resume(
    resume_data,
    jd_data,
):

    resume_features = (
        build_resume_features(
            resume_data,
            jd_data,
        )
    )

    return (
        calculate_weighted_score(
            resume_features
        )
    )

if __name__ == "__main__":

    resume_data = {
        "relevant_experience": 2,

        "education": [
            {
                "degree":
                "Bachelor's",

                "field":
                "Computer Science",
            },
            {
                "degree":
                "Master's",

                "field":
                "Communication",
            }
        ],

        "skill_overlap":
        0.80,

        "semantic_similarity":
        0.75,
    }

    jd_data = {
        "required_experience":
        3,

        "required_degree":
        "Bachelor's",

        "required_field":
        "Computer Science",
    }

    result = score_resume(
        resume_data,
        jd_data,
    )

    print(result)