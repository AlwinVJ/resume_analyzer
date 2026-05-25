from evaluation.test_queries import test_cases

from src.rag.chunking import chunk_resume_sections
from src.rag.embedding import EmbeddingModel
from src.rag.indexing import VectorIndex
from src.rag.retrieval import Retriever


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

correct = 0

for case in test_cases:
    results = retriever.retrieve(case["query"])
    
    top_result = results[0]

    predicted_section = top_result["section"]

    print(f"\nQuery: {case['query']}")
    print(f"Predicted Section: {predicted_section}")
    print(f"Expected Section: {case['expected_section']}")

    if predicted_section == case["expected_section"]:
        correct += 1
    
    accuracy = correct / len(test_cases)

    print(f"Retrieval Accuracy: {accuracy:.2f}")