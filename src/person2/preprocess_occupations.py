import pandas as pd

from src.person2.utils.preprocessing import (
    normalize_text,
    normalize_aliases
)


# Generate Occupations Dataset
def generate_occupations_dataset():

    # Load ESCO Occupations Dataset
    occupations_df = pd.read_csv(
        "data/raw/esco/occupations_en.csv"
    )

    # Keep Required Columns
    occupations_df = occupations_df[
        [
            "preferredLabel",
            "altLabels"
        ]
    ]

    # Rename Columns
    occupations_df = occupations_df.rename(
        columns={
            "preferredLabel": "occupation",
            "altLabels": "occupation_aliases"
        }
    )

    # Remove Invalid Rows
    occupations_df = occupations_df.dropna(
        subset=["occupation"]
    )

    # Normalize Data
    occupations_df["occupation"] = (
        occupations_df["occupation"]
        .apply(normalize_text)
    )

    occupations_df["occupation_aliases"] = (
        occupations_df["occupation_aliases"]
        .apply(normalize_aliases)
    )

    # Remove Duplicate Occupations
    occupations_df = occupations_df.drop_duplicates(
        subset=["occupation"]
    )

    # Save Processed Dataset
    occupations_df.to_csv(
        "data/processed/occupations.csv",
        index=False
    )

    print(
        f"Generated {len(occupations_df)} occupations"
    )


# Entry Point
if __name__ == "__main__":
    generate_occupations_dataset()