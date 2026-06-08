from collections import defaultdict

from src.utils.logger import logger


class CandidateRanker:

    SECTION_WEIGHTS = {
        "technical_skills": 0.40,
        "experience": 0.40,
        "projects": 0.15,
        "professional_summary": 0.05,
        "education": 0.02,
        "certifications": 0.10
    }

    @classmethod
    def rank_candidates(cls, retrieved_results):
        logger.info("Ranking candidates")
        candidate_scores = (defaultdict(float))
        for result in retrieved_results:
            resume_name = result["source_file"]
            section = result["section"]
            semantic_score = result["semantic_score"]
            weight = cls.SECTION_WEIGHTS.get(section, 0.10)

            weighted_score = semantic_score * weight

            candidate_scores[resume_name] += weighted_score

        ranked_candidates = sorted(
            candidate_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return ranked_candidates