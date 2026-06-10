import pandas as pd


class SkillRanker:

    def __init__(
        self,
        mapping_path=(
            "data/processed/"
            "occupation_skill_mapping.csv"
        )
    ):

        self.mapping_df = pd.read_csv(
            mapping_path
        )

        # Normalize columns
        self.mapping_df["occupation"] = (
            self.mapping_df["occupation"]
            .str.lower()
            .str.strip()
        )

        self.mapping_df["skill"] = (
            self.mapping_df["skill"]
            .str.lower()
            .str.strip()
        )

        self.mapping_df["relation_type"] = (
            self.mapping_df["relation_type"]
            .str.lower()
            .str.strip()
        )


    # Rank Missing Skills
    def rank_skills(
        self,
        missing_skills,
        occupation
    ):

        if not occupation:

            return [
                {
                    "skill": skill,
                    "importance": "Low"
                }
                for skill in missing_skills
            ]

        occupation = (
            occupation
            .lower()
            .strip()
        )

        # Get occupation profile
        occupation_profile = (
            self.mapping_df[
                self.mapping_df["occupation"]
                == occupation
            ]
        )

        ranked_skills = []

        for skill in missing_skills:

            skill = (
                skill
                .lower()
                .strip()
            )

            skill_match = (
                occupation_profile[
                    occupation_profile["skill"]
                    == skill
                ]
            )


            # Skill Found
            if not skill_match.empty:

                relation = (
                    skill_match.iloc[0][
                        "relation_type"
                    ]
                )

                if relation == "essential":

                    importance = "High"

                elif relation == "optional":

                    importance = "Medium"

                else:

                    importance = "Low"


            # Skill Not Found
            else:

                importance = "Low"

            ranked_skills.append(
                {
                    "skill": skill,
                    "importance": importance
                }
            )

        return ranked_skills


# Manual Testing
if __name__ == "__main__":

    ranker = SkillRanker()

    missing_skills = [
        "statistics",
        "tensorflow",
        "docker"
    ]

    occupation = "data scientist"

    result = ranker.rank_skills(
        missing_skills,
        occupation
    )

    print(result)