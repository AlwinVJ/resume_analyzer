from chunking import chunk_text
from embedding import EmbeddingModel
from indexing import VectorIndex

text = """
Python developer with NLP experience.

Built machine learning systems.

Worked on recommendation engines.
"""

chunks = chunk_text(text)

model = EmbeddingModel()
embeddings = model.encode(chunks)

dimension = embeddings.shape[1]

index = VectorIndex(dimension)
index.add_embeddings(embeddings)

query = "machine learning engineer"

query_embedding = model.encode([query])

distances, indices = index.search(query_embedding)

print(indices)


