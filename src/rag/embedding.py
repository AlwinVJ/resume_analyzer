from sentence_transformers import SentenceTransformer
from numpy import ndarray

model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> ndarray:
    return model.encode(text)