# Resume Analyzer

Screens resumes against a job description. Resume PDFs are parsed into sections, embedded with Sentence-Transformers, indexed in FAISS, and ranked for a job description through a FastAPI endpoint. The repository also contains three modules built for deeper, explainable analysis: an LLM job-description parser, an LLM-assisted skill-gap engine, and a weighted scoring engine.

> **Project status: prototype (branch `dev`).**
> The screening API (`POST /screen`) works end to end using dense retrieval.
> The LLM JD parser, the skill engine and the scoring engine are implemented and can be used from Python, but they are **not yet connected to the API**.
> See [Implementation status](#implementation-status) and [Known limitations](#known-limitations) before relying on any scores.

---

## Contents

- [How it works](#how-it-works)
- [Implementation status](#implementation-status)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Running the screening API](#running-the-screening-api)
- [Using the standalone modules](#using-the-standalone-modules)
- [Configuration](#configuration)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## How it works

The application has two stages: an offline indexing step and an online screening request.

```
OFFLINE: build the resume index
  data/resumes/*.pdf
    → PDFParser.extract_text()           text from every page (PyMuPDF)
    → ResumeParser.parse()               split into sections by header
    → chunk_resume_sections()            one chunk per section
    → EmbeddingModel.encode()            all-MiniLM-L6-v2, 384-d vectors
    → VectorIndex                        storage/faiss_index.bin + storage/metadata.pkl

ONLINE: POST /screen {job_description}
    → JobDescriptionParser.build_query() keyword query from the JD
    → Retriever.retrieve(top_k=10)       nearest resume sections in FAISS
    → CandidateRanker.rank_candidates()  section-weighted score per resume
    → {"candidates": [{"candidate": "<file>.pdf", "score": <float>}, ...]}
```

Separately, the repository contains modules for 1:1 resume-vs-JD analysis. They work on their own but are not wired into the API yet:

```
JobDescriptionParserLLM.parse(jd)     → structured JD (title, experience, required/preferred skills, education)
SkillPipeline.run(sections, jd)       → matched, missing and uncertain skills with evidence and overlap ratio
score_resume(resume_data, jd_data)    → final score (0–100), verdict, per-feature breakdown, insights
```

---

## Implementation status

| Component | Location | Status |
|---|---|---|
| PDF text extraction | `src/parsers/pdf_parser.py` | ✅ Works for text-based PDFs |
| Resume section parsing | `src/parsers/resume_parser.py` | 🟡 Recognises a fixed list of headers; contact details are not extracted |
| Batch resume loading | `src/parsers/resume_loader.py` | ✅ Loads every `*.pdf` in a folder |
| Embeddings + FAISS index | `src/rag/embedding.py`, `src/rag/indexing.py` | ✅ |
| Index build | `src/services/indexing_service.py` | 🟡 Works; run from a script (no API endpoint) |
| Dense retrieval | `src/rag/retrieval.py` | ✅ |
| Candidate ranking | `src/rag/candidate_ranker.py` | 🟡 Works; score is a relative ranking value, not a 0–100 match score |
| Screening API | `api/main.py`, `src/services/screening_service.py` | ✅ `POST /screen` |
| Keyword JD → query | `src/parsers/job_description_parser.py` | 🟡 Recognises 19 built-in skill keywords only |
| LLM JD parser | `src/parsers/job_description_parser_llm.py` | ✅ Integrated in `POST /analyze` (needs Groq key) |
| Skill engine | `src/skill_engine/` | ✅ Integrated in `POST /analyze` (needs Groq key) |
| Scoring engine | `src/scoring/` | ✅ Integrated in `POST /analyze` |
| BM25 / hybrid retrieval, rerankers, query expansion, RAG pipeline | `src/rag/` | 🔌 Implemented; not used by the API |
| Resume upload, 1:1 analysis endpoint, database | — | ✅ Implemented |

✅ working · 🟡 partial · 🔌 implemented but not integrated · ❌ missing

---

## Tech stack

| Area | Technology |
|---|---|
| Language | Python 3.13 (version used by the team) |
| API | FastAPI 0.136, Uvicorn 0.48, Pydantic 2 |
| PDF parsing | PyMuPDF 1.27 |
| Embeddings | sentence-transformers 5.4 with `all-MiniLM-L6-v2` |
| Vector search | faiss-cpu 1.13 (`IndexFlatL2`) |
| Keyword search | rank-bm25 0.2 |
| Reranking | Cross-encoder `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| LLM | [Groq](https://console.groq.com) API, `openai/gpt-oss-120b` by default (JD parser and skill engine) |

---

## Project structure

```
resume_analyzer/
├── api/
│   ├── main.py                      FastAPI app: GET /, POST /screen, POST /analyze
│   └── schemas.py                   Request/response models
├── configs/
│   └── settings.py                  Embedding model name, retrieval constants
├── data/
│   ├── resumes/                     Resume PDFs to index (6 synthetic samples included)
│   └── job_descriptions/            Sample job description
├── src/
│   ├── parsers/
│   │   ├── pdf_parser.py            PDF → text
│   │   ├── resume_parser.py         Text → {section: text}
│   │   ├── resume_loader.py         Folder of PDFs → parsed resumes
│   │   ├── job_description_parser.py      Keyword-based JD → search query
│   │   └── job_description_parser_llm.py  LLM-based JD → structured JSON
│   ├── rag/
│   │   ├── chunking.py              Sections → Chunk objects
│   │   ├── embedding.py             SentenceTransformer wrapper
│   │   ├── indexing.py              FAISS index + metadata persistence
│   │   ├── retrieval.py             Dense retrieval
│   │   ├── candidate_ranker.py      Chunks → ranked candidates
│   │   ├── bm25_retrieval.py        BM25 keyword retrieval
│   │   ├── hybrid_retriever.py      Dense + BM25 fusion
│   │   ├── reranker.py              Bi-encoder reranker
│   │   ├── cross_encoder_reranker.py  Cross-encoder reranker
│   │   ├── query_expander.py        Static synonym expansion
│   │   ├── context_builder.py       Chunks → context string
│   │   ├── pipeline.py              expand → retrieve → rerank → context
│   │   └── schemas.py               Chunk dataclass
│   ├── services/
│   │   ├── indexing_service.py      Build and save the index
│   │   └── screening_service.py     Rank indexed candidates for a JD
│   ├── skill_engine/                Skill extraction, matching and gap report (see its README)
│   ├── scoring/
│   │   ├── feature_engineering.py   Experience and education match features
│   │   ├── weighted_score.py        Role-based weights, verdict, insights
│   │   └── pipeline.py              score_resume() entry point
│   └── utils/
│       └── logger.py                Shared logger
├── storage/                         Generated FAISS index and metadata
├── tests/                           Unit tests and runnable check scripts
└── requirements.txt
```

---

## Getting started

### Prerequisites

- **Python 3.13**. This is the version the team develops on.
- **Git**.
- **Internet access on first run.** The embedding model is downloaded from Hugging Face the first time it is used.
- **A free [Groq API key](https://console.groq.com/keys)**, only for the LLM JD parser and the skill engine. The screening API does not need it.

### 1. Backend Setup

```bash
git clone https://github.com/AlwinVJ/resume_analyzer.git
cd resume_analyzer
git checkout dev
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv
```

```bash
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> On Linux, the pinned `torch` wheel from PyPI includes CUDA libraries and is several GB. If you don't need a GPU, install the CPU build first and then the rest of the requirements:
> `pip install torch --index-url https://download.pytorch.org/whl/cpu`

### 4. (Optional) Add your Groq API key

Copy `.env.example` to `.env` in the repository root and set your key:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env
```

```dotenv
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
```

`.env` is git-ignored. Never commit it. Check the setup with `python -m scripts.check_groq` (about 3 requests).

> Run every command in this README from the **repository root**. Modules are imported as `src.…`, `api.…` and `configs.…`, and the storage and data paths are relative to the root.

---

## Running the screening API

### 1. Add resumes

Put resume PDFs in `data/resumes/`. Six synthetic sample resumes are already there. Only `.pdf` files are indexed.

### 2. Build the index

```bash
python -m scripts.check_indexing_service
```

This parses every PDF, embeds each section, and writes `storage/faiss_index.bin` and `storage/metadata.pkl`. It prints the number of resumes and chunks indexed. **Re-run it whenever you add, remove or change resumes.** The API does not detect a stale index.

The same thing from Python:

```python
from src.services.indexing_service import IndexingService

print(IndexingService.build_index())   # {'num_resumes': ..., 'num_chunks': ...}
```

### 3. Start the server

```bash
uvicorn api.main:app --reload
```

Interactive API docs are at <http://127.0.0.1:8000/docs>.

### 4. Screen candidates

**Request**

```bash
curl -X POST http://127.0.0.1:8000/screen \
  -H "Content-Type: application/json" \
  -d '{"job_description": "Machine Learning Engineer with Python, PyTorch, NLP, AWS and FastAPI experience."}'
```

**Response shape**

```json
{
  "candidates": [
    { "candidate": "Alex_Mercer_ML_Backend_Resume.pdf", "score": 0.0 }
  ]
}
```

| Field | Meaning |
|---|---|
| `candidate` | File name of the resume PDF |
| `score` | Relative ranking value: a section-weighted sum of retrieval similarities. Use it to order candidates for one job description. It is **not** a percentage and is not comparable across job descriptions. |

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health message |
| `POST` | `/screen` | Rank all indexed resumes for a job description |
| `POST` | `/analyze` | Analyse one uploaded PDF resume against a job description (needs a Groq key) |

### Analyse one resume: `POST /analyze`

`multipart/form-data` with `file` (PDF, max 10 MB and 10 pages) and `job_description` (50 to 20,000 characters):

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -F "file=@data/resumes/Alex_Mercer_ML_Backend_Resume.pdf" \
  -F "job_description=$(cat data/job_descriptions/sample_jd.txt)"
```

It returns a `MatchResult` (`src/schemas/match.py`): a 0–100 score and verdict (80+ Strong, 65+ Moderate),
points per feature with their maxima, the skill gap, experience (total, relevant and internship months,
with High/Medium/Low compatibility) and education (qualifications, with Exceeds/Meets/Partially meets/Does
not meet), evidence quotes and recommendations. How it works is described in `src/analysis/__init__.py`:

- Groq calls per resume: 2–3 (skill engine plus one profile extraction, run in parallel). The job description
  is parsed once and cached, so a bulk run with one JD does not re-parse it.
- The LLM only copies facts (roles, dates, degrees) and judges relevance. Python checks every fact against
  the resume text, does all date arithmetic, and drops anything it cannot find.
- Errors are JSON `{"detail": "...", "error_code": "..."}`: `UNSUPPORTED_FILE` 415, `FILE_TOO_LARGE` 413,
  `SCANNED_PDF` / `CORRUPT_PDF` / `INVALID_INPUT` 422, `LLM_UNAVAILABLE` 503 (with `Retry-After` on rate limits).

---

## Using the standalone modules

These modules are not called by the API yet. You can use them directly from Python.

### Parse a resume

```python
from src.parsers.pdf_parser import PDFParser
from src.parsers.resume_parser import ResumeParser

text = PDFParser.extract_text("data/resumes/Alex_Mercer_ML_Backend_Resume.pdf")
sections = ResumeParser.parse(text)
# {'professional_summary': '...', 'technical_skills': '...', 'experience': '...', 'education': '...'}
```

A header is recognised only when the whole line exactly matches one of the following (case-insensitive): `Professional Summary`, `Summary`, `Education`, `Technical Skills`, `Skills`, `Core Competencies`, `Projects`, `Experience`, `Work Experience`, `Professional Experience`, `Certifications`.

### Parse a job description with the LLM (requires a Groq API key)

```python
from src.parsers.job_description_parser_llm import JobDescriptionParserLLM

jd = open("data/job_descriptions/sample_jd.txt", encoding="utf-8").read()
print(JobDescriptionParserLLM.parse(jd))
```

Output schema:

```json
{
  "job_title": "string or null",
  "experience_required": { "min": "int or null", "max": "int or null" },
  "required_skills": ["lower-cased skill", "..."],
  "preferred_skills": ["..."],
  "education": ["..."]
}
```

### Skill-gap analysis (requires a Groq API key)

```python
from src.skill_engine import SkillPipeline

report = SkillPipeline().run(sections, jd)   # sections from ResumeParser, jd as text
print(report.to_dict())
```

The report contains `resume_skills`, `jd_skills`, `matched_skills`, `missing_skills` (with importance), `uncertain_skills`, `evidence_map`, `overlap_ratio` and `gap_count`. You can pass your own LLM client with `SkillPipeline(llm_client=...)`. Any object with a `generate(prompt) -> str` method works, which is how the unit tests run offline. See [`src/skill_engine/README.md`](src/skill_engine/README.md) for details.

### Weighted scoring

```python
from src.scoring.pipeline import score_resume

result = score_resume(
    resume_data={
        "relevant_experience": 2,                                   # years
        "education": [{"degree": "Bachelor's", "field": "Computer Science"}],
        "skill_overlap": 0.80,                                      # 0–1
        "semantic_similarity": 0.75,                                # 0–1
    },
    jd_data={
        "required_experience": 3,
        "required_degree": "Bachelor's",
        "required_field": "Computer Science",
    },
)
# {'final_score': 76.75, 'verdict': 'Moderate Match',
#  'insights': ['Strong skill overlap', 'Strong semantic alignment',
#               'Experience partially meets requirements', 'Education requirement satisfied'],
#  'breakdown': {'skill_overlap': 28.0, 'semantic_similarity': 18.75,
#                'experience_match': 20.0, 'education_match': 10.0}}
```

- **Verdict thresholds:** 80 or above is *Strong Match*, 65 or above is *Moderate Match*, anything lower is *Weak Match*.
- **Role weights:** `get_weights()` defines weights for `fresher`, `mid` and `senior`. `score_resume()` currently always uses `mid`.
- **Inputs:** nothing in the codebase produces these inputs automatically yet. You have to supply all of them.
- **Degree names:** `required_degree` must be one of the recognised values (`Bachelor's`, `Master's`, …). Other values, such as `B.Tech`, raise an error. See [Known limitations](#known-limitations).

---

## Configuration

| Setting | Where | Default | Used by |
|---|---|---|---|
| `MODEL_NAME` | `configs/settings.py` | `all-MiniLM-L6-v2` | Embeddings (indexing and screening) |
| `SIMILARITY_THRESHOLD` | `configs/settings.py` | `0.30` | Dense retrieval |
| `TOP_K` | `configs/settings.py` | `3` | Defined; the screening service uses its own `top_k=10` |
| `SEMANTIC_WEIGHT`, `BM25_WEIGHT` | `configs/settings.py` | `0.7`, `0.3` | Hybrid retriever |
| `GROQ_API_KEY` | `.env` | — (required for LLM features) | JD parser, skill engine |
| `GROQ_MODEL` | `.env` | `openai/gpt-oss-120b` | JD parser, skill engine |
| `GROQ_BASE_URL` | `.env` | `https://api.groq.com/openai/v1` | JD parser, skill engine |
| `LLM_TIMEOUT_S`, `LLM_MAX_TOKENS` | `.env` | `60`, `4096` | Every LLM call |
| `LLM_REASONING_EFFORT` | `.env` | `low` | gpt-oss models only |
| `LLM_MAX_RETRIES`, `LLM_MAX_RETRY_WAIT_S` | `.env` | `2`, `20` | Retries after 429 / 5xx / network errors |
| Index paths | `src/services/*.py` | `storage/faiss_index.bin`, `storage/metadata.pkl` | Indexing and screening |

If you change `MODEL_NAME`, rebuild the index. Vectors from different models are not compatible.

---

## Testing

### Unit tests (offline)

```bash
pytest
```

The tests use a fake LLM client (`tests/mocks.py`) and a fake HTTP layer, so they need no network and no API key.

### Check scripts

The other files in `tests/` are scripts that print their results for manual inspection. They contain no assertions. Run them as modules from the repository root:

| Script | Needs | Notes |
|---|---|---|
| `python -m scripts.check_pdf_parser` | — | Extracts text from a sample PDF |
| `python -m scripts.check_resume_parser` | — | Prints parsed sections |
| `python -m scripts.check_resume_loader` | — | Parses every PDF in `data/resumes/` |
| `python -m scripts.check_job_description_parser` | — | Keyword JD parser |
| `python -m scripts.check_llm_validation` | — | LLM output validation rules |
| `python -m scripts.check_llm_normalization` | — | LLM output normalisation |
| `python -m scripts.check_groq` | Groq key | Checks the key, one tiny call, parses a sample JD (`--skills` also runs the skill engine) |
| `python -m scripts.check_job_description_parser_llm` | Groq key | Parses a long sample JD |
| `python -m scripts.check_analyze` | Groq key, model download | Full `/analyze` logic on every PDF in `data/resumes/` (2–3 requests each) |
| `python -m scripts.check_semantic_calibration` | Model download | Raw embedding similarities, to tune `SEMANTIC_SIM_FLOOR` / `CEILING` |
| `python -m scripts.check_indexing_service` | Model download | **Rebuilds `storage/`** |
| `python -m scripts.check_screening_service` | Model download, built index | Runs a sample screening |

> ⚠️ > Run `pytest` from the repository root to run every automated test. It works offline.

---

## Known limitations

These come from the backend audit of the `dev` branch. The full findings and a step-by-step plan are in [`docs/RESUME_ANALYZER_BACKEND_AUDIT.md`](docs/RESUME_ANALYZER_BACKEND_AUDIT.md).

- **Keyword-only screening query.** `/screen` builds its query from 19 built-in keywords (Python, AWS, NLP, …). A job description with none of them, such as a React or Java role, gives an empty query and a ranking that doesn't reflect the JD. Substring matching also adds false keywords (for example "leverage" matches `rag`).
- **Ranking score.** Only resumes with a section in the top 10 retrieved chunks appear in the results. Resumes with more matching sections score higher. The section weights sum to 1.12.
- **Modules not integrated into `/screen`.** `/analyze` uses the LLM JD parser, skill engine and scoring engine; `/screen` still uses keyword retrieval only. Hybrid retrieval and rerankers are not called by the API.
- **Resume parsing.** Section headers must be on their own line; common variants (`Skills:`, `Work History`, `Internships`) are recognised. In `/analyze`, scanned and corrupt PDFs get a clear error; the indexing script used by `/screen` still skips scanned PDFs silently and stops on a corrupt one.
- **Semantic score calibration.** The 0–1 semantic feature maps raw cosine similarity between `SEMANTIC_SIM_FLOOR` and `SEMANTIC_SIM_CEILING`. The defaults are estimates; tune them with `scripts.check_semantic_calibration`.
- **Groq free-tier limits.** Limits apply per organisation and model (requests and tokens per minute and per day). The client retries short waits, then fails with a clear 503 error. Check your limits at https://console.groq.com/settings/limits.
- **No authentication or database.** `/analyze` takes uploads but does not store them. `/screen` reads resumes from `data/resumes/` and its index from `storage/`; missing index files cause a `500` error.
- **Performance.** The embedding model and index are reloaded on every `/screen` request.
- **Unverified ranking quality.** No retrieval or scoring evaluation set exists yet, so ranking quality has not been measured.

---

## Roadmap

The audit's implementation roadmap has eight phases. In summary:

1. **Critical integration.** Shared data schemas, one LLM provider, JD-driven queries, complete and bounded candidate ranking, and an `AnalysisService` that connects the JD parser, skill engine and scoring engine.
2. **Missing backend features.** An enriched `POST /screen`, persistence (SQLite) and `/history`, index management and health checks. (`POST /analyze` is done.)
3. **Parsing and extraction.** Robust PDF and section parsing; contact, education and experience extraction; one shared skill taxonomy.
4. **RAG and embeddings.** Cosine similarity, size-bounded chunks, fixed hybrid retrieval, candidate-scoped evidence and grounded explanations, and an evaluation set.
5. **Scoring.** Required vs preferred weighting, scores bounded to 0–100, explanation objects and calibration.
6. **API, security and reliability.** Input validation, error codes, prompt-injection defences, auth, CORS, rate limits and PII-safe logging.
7. **Testing and performance.** Unit, integration and API tests, caching, and CI.
8. **Deployment and docs.** Packaging, Docker, and documentation.

---

## Contributing

**Branches**

| Branch | Purpose |
|---|---|
| `main` | Stable branch |
| `dev` | Integration branch. Open pull requests against `dev`. |
| `feature/<name>` | One branch per feature or fix |

**Workflow**

```bash
git checkout dev && git pull
git checkout -b feature/<your-feature>
# make changes, run the unit tests
git commit -m "Short, descriptive message"
git push -u origin feature/<your-feature>
# open a pull request into dev
```

**Guidelines**

- Keep new modules importable from the repository root (`from src.… import …`).
- Add assertion-based tests for new code. Prefer injecting fakes for the LLM and embedding model so tests run offline.
- Do not commit virtual environments, `__pycache__/`, `.env`, or generated files in `storage/`.
- Save `requirements.txt` as UTF-8 so dependency changes show up as reviewable diffs. The current file is UTF-16, which git treats as binary.

---

## Team

| Area | Branch | Contributor |
|---|---|---|
| PDF ingestion, RAG module, JD parsing, screening and indexing services | `feature/pdf-ingestion`, `feature/rag-module`, `feature/llm-jd-parser` | haroonpuzhakkal07-pixel |
| Scoring engine | `feature/scoring-system` | AlwinVJ |
| Skill engine | `feature/skill-extract` | Athira Suresh |

---

## License

This project is for educational purposes.
