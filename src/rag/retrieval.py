import numpy as np

def cosine_similarity(vect1: np.ndarray, vect2: np.ndarray) -> float:
    """Calculate the cosine similarity between two vectors."""
    return np.dot(vect1, vect2) / (np.linalg.norm(vect1) * np.linalg.norm(vect2))