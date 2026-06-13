from src.services.screening_service import (
    ScreeningService
)

job_description = """
We are looking for a Machine Learning Engineer
with strong experience in Python, AWS,
PyTorch, NLP, Transformers and FastAPI.

The candidate should have experience
building RAG applications and deploying
models to production.
"""

results = (
    ScreeningService.rank_candidates(
        job_description
    )
)

print(
    "\n========== TOP CANDIDATES ==========\n"
)

for rank, (resume, score) in enumerate(results, start=1):
    print(f"{rank}. {resume}")

    print(f"Score: {score:.4f}")

    print()