import pandas as pd
from rapidfuzz import process


# Load skill taxonomy
skills_df = pd.read_csv(
    "data/skills_dictionary.csv"
)

skill_list = skills_df["skill"].tolist()



# Normalize single skill
def normalize_skill(skill):

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



# Normalize extracted skills
def normalize_skills(extracted_skills):

    normalized_skills = []

    for skill in extracted_skills:

        normalized_skills.append(
            normalize_skill(skill)
        )

    return list(
        dict.fromkeys(normalized_skills)
    )



# Manual testing
if __name__ == "__main__":

    extracted_skills = [
        "pyhton",
        "tensorflow",
        "dockerr"
    ]

    normalized_skills = normalize_skills(
        extracted_skills
    )

    print(normalized_skills)