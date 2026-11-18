from configs.settings import (
    SEMANTIC_WEIGHT,
    BM25_WEIGHT
)

from src.utils.logger import logger

class HybridRetriever:
    def __init__(self, semantic_retriever, bm25_retriever):
        self.semantic_retriever = semantic_retriever
        self.bm25_retriever = bm25_retriever
    
    def retrieve(self, query, top_k=3):
        semantic_results = (
            self.semantic_retriever.retrieve(
                query,
                top_k=top_k
            )
        )

        bm25_results = (
            self.bm25_retriever.retrieve(
                query,
                top_k=top_k
            )
        )

        combined_results = {}

        for result in semantic_results:
            key = result["text"]

            combined_results[key] = {
                **result,
                "hybrid_score": result["semantic_score"] * SEMANTIC_WEIGHT
            }
        
        for result in bm25_results:
            key = result["text"]

            bm25_component = (
                result["bm25_score"] * BM25_WEIGHT
            )
            if key in combined_results:
                combined_results[key]["hybrid_score"] += bm25_component
            else:
                combined_results[key] = {
                    **result,
                    "hybrid_score": bm25_component
                }
        ranked_results = sorted(
            combined_results.values(),
            key=lambda x: x["hybrid_score"],
            reverse=True
        )

        logger.info("Hybrid retrieval completed")
        return ranked_results[:top_k]