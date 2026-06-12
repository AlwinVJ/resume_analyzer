from collections import defaultdict

from src.parsers.resume_loader import ResumeLoader

from src.rag.chunking import chunk_resume_sections

from src.rag.embedding import EmbeddingModel

from src.rag.indexing import VectorIndex

from src.rag.retrieval import Retriever

from src.rag.candidate_ranker import CandidateRanker


parsed_resumes = ResumeLoader.load_resumes("data/resumes")

all_chunks = []

chunk_id = 0

for resume in parsed_resumes:

    chunks = chunk_resume_sections(
        sections=resume["sections"],
        source_file=resume["file_name"]
    )

    for chunk in chunks:
        chunk.chunk_id = chunk_id
        all_chunks.append(chunk)
        chunk_id += 1

print(
    f"\nTotal Chunks Created: "
    f"{len(all_chunks)}"
)


texts = [
    chunk.text
    for chunk in all_chunks
]

model = EmbeddingModel()

embeddings = model.encode(texts)

dimension = embeddings.shape[1]

index = VectorIndex(dimension)

index.add_embeddings(
    embeddings
)


retriever = Retriever(
    model,
    index,
    all_chunks
)


query = (
    "Looking for AWS Machine Learning Engineer "
    "with LLM experience"
)

results = retriever.retrieve(
    query,
    top_k=10
)

ranked_resumes = CandidateRanker.rank_candidates(results)


print("\n========== TOP CANDIDATES ==========\n")

for rank, (resume, score) in enumerate(ranked_resumes, start=1):

    print(f"{rank}. {resume}")

    print(f"Score: {score:.4f}")

    print()