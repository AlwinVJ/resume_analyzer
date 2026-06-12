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

        logger.info("Ranking candidates V2")

        candidate_sections = defaultdict(dict)

        for result in retrieved_results:

            resume_name = result["source_file"]

            section = result["section"]

            semantic_score = result["semantic_score"]

            current_best = candidate_sections[resume_name].get(section,0.0)

            if semantic_score > current_best:
                candidate_sections[resume_name][section] = semantic_score

        candidate_scores = {}

        for resume_name, section_scores in candidate_sections.items():

            final_score = 0.0

            for section, score in section_scores.items():

                weight = cls.SECTION_WEIGHTS.get(section, 0.10)

                final_score += score * weight
                

            candidate_scores[resume_name] = final_score

        ranked_candidates = sorted(
            candidate_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return ranked_candidates