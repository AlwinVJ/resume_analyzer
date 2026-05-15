import faiss
from configs.settings import TOP_K
from src.utils.logger import logger

class VectorIndex:
    def __init__(self, dimension):
        self.index = faiss.IndexFlatL2(dimension)

    def add_embeddings(self, embeddings):
        logger.info(f"Adding {len(embeddings)} embeddings to FAISS")
        self.index.add(embeddings)
    
    def search(self, query_embedding, top_k=TOP_K):
        distances, indices = self.index.search(query_embedding, top_k)
        return distances, indices