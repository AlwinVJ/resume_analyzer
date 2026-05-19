def calculate_experience_match(
    relevant_experience,
    required_experience
):
    # Calculate experience match score using relevant experience.

    if required_experience == 0:
        return 1.0

    experience_match = (
        relevant_experience
        / required_experience
    )
    MAX_EXPERIENCE_BONUS = 1.2

    return min(
        experience_match,
        MAX_EXPERIENCE_BONUS
    )


if __name__ == "__main__":

    result = (
        calculate_experience_match(
            relevant_experience=0,
            required_experience=0
        )
    )

    print(result)