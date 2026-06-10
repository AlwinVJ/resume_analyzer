import pandas as pd

from src.person2.utils.preprocessing import (
    normalize_text
)


# Configuration
MAX_WORDS = 4


# Generate Occupation-Skill Mapping
def generate_occupation_skill_mapping():

    # Load ESCO Dataset
    df = pd.read_csv(
        "data/raw/esco/occupationSkillRelations_en.csv"
    )

    # Keep Required Columns
    df = df[
        [
            "occupationLabel",
            "skillLabel",
            "relationType",
        ]
    ]

    # Rename Columns
    df = df.rename(
        columns={
            "occupationLabel": "occupation",
            "skillLabel": "skill",
            "relationType": "relation_type",
        }
    )

    # Remove Invalid Rows
    df = df.dropna(
        subset=[
            "occupation",
            "skill"
        ]
    )

    # Normalize Data
    df["occupation"] = (
        df["occupation"]
        .apply(normalize_text)
    )

    df["skill"] = (
        df["skill"]
        .apply(normalize_text)
    )

    df["relation_type"] = (
        df["relation_type"]
        .apply(normalize_text)
    )


    # Keep Only Short Skills
    df = df[
        df["skill"]
        .str.split()
        .str.len()
        <= MAX_WORDS
    ]


    # Remove Duplicate Mappings
    df = df.drop_duplicates(
        subset=[
            "occupation",
            "skill",
            "relation_type",
        ]
    )

    # Save Processed Dataset
    df.to_csv(
        "data/processed/occupation_skill_mapping.csv",
        index=False
    )

    print(
        f"Generated {len(df)} occupation-skill mappings"
    )


# Entry Point
if __name__ == "__main__":
    generate_occupation_skill_mapping()