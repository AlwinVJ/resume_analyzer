import pandas as pd


def generate_skills_dictionary():

    # Load ESCO skills dataset
    skills_df = pd.read_csv(
        "data/raw/esco/skills_en.csv"
    )

    # Keep only required columns
    skills_df = skills_df[
        [
            "preferredLabel",
            "altLabels"
        ]
    ]

    # Rename columns
    skills_df = skills_df.rename(
        columns={
            "preferredLabel": "skill",
            "altLabels": "skill_aliases"
        }
    )

    # Remove rows with missing skill names
    skills_df = skills_df.dropna(
        subset=["skill"]
    )

    # Remove duplicate skills
    skills_df = skills_df.drop_duplicates(
        subset=["skill"]
    )

    # Normalize skill names
    skills_df["skill"] = (
        skills_df["skill"]
        .str.lower()
        .str.strip()
    )

    # Normalize aliases
    skills_df["skill_aliases"] = (
        skills_df["skill_aliases"]
        .fillna("")
        .str.lower()
        .str.strip()
    )

    # Save processed dictionary
    skills_df.to_csv(
        "data/processed/skills_dictionary.csv",
        index=False
    )


if __name__ == "__main__":
    generate_skills_dictionary()