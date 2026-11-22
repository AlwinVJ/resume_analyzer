import faiss
import pickle

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
    
    def save_index(self, file_path):
        logger.info(
            f"Saving FAISS index "
            f"to {file_path}"
        )
        faiss.write_index(self.index, file_path)
    
    def load_index(self, file_path):
        logger.info(
            f"Loading FAISS index "
            f"from {file_path}"
        )
        self.index = faiss.read_index(file_path)

    def save_metadata(self, chunks, file_path):
        logger.info(
            f"Saving metadata "
            f"to {file_path}"
        )

        with open(file_path, 'wb') as f:
            pickle.dump(chunks, f)
    
    def load_metadata(self, file_path):
        logger.info(
            f"Loading metadata "
            f"from {file_path}"
        )
        with open(file_path, 'rb') as f:
            return pickle.load(f)
        