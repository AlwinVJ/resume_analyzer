import pandas as pd

# Text Normalization
def normalize_text(text):

    if pd.isna(text):
        return ""

    return str(text).lower().strip()


# Alias Normalization
def normalize_aliases(value):

    if pd.isna(value):
        return ""

    aliases = [
        alias.strip().lower()
        for alias in str(value).split("\n")
        if alias.strip()
    ]

    return "|".join(aliases)


# Alias Merging
def merge_aliases(alias_1, alias_2):

    aliases = set()

    for alias_string in [alias_1, alias_2]:

        if pd.isna(alias_string):
            continue

        if not str(alias_string).strip():
            continue

        aliases.update(
            alias.strip().lower()
            for alias in str(alias_string).split("|")
            if alias.strip()
        )

    return "|".join(sorted(aliases))


# Alias Conflict Cleanup
# Remove aliases that already exist as canonical skills
def remove_skill_alias_conflicts(
    skill,
    aliases,
    canonical_skills
):

    if pd.isna(aliases):
        return ""

    aliases = str(aliases).strip()

    if not aliases:
        return ""

    cleaned_aliases = []

    for alias in aliases.split("|"):

        alias = alias.strip().lower()

        if not alias:
            continue

        # Remove self-reference
        if alias == skill:
            continue

        # Remove alias if it already exists as a canonical skill elsewhere
        if alias in canonical_skills:
            continue

        cleaned_aliases.append(alias)

    return "|".join(
        sorted(set(cleaned_aliases))
    )