import pandas as pd

def bootstrap_skill_dictionary():

    skills = [

        # Programming
        {"skill": "python", "category": "Programming"},
        {"skill": "java", "category": "Programming"},
        {"skill": "javascript", "category": "Programming"},
        {"skill": "c++", "category": "Programming"},
        {"skill": "go", "category": "Programming"},
        {"skill": "sql", "category": "Programming"},

        # Frameworks
        {"skill": "react", "category": "Frameworks"},
        {"skill": "django", "category": "Frameworks"},
        {"skill": "flask", "category": "Frameworks"},
        {"skill": "fastapi", "category": "Frameworks"},

        # ML / AI
        {"skill": "machine learning", "category": "ML"},
        {"skill": "deep learning", "category": "ML"},
        {"skill": "tensorflow", "category": "ML"},
        {"skill": "pytorch", "category": "ML"},
        {"skill": "scikit-learn", "category": "ML"},
        {"skill": "natural language processing", "category": "ML"},

        # Cloud
        {"skill": "aws", "category": "Cloud"},
        {"skill": "azure", "category": "Cloud"},
        {"skill": "google cloud platform", "category": "Cloud"},

        # DevOps
        {"skill": "docker", "category": "DevOps"},
        {"skill": "kubernetes", "category": "DevOps"},
        {"skill": "git", "category": "DevOps"},
        {"skill": "jenkins", "category": "DevOps"},

        # Databases
        {"skill": "postgresql", "category": "Databases"},
        {"skill": "mongodb", "category": "Databases"},
        {"skill": "mysql", "category": "Databases"},
        {"skill": "redis", "category": "Databases"}

    ]


    # Convert to DataFrame
    df = pd.DataFrame(skills)


    # Save dictionary
    df.to_csv(
        "data/skills_dictionary.csv",
        index=False
    )


    print(f"Dictionary saved with {len(df)} skills")

    print(df.head())


if __name__ == "__main__":

    bootstrap_skill_dictionary()