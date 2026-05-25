# Advanced Resume Analyzer

An end-to-end system for analyzing resumes using ATS-style screening and Retrieval-Augmented Generation (RAG).
The project evaluates candidate profiles against job descriptions using semantic search and NLP techniques.

---

## 🚀 Features

* ATS-style resume screening
* Semantic matching between resume and job description
* Retrieval-Augmented Generation (RAG) pipeline
* Modular architecture for team collaboration

## Retrieval Architecture

The system uses hybrid retrieval:
- Semantic retrieval using Sentence-BERT + FAISS
- Keyword retrieval using BM25
- Weighted hybrid ranking

---

## 🛠️ Tech Stack

* Python
* Sentence-Transformers (Embeddings)
* FAISS (Vector Search)
* NumPy

---

## 📂 Project Structure

```
resume_analyzer/
│
├── src/
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── embedding.py
│   │   ├── retrieval.py
│   │   └── chunking.py
│
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/AlwinVJ/resume_analyzer.git
cd resume_analyzer
```

### 2. Create virtual environment

```bash
python -m venv venv
```

### 3. Activate environment

```bash
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

---

## ▶️ How to Run (Basic Flow)

```python
from src.rag.retrieval import retrieve_relevant_chunks

results = retrieve_relevant_chunks(
    resume_text="Your resume text here",
    job_description="Job description here",
    k=5
)

print(results)
```

---

## 🧠 RAG Module (Haroon)

### Responsibilities

* Generate embeddings for resume and job description
* Store and manage vector representations
* Retrieve top-K relevant chunks using similarity search

---

### Input

```python
{
    "resume_text": str,
    "job_description": str
}
```

---

### Output

```python
[
    {"chunk": "...", "score": 0.87},
    {"chunk": "...", "score": 0.82}
]
```

---

### Pipeline Flow

1. Receive cleaned text from preprocessing module
2. Split text into chunks (`chunking.py`)
3. Generate embeddings (`embedding.py`)
4. Store/search vectors using FAISS
5. Retrieve top-K relevant chunks (`retrieval.py`)

---

### Tech Stack

* Sentence-BERT (Embeddings)
* FAISS (Similarity Search)

---

## 🤝 Contribution Guidelines

* Create a feature branch before making changes

  ```bash
  git checkout -b feature/<your-feature-name>
  ```
* Commit with clear messages
* Open a Pull Request for review

---

## 📌 Notes

* Ensure consistent embedding model for indexing and querying
* Preprocessing module must output clean text
* Do not commit `venv/` or cache files

---

## 📄 License

This project is for educational purposes.
