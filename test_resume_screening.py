from src.parsers.resume_loader import ResumeLoader

from src.parsers.job_description_parser import JobDescriptionParser

from src.rag.chunking import chunk_resume_sections

from src.rag.embedding import EmbeddingModel


from src.rag.indexing import VectorIndex

from src.rag.retrieval import Retriever

from src.rag.candidate_ranker import CandidateRanker


# JOB DESCRIPTION

job_description = """
We are looking for a Machine Learning Engineer
with strong experience in Python, AWS,
PyTorch, NLP, Transformers and FastAPI.

The candidate should have experience
building RAG applications and deploying
models to production.
"""

# GENERATE QUERY

query = JobDescriptionParser.build_query(
    job_description
)

print("\nGenerated Query:\n")
print(query)

# LOAD RESUMES

parsed_resumes = (
    ResumeLoader.load_resumes(
        "data/resumes"
    )
)

# =====================================
# CREATE CHUNKS
# =====================================

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

# =====================================
# EMBEDDINGS
# =====================================

texts = [
    chunk.text
    for chunk in all_chunks
]

model = EmbeddingModel()

embeddings = model.encode(texts)

# =====================================
# VECTOR INDEX
# =====================================

dimension = embeddings.shape[1]

index = VectorIndex(dimension)

index.add_embeddings(
    embeddings
)

# =====================================
# RETRIEVAL
# =====================================

retriever = Retriever(
    model,
    index,
    all_chunks
)

results = retriever.retrieve(
    query,
    top_k=10
)

# =====================================
# CANDIDATE RANKING
# =====================================

ranked_candidates = (
    CandidateRanker.rank_candidates(
        results
    )
)

# =====================================
# OUTPUT
# =====================================

print(
    "\n========== TOP CANDIDATES ==========\n"
)

for rank, (resume, score) in enumerate(ranked_candidates, start=1):

    print(f"{rank}. {resume}")

    print(f"Score: {score:.4f}")

    print()