import sys
import json
import unittest
from pathlib import Path

# Allow running this test file directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.skill_engine import SkillPipeline
from src.skill_engine.normalizer import normalize_skill, normalize_skills
from src.skill_engine.input_handler import validate_resume_sections
from src.skill_engine.resume_extractor import extract_explicit_skills
from src.skill_engine.matcher import match_exact
from src.skill_engine.gap_report import generate_skill_gap_report
from tests.mocks import FakeLLMClient


class TestSkillEngine(unittest.TestCase):
    # Test skill alias replacement and spacing
    def test_normalization(self):
        self.assertEqual(normalize_skill("  k8s  "), "kubernetes")
        self.assertEqual(normalize_skill("ML"), "machine learning")
        self.assertEqual(normalize_skill("postgres"), "postgresql")
        self.assertEqual(normalize_skills(["Python", "k8s", "python"]), ["python", "kubernetes"])

    # Test resume sections validation
    def test_input_handler(self):
        resume = {"technical_skills": "Python, SQL", "experience": "Built APIs"}
        cleaned = validate_resume_sections(resume)
        self.assertEqual(cleaned["technical_skills"], "Python, SQL")

    # Test extracting skills from comma/colon text
    def test_explicit_extraction(self):
        text = "Languages: Python, Go\nTools: Docker, Kubernetes"
        skills = extract_explicit_skills(text)
        self.assertEqual(skills, ["Python", "Go", "Docker", "Kubernetes"])

    # Test matching and gap report calculation
    def test_matching_and_gap_report(self):
        match_result = match_exact(
            resume_skills=["python", "docker"],
            jd_skills=["python", "kubernetes"],
        )
        self.assertEqual(match_result["matched_skills"], ["python"])
        self.assertEqual(match_result["unmatched_requirements"], ["kubernetes"])

        report = generate_skill_gap_report(
            resume_skills=["python"],
            jd_skills=["python", "kubernetes"],
            matched_skills=["python"],
            missing_skills=["kubernetes"],
            requirement_map={"kubernetes": "required"},
        )
        self.assertEqual(report.overlap_ratio, 0.5)
        self.assertEqual(report.gap_count, 1)
        self.assertEqual(report.missing_skills[0].skill, "kubernetes")
        self.assertEqual(report.missing_skills[0].importance, 0.90)

    # Test full pipeline with mock LLM
    def test_pipeline_end_to_end(self):
        fake_llm = FakeLLMClient(
            default_response=json.dumps({"skills": [{"name": "FastAPI", "requirement": "required"}]})
        )
        pipeline = SkillPipeline(llm_client=fake_llm)

        resume = {"technical_skills": "Python, FastAPI"}
        jd = "Looking for a Python and FastAPI developer."

        report = pipeline.run(resume, jd)
        self.assertIn("fastapi", report.matched_skills)
        self.assertEqual(report.overlap_ratio, 1.0)
        self.assertEqual(report.gap_count, 0)


if __name__ == "__main__":
    unittest.main()

