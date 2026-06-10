import pandas as pd

from src.person2.utils.preprocessing import (
    normalize_text,
    normalize_aliases,
    merge_aliases,
    remove_skill_alias_conflicts
)


# Configuration
MAX_WORDS = 4


# Build Extraction Dictionary
def build_extraction_dictionary():

    # Load ESCO Skills
    esco_df = pd.read_csv(
        "data/raw/esco/skills_en.csv"
    )

    # Keep only knowledge skills
    esco_df = esco_df[
        esco_df["skillType"] == "knowledge"
    ]

    # Keep required columns
    esco_df = esco_df[
        [
            "preferredLabel",
            "altLabels"
        ]
    ]

    # Rename columns
    esco_df = esco_df.rename(
        columns={
            "preferredLabel": "skill",
            "altLabels": "skill_aliases"
        }
    )

    # Remove invalid rows
    esco_df = esco_df.dropna(
        subset=["skill"]
    )

    # Normalize skill names
    esco_df["skill"] = (
        esco_df["skill"]
        .apply(normalize_text)
    )

    # Normalize aliases
    esco_df["skill_aliases"] = (
        esco_df["skill_aliases"]
        .apply(normalize_aliases)
    )


    # Keep Only Short Knowledge Skills
    esco_df = esco_df[
        esco_df["skill"]
        .str.split()
        .str.len()
        <= MAX_WORDS
    ]

    # Remove duplicate skills
    esco_df = esco_df.drop_duplicates(
        subset=["skill"]
    )

    print(
        f"ESCO knowledge skills retained: {len(esco_df)}"
    )


    # Load Custom Tech Skills
    custom_df = pd.read_csv(
        "data/raw/custom/tech_skills.csv"
    )

    custom_df["skill"] = (
        custom_df["skill"]
        .apply(normalize_text)
    )

    custom_df["skill_aliases"] = (
        custom_df["skill_aliases"]
        .fillna("")
        .astype(str)
        .str.lower()
        .str.strip()
    )


    # Merge Dictionaries
    merged_skills = {}

    # Add ESCO skills first
    for _, row in esco_df.iterrows():

        merged_skills[row["skill"]] = {
            "skill": row["skill"],
            "skill_aliases": row["skill_aliases"]
        }

    # Merge custom skills
    for _, row in custom_df.iterrows():

        skill = row["skill"]
        aliases = row["skill_aliases"]

        if skill in merged_skills:

            merged_skills[skill][
                "skill_aliases"
            ] = merge_aliases(
                merged_skills[skill]["skill_aliases"],
                aliases
            )

        else:

            merged_skills[skill] = {
                "skill": skill,
                "skill_aliases": aliases
            }


    # Convert To DataFrame
    final_df = pd.DataFrame(
        merged_skills.values()
    )


    # Remove Alias Conflicts
    canonical_skills = set(
        final_df["skill"]
        .apply(normalize_text)
    )

    final_df["skill_aliases"] = final_df.apply(
        lambda row: remove_skill_alias_conflicts(
            skill=row["skill"],
            aliases=row["skill_aliases"],
            canonical_skills=canonical_skills
        ),
        axis=1
    )


    # Sort
    final_df = (
        final_df
        .sort_values(by="skill")
        .reset_index(drop=True)
    )

  
    # Save
    output_path = (
        "data/processed/"
        "extraction_skills_dictionary.csv"
    )

    final_df.to_csv(
        output_path,
        index=False
    )

    print(
        f"Generated {len(final_df)} extraction skills"
    )

    print(
        f"Saved to: {output_path}"
    )


# Entry Point
if __name__ == "__main__":
    build_extraction_dictionary()