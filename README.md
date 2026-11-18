# Advanced Resume Analyzer

An end-to-end system for analyzing and screening resumes using ATS-style intelligence, semantic hybrid search, and Retrieval-Augmented Generation (RAG).
The project evaluates candidate profiles against job descriptions using vector embeddings, NLP skill extraction, and explainable multi-factor scoring.

---

## 🚀 Features

- **One-to-One Resume Analysis**: Upload a resume PDF and compare against a target job description for detailed match scores, skill gap reports, and actionable improvement recommendations.
- **Bulk Candidate Screening**: Screen and rank candidate resumes against a job description with hybrid semantic search (Sentence-BERT + FAISS) and BM25.
- **Side-by-Side Candidate Comparison**: Compare 2–3 candidates across match score, skill coverage, and seniority in an interactive comparison matrix.
- **Persistent Analysis History**: Track previous analyses and screening sessions with search, filtering, and JSON export.
- **Modern SaaS Web Interface**: Clean, accessible, responsive frontend built with React, TypeScript, Vite, and Tailwind CSS.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Native Fetch API client with structured error mapping and environment configuration

### Backend
- **API Framework**: FastAPI, Uvicorn, Pydantic
- **PDF Extraction**: PyMuPDF (`fitz`)
- **Embeddings & Vector Search**: Sentence-Transformers (`all-MiniLM-L6-v2`), FAISS (`IndexFlatIP`/`IndexFlatL2`)
- **Keyword Retrieval**: Rank-BM25
- **Skill Engine**: Hybrid deterministic matcher & local LLM extractor (Ollama)

---

## 📂 Project Structure

```
resume_analyzer/
├── api/                             # FastAPI backend routes and schemas
│   ├── main.py                      # FastAPI app entry point (GET /, POST /screen)
│   └── schemas.py                   # Pydantic request & response schemas
│
├── configs/                         # Model and retrieval parameters
│   └── settings.py
│
├── data/                            # Sample resumes and job descriptions
│   ├── job_descriptions/
│   └── resumes/
│
├── frontend/                        # Modern React + TypeScript + Tailwind frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── analysis/            # Score breakdown, skill matrix, evidence viewer
│   │   │   ├── common/              # Buttons, cards, score gauges, progress bars
│   │   │   ├── layout/              # AppShell, Sidebar, Header
│   │   │   └── screening/           # Candidate table, cards, compare modal
│   │   ├── context/                 # Global AppContext & UI Demo mode state
│   │   ├── services/
│   │   │   ├── api/                 # API client, resumeApi, screeningApi, analysisApi
│   │   │   └── mockData.ts          # Authentic mock fixtures for offline UI preview
│   │   ├── types/                   # Shared TypeScript domain contracts
│   │   ├── views/                   # Dashboard, Analyze, BulkScreening, History, CandidateDetail
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
├── src/                             # Backend subsystems
│   ├── parsers/                     # PDF and Job Description parsers
│   ├── rag/                         # Embeddings, chunking, FAISS indexing, candidate ranking
│   ├── scoring/                     # Feature engineering & weighted scoring engine
│   ├── services/                    # Indexing and screening services
│   ├── skill_engine/                # Skill extraction, normalizer, and gap report
│   └── utils/                       # Shared logging
│
├── storage/                         # FAISS index and chunk metadata
├── tests/                           # Backend unit tests
├── FRONTEND_BACKEND_INTEGRATION.md  # Detailed API contracts & integration guide
├── README.md
└── requirements.txt
```

---

## ⚙️ Quick Start Guide

### 1. Backend Setup

```bash
# 1. Activate virtual environment
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start FastAPI server
uvicorn api.main:app --reload --port 8000
```
FastAPI documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 2. Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Set environment variables
# Copy .env.example to .env
cp .env.example .env

# 4. Start development server
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

### 3. Frontend Build & Production Verification

```bash
cd frontend
npm run build
```
This runs `tsc` for type-checking and `vite build` for production asset optimization.

---

## 🔌 Frontend & Backend Integration

The frontend includes a dedicated API service layer:
- `frontend/src/services/api/screeningApi.ts`: Communicates with `POST /screen`.
- `frontend/src/services/api/analysisApi.ts`: Configured for `POST /analyze`.
- `frontend/src/services/api/resumeApi.ts`: Configured for `POST /resumes`.
- `frontend/src/services/api/historyApi.ts`: Connects to `GET/POST /history` with local storage synchronization.

For the complete API contract specification, payloads, and roadmap details, see:
👉 **[FRONTEND_BACKEND_INTEGRATION.md](file:///d:/Projects/GroupProjects/resume_analyzer/FRONTEND_BACKEND_INTEGRATION.md)**.

### UI Demo Mode Switcher
The frontend includes a built-in **UI Demo Mode** toggle in the sidebar:
- **Off (Live Mode)**: Dispatches real HTTP requests to your FastAPI backend at `http://localhost:8000`. If an endpoint is offline or unavailable, clear error banners with actionable diagnostics are shown.
- **On (Demo Mode)**: Enables offline testing with high-fidelity sample data, allowing complete visual inspection of all views, candidate comparisons, radial gauges, and report exports.

---

## 📄 License
This project is for educational and research purposes.
