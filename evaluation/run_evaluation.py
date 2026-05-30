from evaluation.test_queries import test_cases
from evaluation.metrics import accuracy_score, top_k_accuracy

from src.rag.chunking import chunk_resume_sections
from src.rag.embedding import EmbeddingModel
from src.rag.indexing import VectorIndex
from src.rag.retrieval import Retriever
from src.rag.bm25_retrieval import BM25Retriever
from src.rag.hybrid_retriever import HybridRetriever
from src.rag.reranker import Reranker


resume_sections = {
    "skills": "Python, NLP, Machine Learning, AWS",
    "projects": "Built chatbot using transformers and PyTorch",
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

semantic_retriever = Retriever(model, index, chunks)

bm25_retriever = BM25Retriever(chunks)

hybrid_retriever = HybridRetriever(semantic_retriever, bm25_retriever)

reranker = Reranker(model)

predictions = []
expected = []
top_k_scores = []

for case in test_cases:
    retrieved_results = (hybrid_retriever.retrieve(case["query"]))
    reranked_results = (reranker.rerank(case["query"], retrieved_results))

    if not reranked_results:
        print(
            f"No results for query: "
            f"{case["query"]}"
        )
        continue

    top_result = reranked_results[0]

    predicted_section = top_result["section"]

    predictions.append(predicted_section)

    expected.append(case["expected_section"])
    
    predicted_sections = [
        result["section"] for result in reranked_results
    ]

    top_k_scores.append(
        top_k_accuracy(predicted_sections, case["expected_section"])
    )

    print("\n===================")

    print(f"Query: {case['query']}")
    
    print(
        f"Predicted: "
        f"{predicted_section}"
    )

    print(
        f"Expected: "
        f"{case['expected_section']}"
    )

    print(
        f"Top-K Match: "
        f"{top_k_scores[-1]}"
    )

    print("===================\n")

accuracy = accuracy_score(
    predictions,
    expected
)

top_k = (
    sum(top_k_scores)
    / len(top_k_scores)
)

print("\nFINAL METRICS\n")

print(f"Accuracy: {accuracy:.2f}")

print(f"Top-K Accuracy: {top_k:.2f}")