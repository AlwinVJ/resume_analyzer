from src.rag.chunking import chunk_resume_sections
from src.rag.embedding import EmbeddingModel
from src.rag.indexing import VectorIndex
from src.rag.retrieval import Retriever
from src.rag.bm25_retrieval import BM25Retriever
from src.rag.hybrid_retriever import HybridRetriever
from src.rag.pipeline import RAGPipeline

resume_sections = {

    "skills":
        "Python, NLP, Machine Learning, AWS",

    "projects":
        "Built chatbot using transformers and PyTorch",

    "experience":
        "Worked on recommendation systems"
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

semantic_retriever = Retriever(model, index, chunks)

bm25_retriever = BM25Retriever(chunks)

hybrid_retriever = HybridRetriever(semantic_retriever, bm25_retriever)

pipeline = RAGPipeline(hybrid_retriever)

query = ("Looking for AWS and PyTorch engineer")

context = pipeline.run(query)

print("\nFINAL CONTEXT:\n")
print(context)