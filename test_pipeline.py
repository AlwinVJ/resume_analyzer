from src.rag.chunking import chunk_resume_sections
from src.rag.embedding import EmbeddingModel
from src.rag.indexing import VectorIndex
from src.rag.retrieval import Retriever
from src.rag.bm25_retrieval import BM25Retriever
from src.rag.hybrid_retriever import HybridRetriever
from src.rag.pipeline import RAGPipeline
from src.rag.cross_encoder_reranker import CrossEncoderReranker
from src.rag.query_expander import QueryExpander
from src.parsers.pdf_parser import PDFParser
from src.parsers.resume_parser import ResumeParser

pdf_path = "data/resumes/sample_resume.pdf"

raw_text = PDFParser.parse(pdf_path)
resume_sections = ResumeParser.parse(raw_text)

chunks = chunk_resume_sections(
    resume_sections,
    source_file="data/resumes/sample_resume.txt"
)

texts = [chunk.text for chunk in chunks]

model = EmbeddingModel()

embeddings = model.encode(texts)

dimension = embeddings.shape[1]

index = VectorIndex(dimension)

index.add_embeddings(embeddings)

index.save_index("storage/faiss_index.bin")
index.save_metadata(chunks, "storage/metadata.pkl")

new_index = VectorIndex(dimension)
new_index.load_index("storage/faiss_index.bin")
loaded_chunks = new_index.load_metadata("storage/metadata.pkl")

semantic_retriever = Retriever(model, new_index, loaded_chunks)

bm25_retriever = BM25Retriever(loaded_chunks)

hybrid_retriever = HybridRetriever(semantic_retriever, bm25_retriever)

reranker = CrossEncoderReranker()

query_expander = QueryExpander()

pipeline = RAGPipeline(hybrid_retriever, reranker, query_expander)

query = (
    "Looking for LLM engineer "
    "with AWS and PyTorch experience"
)

context = pipeline.run(query)

print("\n============================")
print("FINAL RAG CONTEXT")
print("============================\n")

print(context)

print("\n============================")
print("PIPELINE EXECUTED SUCCESSFULLY")
print("============================\n")