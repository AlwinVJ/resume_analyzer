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


def calculate_education_match(
    candidate_degree,
    candidate_field,
    required_degree,
    required_field,
):

    candidate_degree = candidate_degree.lower()
    candidate_field = candidate_field.lower()

    required_degree = required_degree.lower()
    required_field = required_field.lower()

    # Relevance
    exact_match = candidate_field == required_field

    related_match = candidate_field in RELATED_FIELDS.get(required_field, [])

    # Education levels
    candidate_level = EDUCATION_LEVELS.get(candidate_degree)

    required_level = EDUCATION_LEVELS.get(required_degree)

    # Alternative education
    if candidate_degree in ALTERNATIVE_EDUCATION:

        if exact_match or related_match:
            return 0.5

        return 0.2

    # Unknown education
    if candidate_level is None:
        return 0.3

    # Wrong field
    if not (exact_match or related_match):
        return 0.2

    # Higher or equal degree
    if candidate_level >= required_level:

        if related_match:

            if candidate_level > required_level:
                return 1.1

            return 1.0

        return 1.0

    # Lower degree


def calculate_education_match(
    candidate_degree,
    candidate_field,
    required_degree,
    required_field,
):

    candidate_degree = candidate_degree.lower()
    candidate_field = candidate_field.lower()

    required_degree = required_degree.lower()
    required_field = required_field.lower()

    # Relevance
    exact_match = candidate_field == required_field

    related_match = candidate_field in RELATED_FIELDS.get(required_field, [])

    # Education levels
    candidate_level = EDUCATION_LEVELS.get(candidate_degree)

    required_level = EDUCATION_LEVELS.get(required_degree)

    # Alternative education
    if candidate_degree in ALTERNATIVE_EDUCATION:

        if exact_match or related_match:
            return 0.5

        return 0.2

    # Unknown education
    if candidate_level is None:
        return 0.3

    # Wrong field
    if not (exact_match or related_match):
        return 0.2

    # Higher or equal degree
    if candidate_level >= required_level:

        if related_match:

            if candidate_level > required_level:
                return 1.1

            return 1.0

        return 1.0

    # Lower degree
    return 0.8


if __name__ == "__main__":

    result = calculate_education_match(
    candidate_degree="Bootcamp",
    candidate_field="Computer Science",
    required_degree="Bachelor's",
    required_field="Computer Science",
)

print(result)
