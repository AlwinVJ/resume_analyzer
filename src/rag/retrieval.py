from src.utils.logger import logger
from configs.settings import TOP_K

class Retriever:
    def __init__(self, model, index, chunks):
        self.model = model
        self.index = index
        self.chunks = chunks
    
    def retrieve(self, query, top_k=TOP_K):
        query_embedding = self.model.encode([query])

        logger.info(f"Searching top {top_k} chunks")
        distances, indices = self.index.search(
            query_embedding,
            top_k
        )

        results = []

        for score, idx in zip(distances[0], indices[0]):
            logger.info(
                f"Retrieved chunk {idx} with score {score}"
            )
            results.append({
                "text": self.chunks[idx].text,
                "section": self.chunks[idx].section,
                "score": float(score)
            })
        
        return results
