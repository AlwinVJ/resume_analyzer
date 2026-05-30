from fastapi import FastAPI
from api.schemas import QueryRequest, QueryResponse

from src.rag.chunking import chunk_resume_sections
from src.rag.embedding import EmbeddingModel
from src.rag.indexing import VectorIndex
from src.rag.retrieval import Retriever
from src.rag.bm25_retrieval import BM25Retriever
from src.rag.hybrid_retriever import HybridRetriever
from src.rag.cross_encoder_reranker import CrossEncoderReranker
from src.rag.query_expander import QueryExpander
from src.rag.pipeline import RAGPipeline

app = FastAPI()

resume_sections = {

    "skills":
        (
            "Python, NLP, Machine Learning, "
            "AWS, PyTorch, Deep Learning"
        ),

    "projects":
        (
            "Built chatbot using transformers "
            "and PyTorch. "
            "Developed semantic search systems."
        ),

    "experience":
        (
            "Worked on recommendation systems "
            "and retrieval pipelines."
        )
}

chunks = chunk_resume_sections(
    resume_sections,
    source_file="sample_resume.txt"
)

texts = [
    chunk.text
    for chunk in chunks
]


model = EmbeddingModel()

embeddings = model.encode(texts)

dimension = embeddings.shape[1]


index = VectorIndex(dimension)

index.add_embeddings(embeddings)


semantic_retriever = Retriever(model, index, chunks)

bm25_retriever = BM25Retriever(chunks)

hybrid_retriever = HybridRetriever(semantic_retriever, bm25_retriever)

reranker = CrossEncoderReranker()

query_expander = QueryExpander()

pipeline = RAGPipeline(hybrid_retriever, reranker, query_expander)


@app.get("/")

def root():
    return {"message": "Resume Analyzer RAG API"}


@app.post("/retrieve", response_model=QueryResponse)

def retrieve_context(request: QueryRequest):

    context = pipeline.run(request.query)

    return QueryResponse(context=context)