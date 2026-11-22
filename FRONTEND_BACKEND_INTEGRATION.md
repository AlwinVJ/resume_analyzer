# Frontend & Backend Integration Guide

This document defines the interface contract between the modern React/TypeScript frontend and the FastAPI backend for the **Resume Analyzer** project.

It is structured to support manual backend implementation and integration, clearly distinguishing between:
1. **Existing Backend Functionality** (already present in the repository)
2. **Frontend Functionality Ready for Integration** (fully built, tested, and waiting to connect)
3. **Proposed Backend Functionality** (endpoints designed according to the Technical Audit Roadmap that still need to be implemented)

---

## 1. Architectural Overview & Request Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Frontend                                │
│  (Dashboard | 1:1 Analysis | Bulk Screening | Candidate Detail)        │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / JSON & Multipart
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend                               │
│                                                                        │
│  [Existing Endpoints]                                                  │
│  ├── GET  /                 (Root / Health Ping)                       │
│  └── POST /screen           (Candidate Ranking via FAISS & BM25)       │
│                                                                        │
│  [Proposed Endpoints – Ready in Frontend]                              │
│  ├── POST /resumes          (PDF Upload & Ingestion)                   │
│  ├── GET  /resumes/{id}     (Parsed Resume Profile)                    │
│  ├── POST /analyze          (1:1 Resume vs JD MatchResult)             │
│  ├── POST /screen/batch     (Ad-hoc Multi-PDF Screening)               │
│  └── GET  /history          (Audit & Analysis History)                 │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
      ┌───────────────────────────┼──────────────────────────┐
      ▼                           ▼                          ▼
┌───────────────┐         ┌───────────────┐          ┌───────────────┐
│  PDF Parser   │         │ Skill Engine  │          │    Scoring    │
│  (PyMuPDF)    │         │  (LLM/Groq)   │          │    Engine     │
└───────────────┘         └───────────────┘          └───────────────┘
```

---

## 2. Status Matrix of Endpoints

| Endpoint | Method | Frontend State | Backend State | Reference in Audit |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | ✅ Fully Integrated | ✅ Implemented | `api/main.py` |
| `/screen` | `POST` | ✅ Fully Integrated (with backward compat) | 🟡 Basic implemented; needs top-N & rich fields | §2.1, §15 (P1-05, P2-02) |
| `/analyze` | `POST` | ✅ Ready for Integration | ❌ Proposed (needs implementation) | §15 (P1-07, P2-02), §16.1 |
| `/resumes` | `POST` | ✅ Ready for Integration | ❌ Proposed (needs implementation) | §15 (P2-01), §16.1 |
| `/resumes/{id}` | `GET` | ✅ Ready for Integration | ❌ Proposed (needs implementation) | §15 (P2-01) |
| `/history` | `GET/POST`| ✅ Local fallback active | ❌ Proposed (needs SQLite DB) | §15 (P2-03) |

---

## 3. Endpoint Specifications

### 3.1. System Health / Root Ping

- **Endpoint**: `/`
- **Method**: `GET`
- **Backend Status**: **EXISTING** (`api/main.py`)
- **Frontend Usage**: Used by `Sidebar.tsx` and `Header.tsx` to detect whether the FastAPI server is running on `http://localhost:8000`.

#### Request
No payload required.

#### Expected Response (`200 OK`)
```json
{
  "message": "Resume Screening API"
}
```

---

### 3.2. Bulk Candidate Screening (`/screen`)

- **Endpoint**: `/screen`
- **Method**: `POST`
- **Backend Status**: **PARTIALLY IMPLEMENTED**
  - Current implementation in `api/main.py` accepts `ScreeningRequest(job_description=str)` and returns `ScreeningResponse(candidates=[{"candidate": str, "score": float}])`.
  - Frontend supports both the **existing raw format** and the **proposed rich schema**.

