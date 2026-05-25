from configs.settings import (
    SIMILARITY_THRESHOLD
)
from src.utils.logger import logger

class Retriever:
    def __init__(self, model, index, chunks):
        self.model = model
        self.index = index
        self.chunks = chunks
    
    def retrieve(self, query, top_k=3):
        query_embedding = self.model.encode([query])

        distances, indices = self.index.search(
            query_embedding,
            top_k
        )

        results = []

        for score, idx in zip(distances[0], indices[0]):
    
            similarity = 1 / (1 + score)
            if similarity < SIMILARITY_THRESHOLD:
                continue

            chunk = self.chunks[idx]

            logger.info(
                f"Retrieved chunk {idx} " 
                f"with similarity {similarity}"
            )

            results.append({
                "text": chunk.text,
                "section": chunk.section,
                "source_file": chunk.source_file,
                "semantic_score": float(similarity)
            })
        
        results.sort(
            key=lambda x: x["semantic_score"],
            reverse=True
        )
        return results