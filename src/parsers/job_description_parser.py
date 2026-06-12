import re

from src.utils.logger import logger


class JobDescriptionParser:

    SKILL_KEYWORDS = {
        "python",
        "sql",
        "aws",
        "azure",
        "gcp",

        "machine learning",
        "deep learning",
        "nlp",

        "pytorch",
        "tensorflow",
        "scikit-learn",

        "transformers",
        "llm",
        "rag",

        "docker",
        "kubernetes",

        "fastapi",
        "rest api",

        "postgresql"
    }

    @classmethod
    def extract_skills(cls, job_description: str):

        logger.info("Extracting skills from job description")

        jd_lower = job_description.lower()

        detected_skills = []

        for skill in cls.SKILL_KEYWORDS:
            if skill in jd_lower:
                detected_skills.append(skill)

        logger.info(f"Detected {len(detected_skills)} skills")
        return sorted(detected_skills)

    @classmethod
    def build_query(cls, job_description: str):
        skills = cls.extract_skills(job_description)
        
        return " ".join(skills)