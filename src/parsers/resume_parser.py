import re

from src.utils.logger import logger

class ResumeParser:
    SECTION_HEADERS = {
        "professional summary": "professional_summary",
        "summary": "professional_summary",
        "profile": "professional_summary",
        "career objective": "professional_summary",
        "objective": "professional_summary",
        "about me": "professional_summary",

        "education": "education",
        "academic background": "education",
        "academic qualifications": "education",
        "educational qualifications": "education",
        "qualifications": "education",

        "technical skills": "technical_skills",
        "skills": "technical_skills",
        "key skills": "technical_skills",
        "skills & tools": "technical_skills",
        "skills and tools": "technical_skills",
        "core competencies": "technical_skills",
        "technologies": "technical_skills",
        "tech stack": "technical_skills",

        "projects": "projects",
        "academic projects": "projects",
        "personal projects": "projects",
        "key projects": "projects",

        "experience": "experience",
        "work experience": "experience",
        "professional experience": "experience",
        "work history": "experience",
        "employment history": "experience",
        "employment": "experience",
        "internships": "experience",
        "internship": "experience",
        "internship experience": "experience",

        "certifications": "certifications",
        "certificates": "certifications",
        "licenses & certifications": "certifications",
        "licenses and certifications": "certifications",
    }

    @classmethod
    def _header_key(cls, line: str) -> str:
        """'WORK EXPERIENCE:' / 'Skills -' / '## Projects' -> 'work experience' / 'skills' / 'projects'."""
        key = line.lower().strip()
        key = re.sub(r"^[#*•\-\s]+", "", key)
        key = re.sub(r"[\s:–—\-|]+$", "", key)
        return re.sub(r"\s+", " ", key)

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
            normalized_line = cls._header_key(cleaned_line)

            if normalized_line in cls.SECTION_HEADERS:
                current_section = cls.SECTION_HEADERS[normalized_line]
                # A repeated header (e.g. "Experience" then "Internships") adds to the
                # section instead of overwriting what was collected before.
                sections.setdefault(current_section, "")
                continue

            if current_section:
                sections[current_section] += cleaned_line + "\n"

        for section in sections:
            sections[section] = sections[section].strip()

        logger.info(f"Detected {len(sections)} sections")

        return sections
