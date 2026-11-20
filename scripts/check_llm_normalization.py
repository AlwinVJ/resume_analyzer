from src.parsers.job_description_parser_llm import (
    JobDescriptionParserLLM
)

sample = {

    "required_skills": ["Python, FastAPI, API development", "LLMs, RAG pipelines, NLP"],

    "preferred_skills": ["AWS, Azure, GCP"]
}

result = (
    JobDescriptionParserLLM
    ._normalize_output(
        sample
    )
)

print(result)