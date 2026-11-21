from src.parsers.resume_loader import ResumeLoader

from src.parsers.job_description_parser import JobDescriptionParser

from src.rag.chunking import chunk_resume_sections

from src.rag.embedding import EmbeddingModel


from src.rag.indexing import VectorIndex

from src.rag.retrieval import Retriever

from src.rag.candidate_ranker import CandidateRanker

from src.utils.logger import logger


class ScreeningService:

    @classmethod
    def rank_candidates(cls, job_description: str, resumes_directory: str = "data/resumes"):

        logger.info("Starting candidate screening")

        # ==========================
        # Build query from JD
        # ==========================

        query = (
            JobDescriptionParser.build_query(
                job_description
            )
        )

        logger.info(
            f"Generated query: {query}"
        )

        model = EmbeddingModel()
        
        dummy_dimension = 384
        
        index = VectorIndex(
            dummy_dimension
        )

        index.load_index(
            "storage/faiss_index.bin"
        )

        all_chunks = (
            index.load_metadata(
                "storage/metadata.pkl"
            )
        )

        # ==========================
        # Retrieval
        # ==========================

        retriever = Retriever(
            model,
            index,
            all_chunks
        )

        results = (
            retriever.retrieve(
                query,
                top_k=10
            )
        )

        # ==========================
        # Candidate Ranking
        # ==========================

        ranked_candidates = (
            CandidateRanker.rank_candidates(
                results
            )
        )

        logger.info(
            "Candidate screening completed"
        )

        return ranked_candidates