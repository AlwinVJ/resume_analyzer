import pandas as pd

from src.person2.utils.preprocessing import (
    normalize_text
)


class OccupationResolver:

    def __init__(
        self,
        occupations_path="data/processed/occupations.csv"
    ):

        self.occupations_df = pd.read_csv(
            occupations_path
        )

        # Normalize occupation column once
        self.occupations_df["occupation"] = (
            self.occupations_df["occupation"]
            .fillna("")
            .apply(normalize_text)
        )

        # Normalize aliases once
        self.occupations_df["occupation_aliases"] = (
            self.occupations_df["occupation_aliases"]
            .fillna("")
            .apply(normalize_text)
        )

    def resolve(
        self,
        job_title=None
    ):

        if not job_title:
            return {
                "occupation": None,
                "confidence": 0.0
            }

        title = normalize_text(job_title)


        # 1. Exact Occupation Match
        for _, row in self.occupations_df.iterrows():

            occupation = row["occupation"]

            if occupation == title:

                return {
                    "occupation": occupation,
                    "confidence": 1.0
                }


        # 2. Exact Alias Match
        for _, row in self.occupations_df.iterrows():

            occupation = row["occupation"]

            aliases = row[
                "occupation_aliases"
            ].split("|")

            for alias in aliases:

                alias = normalize_text(alias)

                if alias == title:

                    return {
                        "occupation": occupation,
                        "confidence": 0.95
                    }


        # 3. Occupation Appears Inside Title
        for _, row in self.occupations_df.iterrows():

            occupation = row["occupation"]

            if occupation and occupation in title:

                return {
                    "occupation": occupation,
                    "confidence": 0.90
                }


        # No Match
        return {
            "occupation": None,
            "confidence": 0.0
        }


# Local Testing
if __name__ == "__main__":

    resolver = OccupationResolver()

    test_titles = [
        "Senior Data Scientist",
        "Machine Learning Engineer",
        "Python Developer",
        "Teacher",
        "Doctor",
        "Accountant"
    ]

    for title in test_titles:

        print(f"\nJob Title: {title}")

        result = resolver.resolve(title)

        print(result)