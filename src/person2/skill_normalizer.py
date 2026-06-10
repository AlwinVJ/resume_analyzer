import pandas as pd
from rapidfuzz import process


# Load Extraction Dictionary
skills_df = pd.read_csv(
    "data/processed/extraction_skills_dictionary.csv"
)

# Canonical skills
skill_list = (
    skills_df["skill"]
    .dropna()
    .str.lower()
    .tolist()
)

# Build Alias Lookup
alias_to_skill = {}

for _, row in skills_df.iterrows():

    skill = str(
        row["skill"]
    ).strip().lower()

    # Canonical skill maps to itself
    alias_to_skill[skill] = skill

    aliases = row.get(
        "skill_aliases",
        ""
    )

    if pd.notna(aliases):

        for alias in str(aliases).split("|"):

            alias = (
                alias
                .strip()
                .lower()
            )

            if alias:

                alias_to_skill[alias] = skill


# Normalize Single Skill
def normalize_skill(skill):

    skill = (
        str(skill)
        .strip()
        .lower()
    )

    # Exact Alias Match
    if skill in alias_to_skill:

        return alias_to_skill[skill]


    # Fuzzy Match
    match = process.extractOne(
        skill,
        skill_list
    )

    if match is None:

        return skill

    matched_skill = match[0]
    similarity_score = match[1]

    if similarity_score >= 80:

        return matched_skill

    return skill


# Normalize Skill List
def normalize_skills(extracted_skills):

    normalized_skills = []

    for skill in extracted_skills:

        normalized_skills.append(
            normalize_skill(skill)
        )

    return list(
        dict.fromkeys(
            normalized_skills
        )
    )


# Manual Test
if __name__ == "__main__":

    extracted_skills = [

        "pyhton",
        "dockerr",

        "amazon web services",
        "js",
        "postgres",

        "tensorflow"
    ]

    normalized_skills = normalize_skills(
        extracted_skills
    )

    print(
        normalized_skills
    )