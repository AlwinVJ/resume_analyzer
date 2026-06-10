from src.person2.occupation_resolver import (
    OccupationResolver
)


resolver = OccupationResolver()


# Exact Match
def test_exact_match():

    result = resolver.resolve(
        "Accountant"
    )

    assert (
        result["occupation"]
        == "accountant"
    )


# Alias Match
def test_alias_match():

    result = resolver.resolve(
        "Machine Learning Engineer"
    )

    assert (
        result["occupation"]
        == "artificial intelligence engineer"
    )


# Partial Match
def test_partial_match():

    result = resolver.resolve(
        "Senior Data Scientist"
    )

    assert (
        result["occupation"]
        == "data scientist"
    )


# Unknown Occupation
def test_unknown_occupation():

    result = resolver.resolve(
        "Unknown Role"
    )

    assert (
        result["occupation"]
        is None
    )