from src.parsers.job_description_parser_llm import JobDescriptionParserLLM

broken_response = {

    "job_title": 123,

    "experience_required": {
        "min": "6"
    },

    "required_skills": "Python",

    "preferred_skills": None,

    "education": "Bachelor"
}

validated = (
    JobDescriptionParserLLM
    ._validate_output(
        broken_response
    )
)

print(validated)