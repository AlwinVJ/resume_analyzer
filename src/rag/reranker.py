import numpy as np

from src.utils.logger import logger

class Reranker:
    def __init__(self, model):
        self.model = model
    
    def cosine_similarity(self, vec1, vec2):
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    
    def rerank(self, query, retrieved_results):
        logger.info("Starting reranking process")
        
        query_embedding = self.model.encode([query])[0]
        
        reranked_results = []

        for result in retrieved_results:
            chunk_embedding = self.model.encode([result["text"]])[0]
            similarity = self.cosine_similarity(query_embedding, chunk_embedding)
            updated_result = {
                **result,
                "rerank_score": float(similarity)
            }

            reranked_results.append(updated_result)
        
        reranked_results.sort(
            key=lambda x: x["rerank_score"],
            reverse=True
        )
        logger.info("Reranking completed")
        return reranked_results