import pandas as pd
import spacy


# Load SpaCy Model
nlp = spacy.load(
    "en_core_web_sm"
)


# Add Entity Ruler
ruler = nlp.add_pipe(
    "entity_ruler",
    before="ner"
)


# Load Extraction Dictionary
skills_df = pd.read_csv(
    "data/processed/extraction_skills_dictionary.csv"
)


# Build Patterns
patterns = []

for _, row in skills_df.iterrows():

    skill = str(
        row["skill"]
    ).strip().lower()

    # Canonical Skill
    all_terms = [skill]

    # Aliases
    aliases = str(
        row["skill_aliases"]
    ).strip()

    if aliases and aliases != "nan":

        all_terms.extend(
            alias.strip().lower()
            for alias in aliases.split("|")
            if alias.strip()
        )

    # Create Pattern For Each Term
    for term in all_terms:

        patterns.append(
            {
                "label": "SKILL",
                "pattern": [
                    {"LOWER": token}
                    for token in term.split()
                ]
            }
        )


# Register Patterns
ruler.add_patterns(
    patterns
)


# Skill Extraction
def extract_skills(text):

    doc = nlp(text)

    extracted_skills = []

    for ent in doc.ents:

        if ent.label_ == "SKILL":

            extracted_skills.append(
                ent.text.lower()
            )

    # Remove Duplicates
    return list(
        dict.fromkeys(
            extracted_skills
        )
    )


# Manual Test
if __name__ == "__main__":

    sample_text = """
    Experienced in Python,
    Amazon Web Services,
    Docker,
    TensorFlow,
    PostgreSQL
    and Agile Development.
    """

    print(
        extract_skills(
            sample_text
        )
    )