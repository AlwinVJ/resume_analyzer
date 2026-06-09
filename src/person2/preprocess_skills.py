import pandas as pd

from src.person2.utils.preprocessing import (
    normalize_text,
    normalize_aliases
)


# Generate Skills Dictionary
def generate_skills_dictionary():

    # Load ESCO Skills Dataset
    skills_df = pd.read_csv(
        "data/raw/esco/skills_en.csv"
    )

    # Keep Required Columns
    skills_df = skills_df[
        [
            "preferredLabel",
            "altLabels"
        ]
    ]

    # Rename Columns
    skills_df = skills_df.rename(
        columns={
            "preferredLabel": "skill",
            "altLabels": "skill_aliases"
        }
    )

    # Remove Invalid Rows
    skills_df = skills_df.dropna(
        subset=["skill"]
    )

    # Normalize Data
    skills_df["skill"] = (
        skills_df["skill"]
        .apply(normalize_text)
    )

    skills_df["skill_aliases"] = (
        skills_df["skill_aliases"]
        .apply(normalize_aliases)
    )

    # Remove Duplicate Skills
    skills_df = skills_df.drop_duplicates(
        subset=["skill"]
    )

    # Save Processed Dataset
    skills_df.to_csv(
        "data/processed/skills_dictionary.csv",
        index=False
    )

    print(
        f"Generated {len(skills_df)} skills"
    )


# Entry Point
if __name__ == "__main__":
    generate_skills_dictionary()