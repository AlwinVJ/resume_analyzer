from src.person2.skill_ranker import (
    SkillRanker
)


ranker = SkillRanker()


# Essential Skill
def test_essential_skill():

    result = ranker.rank_skills(
        ["statistics"],
        "data scientist"
    )

    assert (
        result[0]["importance"]
        == "High"
    )


# Unknown Skill
def test_unknown_skill():

    result = ranker.rank_skills(
        ["tensorflow"],
        "data scientist"
    )

    assert (
        result[0]["importance"]
        == "Low"
    )


# Missing Occupation
def test_no_occupation():

    result = ranker.rank_skills(
        ["tensorflow"],
        None
    )

    assert (
        result[0]["importance"]
        == "Low"
    )