from sentence_transformers import SentenceTransformer
import numpy as np

from configs.settings import MODEL_NAME
from src.utils.logger import logger

class EmbeddingModel:
    def __init__(self):
        logger.info(f"Loading embedding model")
        self.model = SentenceTransformer(MODEL_NAME)
    
    def encode(self, texts):
        logger.info("Generating embeddings")
        embeddings = self.model.encode(texts)
        return np.array(embeddings).astype('float32')