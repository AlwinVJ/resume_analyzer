"""Live check of the Groq setup. Uses your real key from .env (about 3 requests).

    python -m scripts.check_groq            # key + one tiny call + parse a sample JD
    python -m scripts.check_groq --skills   # also run the skill engine (3 more requests)
"""
import sys
import time

from configs.settings import settings
from src.schemas import JDProfile
from src.schemas.errors import AppError
from src.skill_engine.llm_provider import GroqProvider

SAMPLE_JD = """Machine Learning Engineer (Kochi)
We need 3-5 years of experience building ML systems in production.
Required: Python, PyTorch, FastAPI, SQL, Docker.
Nice to have: AWS, Kubernetes.
Education: Bachelor's in Computer Science or a related field."""

SAMPLE_RESUME = {
    "technical_skills": "Python, SQL, Docker, Git",
    "experience": "Built FastAPI services that served PyTorch models to 2M users. Deployed on AWS ECS.",
}


def step(title):
    print(f"\n== {title} ==")


def main():
    step("1. Configuration")
    try:
        provider = GroqProvider()
    except AppError as e:
        print("FAIL:", e.message)
        print("Fix: copy .env.example to .env in the project root and set GROQ_API_KEY.")
        return 1
    key = provider.api_key
    print(f"key   : {key[:4]}…{key[-4:]}  ({len(key)} chars)")
    print(f"model : {provider.model}")
    print(f"url   : {provider.base_url}")

    try:
        step("2. One tiny request")
        start = time.perf_counter()
        print("reply :", provider.generate('Return the JSON object {"status": "ok"}.'))
        print(f"time  : {time.perf_counter() - start:.2f}s")

        step("3. Parse a sample job description")
        from src.parsers.job_description_parser_llm import JobDescriptionParserLLM
        start = time.perf_counter()
        parsed = JobDescriptionParserLLM.parse(SAMPLE_JD, llm_client=provider)
        profile = JDProfile.from_llm_output(parsed, SAMPLE_JD)
        print(profile.model_dump_json(indent=2, exclude={"raw_text_hash"}))
        print(f"time  : {time.perf_counter() - start:.2f}s")

        if "--skills" in sys.argv:
            step("4. Skill engine on a sample resume")
            from src.skill_engine import SkillPipeline
            start = time.perf_counter()
            report = SkillPipeline(llm_client=provider).run(SAMPLE_RESUME, SAMPLE_JD)
            print("matched :", report.matched_skills)
            print("missing :", [m.skill for m in report.missing_skills])
            print("overlap :", report.overlap_ratio)
            print(f"time    : {time.perf_counter() - start:.2f}s")
    except AppError as e:
        print(f"FAIL ({e.error_code}):", e.message)
        return 1

    print("\nAll Groq checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
