from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
from configs.settings import MODEL_NAME
from src.utils.logger import logger

class EmbeddingModel:
    def __init__(self):
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        self.model = SentenceTransformer(MODEL_NAME)
    
    def encode(self, texts: List[str]) -> np.ndarray:
        try:
            logger.info("Generating embeddings")
            embeddings = self.model.encode(texts)
            logger.info(f"Generated embeddings for {len(embeddings)} texts")
            return np.array(embeddings).astype('float32')
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")