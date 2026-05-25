EDUCATION_LEVELS = {
    "diploma": 1,
    "bachelor's": 2,
    "master's": 3,
    "phd": 4,
}

ALTERNATIVE_EDUCATION = {
    "bootcamp",
    "certification",
    "online course",
    "specialization",
}

RELATED_FIELDS = {
    "computer science": [
        "information technology",
        "software engineering",
        "artificial intelligence",
        "data science",
        "computer applications",
        "electronics",
    ]
}


def calculate_experience_match(
    relevant_experience,
    required_experience,
):
    """
    Calculate experience match score
    using relevant experience.
    """

    if required_experience == 0:
        return 1.0

    experience_match = (
        relevant_experience
        / required_experience
    )

    MAX_EXPERIENCE_BONUS = 1.2

    return min(
        experience_match,
        MAX_EXPERIENCE_BONUS,
    )


def calculate_single_education_match(
    candidate_degree,
    candidate_field,
    required_degree,
    required_field,
):
    """
    Calculate education match
    for a single degree entry.
    """

    candidate_degree = (
        candidate_degree.lower()
    )

    candidate_field = (
        candidate_field.lower()
    )

    required_degree = (
        required_degree.lower()
    )

    required_field = (
        required_field.lower()
    )

    # Relevance
    exact_match = (
        candidate_field
        == required_field
    )

    related_match = (
        candidate_field
        in RELATED_FIELDS.get(
            required_field,
            []
        )
    )

    # Education levels
    candidate_level = (
        EDUCATION_LEVELS.get(
            candidate_degree
        )
    )

    required_level = (
        EDUCATION_LEVELS.get(
            required_degree
        )
    )

    # Alternative education
    if (
        candidate_degree
        in ALTERNATIVE_EDUCATION
    ):

        if (
            exact_match
            or related_match
        ):
            return 0.5

        return 0.2

    # Unknown education
    if candidate_level is None:
        return 0.3

    # Wrong field
    if not (
        exact_match
        or related_match
    ):
        return 0.2

    # Higher or equal degree
    if (
        candidate_level
        >= required_level
    ):

        if related_match:

            # Bonus only for
            # higher degree
            if (
                candidate_level
                > required_level
            ):
                return 1.1

            return 1.0

        return 1.0

    # Lower degree
    return 0.8


def calculate_education_match(
    candidate_education,
    required_degree,
    required_field,
):
    """
    Evaluate all education
    entries and return the
    best match score.
    """

    scores = []

    for education in (
        candidate_education
    ):

        score = (
            calculate_single_education_match(
                candidate_degree=
                education["degree"],

                candidate_field=
                education["field"],

                required_degree=
                required_degree,

                required_field=
                required_field,
            )
        )

        scores.append(score)

    # Safety for empty list
    if not scores:
        return 0.0

    return max(scores)


if __name__ == "__main__":

    candidate_education = []

    result = (
        calculate_education_match(
            candidate_education=
            candidate_education,

            required_degree=
            "Bachelor's",

            required_field=
            "Computer Science",
        )
    )

    print(result)