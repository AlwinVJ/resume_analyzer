from sentence_transformers import CrossEncoder

from src.utils.logger import logger

class CrossEncoderReranker:
    
    def __init__(self):
        logger.info("Loading Cross-Encoder Model")
        self.model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    
    def rerank(self, query, retrieved_results):
        logger.info("Running cross-encoder reranking")
        sentence_pairs = [
            (query, result['text'])
            for result in retrieved_results
        ]

        scores = self.model.predict(sentence_pairs)

        reranked_results = []

        for result, score in zip(retrieved_results, scores):
            updated_result = {
                **result,
                "cross_encoder_score": float(score)
            }
            reranked_results.append(updated_result)
        
        reranked_results.sort(
            key=lambda x: x["cross_encoder_score"],
            reverse=True
        )

        logger.info("Cross Encoder reranking completed")
        return reranked_results
