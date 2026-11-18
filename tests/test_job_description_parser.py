from src.parsers.job_description_parser import JobDescriptionParser

job_description = """
We are looking for a Machine Learning Engineer
with strong experience in Python, AWS,
PyTorch, NLP, Transformers and FastAPI.

The candidate should have experience
building RAG applications and deploying
models to production.
"""

skills = JobDescriptionParser.extract_skills(job_description)


query = JobDescriptionParser.build_query(job_description)

print("Detected Skills:")

for skill in skills:
    print(skill)

print("\nGenerated Query:")
print(query)