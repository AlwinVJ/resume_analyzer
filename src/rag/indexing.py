import faiss

from src.utils.logger import logger

class VectorIndex:
    def __init__(self, dimension):
        logger.info("Initializing FAISS index")

        self.index = faiss.IndexFlatL2(dimension)

    def add_embeddings(self, embeddings):
        logger.info(f"Adding {len(embeddings)} embeddings to FAISS")
        self.index.add(embeddings)
    
    def search(self, query_embedding, top_k=3):
        distances, indices = self.index.search(
            query_embedding,
            top_k
        )
        return distances, indices