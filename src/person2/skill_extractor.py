import pandas as pd
import spacy


# Load spacy English language model
nlp = spacy.load("en_core_web_sm")


# Add custom rule-based entity matcher
ruler = nlp.add_pipe(
    "entity_ruler",
    before="ner"
)


# Load skills dictionary
skills_df = pd.read_csv(
    "data/skills_dictionary.csv"
)


# Convert skills into EntityRuler patterns
patterns = []

for skill in skills_df["skill"]:

    tokens = skill.split()

    patterns.append(
        {
            "label": "SKILL",
            "pattern": [
                {"LOWER": token}
                for token in tokens
            ]
        }
    )


# Register patterns in NLP pipeline
ruler.add_patterns(patterns)


# Extract skills from resume 
def extract_skills(text):

    # Process resume text through NLP pipeline
    doc = nlp(text)

    extracted_skills = []

    # Collect detected skill entities
    for ent in doc.ents:

        if ent.label_ == "SKILL":

            extracted_skills.append(
                ent.text.lower()
            )

    # Remove duplicates
    return list(set(extracted_skills))


# Manual testing
if __name__ == "__main__":

    sample_resume = """
    Experienced in Python, Docker,
    TensorFlow and AWS.
    """

    extracted_skills = extract_skills(
        sample_resume
    )

    print(extracted_skills)