#### Request Payload
```json
{
  "job_description": "Senior Machine Learning Engineer with NLP, PyTorch, FAISS vector search, and FastAPI experience.",
  "top_n": 10
}
```

#### Field Constraints
- `job_description`: string, minimum 50 characters, maximum 20,000 characters.
- `top_n`: integer, optional (default `10`), bounds: 1 to 50.

#### Enhanced Response Structure (Proposed Contract)
```json
{
  "job_title": "Senior Machine Learning Engineer",
  "total_candidates": 5,
  "processed_at": "2026-11-18T20:30:00Z",
  "candidates": [
    {
      "resume_id": "cand-1-Alex_Mercer",
      "file_name": "Alex_Mercer_ML_Backend_Resume.pdf",
      "candidate_name": "Alex Mercer",
      "score": 85.0,
      "verdict": "Strong Match",
      "matched_skills": ["Python", "PyTorch", "Transformers", "NLP", "FAISS", "FastAPI"],
      "missing_skills": ["Kubernetes", "AWS SageMaker"],
      "experience_years": 5,
      "experience_compatibility": "High",
      "education_compatibility": "Satisfied"
    }
  ]
}
```

#### Backward-Compatibility Handler in Frontend
If the backend returns the current minimal schema:
```json
{
  "candidates": [
    { "candidate": "Alex_Mercer_ML_Backend_Resume.pdf", "score": 0.85 }
  ]
}
```
The frontend's `screeningApi.ts` automatically extracts candidate names, normalizes float scores (0.0–1.0) into percentages (0–100), and infers initial verdicts.

#### Error Responses
- `422 Unprocessable Entity`: Empty or missing `job_description`.
- `503 Service Unavailable`: FAISS index not built (`storage/faiss_index.bin` missing).

---

### 3.3. One-to-One Resume Analysis (`/analyze`)

- **Endpoint**: `/analyze`
- **Method**: `POST`
- **Backend Status**: **PROPOSED (Task P2-02 & P1-07)**
- **Frontend Usage**: Powers the `Analyze Resume` view and candidate detailed inspection.

#### Request Option A: JSON Payload (Using Pre-indexed `resume_id`)
```json
{
  "resume_id": "res-uuid-1234",
  "job_description": "Looking for Machine Learning Engineer with NLP..."
}
```

#### Request Option B: Multipart Form Data (Direct File + JD Upload)
- `file`: PDF binary (multipart field `file`)
- `job_description`: string text

#### Expected Response Structure (`MatchResult`)
```json
{
  "final_score": 84.5,
  "verdict": "Strong Match",
  "candidate_name": "Alex Mercer",
  "file_name": "Alex_Mercer_ML_Backend_Resume.pdf",
  "job_title": "Machine Learning Engineer",
  "experience_years": 5,
  "education_level": "Master's Degree in Computer Science",
  "summary": "Strong overall fit for the role with deep expertise in PyTorch, FAISS vector search, and FastAPI.",
  "breakdown": {
    "skill_overlap": 32.0,
    "semantic_similarity": 22.5,
    "experience_match": 22.0,
    "education_match": 8.0
  },
  "insights": [
    "Strong skill overlap in core AI stack (PyTorch, FAISS, Transformers)",
    "High semantic similarity between candidate projects and JD requirements",
    "Experience exceeds required threshold (5 yrs vs 3 yrs required)",
    "Master of Science degree satisfies educational prerequisites"
  ],
  "skill_gap": {
    "resume_skills": ["Python", "PyTorch", "Transformers", "FAISS", "FastAPI", "Docker"],
    "jd_skills": ["Python", "PyTorch", "Transformers", "FAISS", "FastAPI", "Kubernetes", "AWS"],
    "matched_skills": ["Python", "PyTorch", "Transformers", "FAISS", "FastAPI"],
    "missing_skills": [
      { "skill": "Kubernetes", "importance": 0.8, "type": "preferred" },
      { "skill": "AWS SageMaker", "importance": 0.7, "type": "preferred" }
    ],
    "uncertain_skills": [],
    "overlap_ratio": 0.78,
    "weighted_overlap": 0.82,
    "gap_count": 2,
    "evidence_map": {
      "FAISS": {
        "source_section": "experience",
        "quote": "Engineered vector indexing using FAISS IndexFlatIP over 1M+ chunk embeddings"
      }
    },
    "status": "ok",
    "warnings": []
  },
  "evidence": [
    {
      "chunk_id": "chk-01",
      "section": "Work Experience",
      "quote": "Architected hybrid search engine combining dense Sentence-BERT FAISS vectors with sparse BM25 scores",
      "type": "matched"
    }
  ],
  "recommendations": [
    "Elaborate on production container orchestration (Kubernetes).",
    "Include explicit quantitative metrics on model latency and embedding throughput."
  ],
  "warnings": [],
  "created_at": "2026-11-18T20:30:00Z"
}
```

