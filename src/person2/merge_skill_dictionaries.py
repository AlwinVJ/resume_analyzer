import pandas as pd

from src.person2.utils.preprocessing import (
    normalize_text,
    normalize_aliases,
    merge_aliases,
    remove_skill_alias_conflicts
)

# Merge ESCO + Custom Skill Dictionaries
def merge_skill_dictionaries():
  
    # Load Datasets
    esco_df = pd.read_csv(
        "data/processed/skills_dictionary.csv"
    )

    custom_df = pd.read_csv(
        "data/raw/custom/tech_skills.csv"
    )

    # Normalize ESCO Dataset
    esco_df["skill"] = (
        esco_df["skill"]
        .apply(normalize_text)
    )

    esco_df["skill_aliases"] = (
        esco_df["skill_aliases"]
        .apply(normalize_aliases)
    )

    # Normalize Custom Dataset
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

    # Build Lookup
    merged_skills = {}

    # Start with ESCO skills
    for _, row in esco_df.iterrows():

        merged_skills[row["skill"]] = {
            "skill": row["skill"],
            "skill_aliases": row["skill_aliases"]
        }

    # Merge Custom Skills
    for _, row in custom_df.iterrows():

        skill = row["skill"]
        aliases = row["skill_aliases"]

        # Skill already exists
        if skill in merged_skills:

            merged_skills[skill][
                "skill_aliases"
            ] = merge_aliases(
                merged_skills[skill]["skill_aliases"],
                aliases
            )

        # New skill
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

    # Sort Alphabetically
    final_df = (
        final_df
        .sort_values(by="skill")
        .reset_index(drop=True)
    )

    # Save Final Dictionary
    final_df.to_csv(
        "data/processed/final_skills_dictionary.csv",
        index=False
    )

    print(
        f"Generated {len(final_df)} skills"
    )

    print(
        "Saved to: "
        "data/processed/final_skills_dictionary.csv"
    )


# Entry Point
if __name__ == "__main__":
    merge_skill_dictionaries()