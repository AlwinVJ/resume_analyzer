import json
import re
from urllib import response

import ollama

from src.utils.logger import logger

class JobDescriptionParserLLM:

    MODEL_NAME = "llama3.1:8b"

    @classmethod
    def _build_prompt(cls, job_description: str):
        return f"""
You are an information extraction system.

Extract information from the job description.

Rules:

1. Return ONLY valid JSON.
2. Do not infer missing values.
3. If information is not explicitly mentioned, return null.
4. Do not add comments.
5. Do not explain.
6. Do not wrap the response in markdown.

Schema:

{{
    "job_title": "",
    "experience_required": {{
        "min": null,
        "max": null
    }},
    "required_skills": [],
    "preferred_skills": [],
    "education": []
}}

Job Description:

{job_description}
"""

    @classmethod
    def _call_llm(cls, prompt: str):
        logger.info("Sending request to Ollama")
        response = ollama.chat(
            model=cls.MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return (response["message"]["content"])
    
    
    @classmethod
    def _clean_response(cls, response: str):

        response = response.strip()

        response = response.replace("```json", "")

        response = response.replace("```", "")


        return response.strip()
    
    
    @classmethod
    def _parse_json(cls, response: str):
        print("\n========== CLEANED RESPONSE ==========\n")

        print(repr(response))

        print("\n=====================================\n")
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error("Failed to parse LLM JSON response")
            raise
    

    @classmethod
    def parse(cls, job_description: str):

        prompt = cls._build_prompt(job_description)

        raw_response = cls._call_llm(prompt)

        cleaned_response = cls._clean_response(raw_response)

        parsed_response = cls._parse_json(cleaned_response)

        validated_response = cls._validate_output(parsed_response)
        
        normalized_response = cls._normalize_output(validated_response)

        return normalized_response
    
    
    @classmethod
    def _validate_output(cls, parsed_response: dict):

        validated = {
            "job_title": None,
            "experience_required": {
                "min": None,
                "max": None
            },
            "required_skills": [],
            "preferred_skills": [],
            "education": []
        }

        # Job Title
        job_title = parsed_response.get("job_title")

        if isinstance(job_title, str):
            validated["job_title"] = job_title.strip()

        # Experience
        experience = parsed_response.get("experience_required", {})

        if isinstance(experience, dict):
            min_exp = experience.get("min")
            max_exp = experience.get("max")

            if isinstance(min_exp, int):
                validated["experience_required"]["min"] = min_exp

            if isinstance(max_exp, int):
                validated["experience_required"]["max"] = max_exp

        # Required Skills
        required_skills = parsed_response.get("required_skills", [])

        if isinstance(required_skills, list):
            validated["required_skills"] = required_skills

        elif isinstance(required_skills, str):
            validated["required_skills"] = [required_skills]

        # Preferred Skills
        preferred_skills = parsed_response.get("preferred_skills", [])

        if isinstance(preferred_skills, list):
            validated["preferred_skills"] = preferred_skills

        elif isinstance(preferred_skills, str):
            validated["preferred_skills"] = [preferred_skills]

        # Education
        education = parsed_response.get("education", [])

        if isinstance(education, list):
            validated["education"] = education

        elif isinstance(education, str):
            validated["education"] = [education]

        return validated
    

    @classmethod
    def _normalize_skill_list(cls, skills: list):

        normalized = []

        for skill in skills:

            if not isinstance(skill, str):
                continue

            cleaned = skill.strip().lower()

            if cleaned:
                normalized.append(cleaned)

        return list(dict.fromkeys(normalized))
    

    @classmethod
    def _normalize_output(cls, validated_response: dict):

        validated_response["required_skills"] = cls._normalize_skill_list(validated_response["required_skills"])

        validated_response["preferred_skills"] = cls._normalize_skill_list(validated_response["preferred_skills"])

        return validated_response