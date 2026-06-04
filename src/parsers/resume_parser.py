import re

from src.utils.logger import logger

class ResumeParser:
    SECTION_HEADERS = {
        "professional summary": "professional_summary",
        "summary": "professional_summary",

        "education": "education",

        "technical skills": "technical_skills",
        "skills": "technical_skills",
        "core competencies": "technical_skills",

        "projects": "projects",

        "experience": "experience",
        "work experience": "experience",
        "professional experience": "experience",

        "certifications": "certifications"
    }

    @classmethod
    def parse(cls, text: str):
        logger.info("Parsing resume sections")

        sections = {}

        current_section = None

        lines = text.splitlines()

        for line in lines:
            cleaned_line = line.strip()
            if not cleaned_line:
                continue
            normalized_line = cleaned_line.lower()

            if normalized_line in cls.SECTION_HEADERS:
                current_section = cls.SECTION_HEADERS[normalized_line]
                sections[current_section] = ""
                continue

            if current_section:
                sections[current_section] += cleaned_line + "\n"
        
        for section in sections:
            sections[section] = sections[section].strip()
        
        logger.info(f"Detected {len(sections)} sections")

        return sections