#### Required Fields
- `final_score`: number between 0.0 and 100.0.
- `verdict`: `"Strong Match"` (>=80), `"Moderate Match"` (65–79.99), or `"Weak Match"` (<65). Thresholds are defined once in `get_verdict()` (`src/scoring/weighted_score.py`) and mirrored in `frontend/src/utils/verdict.ts`.
- `breakdown`: object with `skill_overlap`, `semantic_similarity`, `experience_match`, `education_match`.
- `skill_gap`: object with `matched_skills` (list of strings) and `missing_skills` (list of objects with `skill` and `importance`).

#### Error Responses
- `415 Unsupported Media Type`: File uploaded is not a valid PDF.
- `422 Unprocessable Entity`: Corrupt PDF, unparseable text, or missing JD.
- `503 Service Unavailable`: LLM provider (Groq) unreachable.

---

### 3.4. Resume Upload and Parsing (`/resumes`)

- **Endpoint**: `/resumes`
- **Method**: `POST`
- **Backend Status**: **PROPOSED (Task P2-01)**
- **Content-Type**: `multipart/form-data`

#### Request Payload
- `file`: binary PDF stream (e.g., `Alex_Mercer_Resume.pdf`).

#### Validation Rules (from Technical Audit §15 P2-01)
- MIME / Magic bytes: `%PDF-` verification.
- Maximum size: 10 MB (`MAX_UPLOAD_MB`).
- Maximum page count: 10 pages (`MAX_PAGES`).

#### Expected Response (`201 Created`)
```json
{
  "resume_id": "res-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "file_name": "Alex_Mercer_Resume.pdf",
  "file_size": 245812,
  "parse_warnings": [],
  "uploaded_at": "2026-11-18T20:30:00Z"
}
```

---

### 3.5. Analysis History (`/history`)

- **Endpoint**: `/history`
- **Method**: `GET`, `POST`, `DELETE`
- **Backend Status**: **PROPOSED (Task P2-03)**
- **Frontend Current Handling**: Fully functional via `localStorage` sync. When the backend endpoint is provided, `historyApi.ts` automatically switches to server persistence.

#### Expected GET Response (`200 OK`)
```json
[
  {
    "id": "analysis-1731958200000",
    "candidate_name": "Alex Mercer",
    "file_name": "Alex_Mercer_ML_Backend_Resume.pdf",
    "job_title": "Senior Machine Learning & NLP Engineer",
    "score": 85.0,
    "verdict": "Strong Match",
    "date": "2026-11-18 20:30",
    "type": "single",
    "result": { ...MatchResult... }
  }
]
```

---

## 4. How to Test Frontend Integration

### Step 1: Start FastAPI Backend
```bash
# In the root repository directory
venv\Scripts\activate
uvicorn api.main:app --reload --port 8000
```

### Step 2: Configure Frontend Environment
Ensure `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Step 3: Run Frontend
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
