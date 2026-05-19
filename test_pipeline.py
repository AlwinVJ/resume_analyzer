from src.rag.chunking import chunk_resume_sections
from src.rag.embedding import EmbeddingModel
from src.rag.indexing import VectorIndex
from src.rag.retrieval import Retriever
from src.rag.pipeline import RAGPipeline

resume_sections = {
    "skills": "Python, NLP, Machine Learning",
    "projects": "Built chatbot using transformers",
    "experience": "Worked on recommendation systems"
}

chunks = chunk_resume_sections(
    resume_sections,
    source_file="sample_resume.txt"
)

texts = [chunk.text for chunk in chunks]

model = EmbeddingModel()

embeddings = model.encode(texts)

dimension = embeddings.shape[1]

index = VectorIndex(dimension)

index.add_embeddings(embeddings)

retriever = Retriever(model, index, chunks)

pipeline = RAGPipeline(retriever)

query = "Looking for NLP Engineer with transformers experience"

context = pipeline.run(query)

print("\nFINAL CONTEXT:\n")
print(context)