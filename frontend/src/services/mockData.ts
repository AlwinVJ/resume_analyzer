import { CandidateScreeningResult, MatchResult, AnalysisHistoryItem, DashboardStats } from '../types';

export const SAMPLE_JOB_DESCRIPTIONS = [
  {
    id: 'jd-ml-engineer',
    title: 'Senior Machine Learning & NLP Engineer',
    department: 'AI Platform',
    text: `Job Title: Senior Machine Learning & NLP Engineer
Location: San Francisco, CA (Hybrid / Remote)
Experience Level: Mid-Senior (4+ years)

About the Role:
We are looking for an experienced Machine Learning Engineer with deep hands-on expertise in Natural Language Processing (NLP), Transformer architectures, and vector search systems. You will build and scale our core RAG retrieval and embedding pipeline, integrate large language models, and deploy production ML microservices.

Key Responsibilities:
- Design, evaluate, and scale Retrieval-Augmented Generation (RAG) architectures with Sentence-BERT, FAISS, and BM25 hybrid ranking.
- Fine-tune and serve open-source LLMs (e.g., Llama, Qwen, Mistral) with low-latency inference pipelines.
- Build robust Python backend APIs using FastAPI, Docker, and modern CI/CD practices.
- Collaborate with product and frontend engineering teams to deliver intuitive AI-assisted matching workflows.

Required Skills:
- Python, PyTorch, Transformers (Hugging Face), Natural Language Processing (NLP).
- Vector databases / indexing (FAISS, Milvus, Qdrant, or Pinecone).
- REST APIs with FastAPI, Pydantic, and Uvicorn.
- Experience building production RAG pipelines and semantic search.

Preferred Skills:
- Docker, Kubernetes, AWS (SageMaker, S3, EC2).
- Knowledge of Cross-Encoder reranking and Reciprocal Rank Fusion (RRF).
- Strong background in Computer Science, Data Science, or related STEM degree.`,
  },
  {
    id: 'jd-frontend-engineer',
    title: 'Senior Frontend Engineer (React & TypeScript)',
    department: 'Product Engineering',
    text: `Job Title: Senior Frontend Engineer
Location: New York, NY (Remote)
Experience Level: Senior (5+ years)

About the Role:
We are seeking a Senior Frontend Engineer proficient in modern React, TypeScript, and Tailwind CSS to craft responsive, accessible, and high-performance interfaces for our AI recruitment and screening intelligence suite.

Required Qualifications:
- 5+ years of experience in modern React (v18+), TypeScript, and component-driven architecture.
- Mastery of responsive design, CSS utility frameworks (Tailwind CSS), and state management.
- Experience with Vite, RESTful API consumption, streaming UI, and async state patterns.
- Strong focus on UX details, micro-interactions, accessibility (WCAG), and clean code standards.`,
  },
];

export const MOCK_ANALYSIS_RESULT: MatchResult = {
  final_score: 84.5,
  verdict: 'Strong Match',
  candidate_name: 'Alex Mercer',
  file_name: 'Alex_Mercer_ML_Backend_Resume.pdf',
  job_title: 'Senior Machine Learning & NLP Engineer',
  experience_years: 5,
  education_level: "Master's Degree in Computer Science",
  summary:
    'Strong overall fit for the Senior Machine Learning & NLP role. Candidate demonstrates 5+ years of hands-on experience in PyTorch, Transformer fine-tuning, FAISS vector indexing, and FastAPI backend engineering with exceptional semantic alignment.',
  breakdown: {
    skill_overlap: 32.0, // out of 35
    semantic_similarity: 22.5, // out of 25
    experience_match: 22.0, // out of 25
    education_match: 8.0, // out of 10
  },
  insights: [
    'Strong skill overlap in core AI/NLP stack (PyTorch, FAISS, Transformers)',
    'High semantic similarity between candidate projects and JD requirements',
    'Experience exceeds minimum required threshold (5 yrs vs 3 yrs required)',
    'Master of Science degree satisfies educational prerequisites',
  ],
  skill_gap: {
    resume_skills: [
      'Python',
      'PyTorch',
      'Transformers',
      'NLP',
      'FAISS',
      'FastAPI',
      'Docker',
      'Sentence-BERT',
      'PostgreSQL',
      'Git',
    ],
    jd_skills: [
      'Python',
      'PyTorch',
      'Transformers',
      'Natural Language Processing',
      'FAISS',
      'FastAPI',
      'RAG',
      'Kubernetes',
      'AWS',
      'Cross-Encoder',
    ],
    matched_skills: [
      'Python',
      'PyTorch',
      'Transformers',
      'Natural Language Processing',
      'FAISS',
      'FastAPI',
      'RAG',
    ],
    missing_skills: [
      { skill: 'Kubernetes', importance: 0.8, type: 'preferred' },
      { skill: 'AWS SageMaker', importance: 0.7, type: 'preferred' },
      { skill: 'Cross-Encoder Reranking', importance: 0.6, type: 'preferred' },
    ],
    uncertain_skills: ['Vector Index Sharding'],
    overlap_ratio: 0.78,
    weighted_overlap: 0.82,
    gap_count: 3,
    evidence_map: {
      Python: {
        source_section: 'technical_skills',
        quote: 'Python 3.10+, PyTorch, FastAPI, NumPy, Pandas',
      },
      Transformers: {
        source_section: 'experience',
        quote: 'Trained Hugging Face Transformer models for semantic text similarity and classification',
      },
      FAISS: {
        source_section: 'experience',
        quote: 'Engineered sub-millisecond vector indexing using FAISS IndexFlatIP over 1M+ chunk embeddings',
      },
      FastAPI: {
        source_section: 'projects',
        quote: 'Developed high-throughput async REST endpoints with FastAPI, Pydantic v2, and Docker',
      },
    },
    status: 'ok',
    warnings: [],
  },
  evidence: [
    {
      chunk_id: 'chk-01',
      section: 'Work Experience',
      quote:
        'Architected hybrid search engine combining dense Sentence-BERT FAISS vectors with sparse BM25 scores, achieving 34% lift in retrieval recall.',
      type: 'matched',
    },
    {
      chunk_id: 'chk-02',
      section: 'Technical Skills',
      quote: 'Languages & ML: Python, PyTorch, Hugging Face, FAISS, LangChain, SentenceTransformers, Scikit-learn',
      type: 'matched',
    },
    {
      chunk_id: 'chk-03',
      section: 'Projects',
      quote:
        'Built enterprise RAG pipeline with context reranking and Ollama local LLM inference, serving 200+ daily internal queries.',
      type: 'matched',
    },
    {
      chunk_id: 'chk-04',
      section: 'Cloud & Infrastructure',
      quote: 'Docker containerization and Linux server administration; basic EC2 deployments.',
      type: 'gap',
    },
  ],
  recommendations: [
    'Elaborate on production container orchestration (Kubernetes) and cloud deployment workflows (AWS/GCP).',
    'Include explicit quantitative metrics on model latency, embedding throughput, and cost savings achieved.',
    'Highlight any experience with Cross-Encoder or reranking models for second-stage candidate scoring.',
    'Mention CI/CD automation pipelines (GitHub Actions, Pytest coverage) in the project descriptions.',
  ],
  created_at: new Date().toISOString(),
};

export const MOCK_CANDIDATES: CandidateScreeningResult[] = [
  {
    resume_id: 'cand-1',
    file_name: 'Alex_Mercer_ML_Backend_Resume.pdf',
    candidate_name: 'Alex Mercer',
    score: 85,
    verdict: 'Strong Match',
    matched_skills: ['Python', 'PyTorch', 'Transformers', 'NLP', 'FAISS', 'FastAPI', 'RAG'],
    missing_skills: ['Kubernetes', 'AWS', 'Cross-Encoder'],
    experience_years: 5,
    experience_compatibility: 'High',
    education_compatibility: 'Satisfied',
    match_result: MOCK_ANALYSIS_RESULT,
  },
  {
    resume_id: 'cand-2',
    file_name: 'Casey_Smith_DevOps_Resume.pdf',
    candidate_name: 'Casey Smith',
    score: 52,
    verdict: 'Moderate Match',
    matched_skills: ['Python', 'Docker', 'FastAPI', 'Linux', 'Git', 'CI/CD'],
    missing_skills: ['PyTorch', 'Transformers', 'NLP', 'FAISS', 'Semantic Search'],
    experience_years: 4,
    experience_compatibility: 'Medium',
    education_compatibility: 'Satisfied',
  },
  {
    resume_id: 'cand-3',
    file_name: 'Jordan_Lee_Frontend_Resume.pdf',
    candidate_name: 'Jordan Lee',
    score: 38,
    verdict: 'Weak Match',
    matched_skills: ['Python (Basic)', 'FastAPI (Client)', 'Git', 'REST'],
    missing_skills: ['PyTorch', 'NLP', 'Transformers', 'FAISS', 'Vector Search', 'RAG'],
    experience_years: 3,
    experience_compatibility: 'Low',
    education_compatibility: 'Partial',
  },
  {
    resume_id: 'cand-4',
    file_name: 'Morgan_Davies_Data_Engineer_Resume.pdf',
    candidate_name: 'Morgan Davies',
    score: 74,
    verdict: 'Moderate Match',
    matched_skills: ['Python', 'SQL', 'FastAPI', 'Data Pipelines', 'Vector Databases', 'Docker'],
    missing_skills: ['Deep Learning', 'PyTorch', 'Transformers'],
    experience_years: 6,
    experience_compatibility: 'High',
    education_compatibility: 'Satisfied',
  },
  {
    resume_id: 'cand-5',
    file_name: 'Taylor_Brooks_Cloud_Security_Resume.pdf',
    candidate_name: 'Taylor Brooks',
    score: 44,
    verdict: 'Weak Match',
    matched_skills: ['Python (Scripting)', 'AWS', 'Docker', 'Linux Security'],
    missing_skills: ['PyTorch', 'Transformers', 'NLP', 'FAISS', 'RAG Systems'],
    experience_years: 4,
    experience_compatibility: 'Low',
    education_compatibility: 'Satisfied',
  },
];

export const MOCK_HISTORY: AnalysisHistoryItem[] = [
  {
    id: 'hist-1',
    candidate_name: 'Alex Mercer',
    file_name: 'Alex_Mercer_ML_Backend_Resume.pdf',
    job_title: 'Senior Machine Learning & NLP Engineer',
    score: 85,
    verdict: 'Strong Match',
    date: '2026-11-18 20:30',
    type: 'single',
    result: MOCK_ANALYSIS_RESULT,
  },
  {
    id: 'hist-2',
    candidate_name: 'Morgan Davies',
    file_name: 'Morgan_Davies_Data_Engineer_Resume.pdf',
    job_title: 'Senior Machine Learning & NLP Engineer',
    score: 74,
    verdict: 'Moderate Match',
    date: '2026-11-18 19:15',
    type: 'single',
    result: {
      ...MOCK_ANALYSIS_RESULT,
      final_score: 74,
      verdict: 'Moderate Match',
      candidate_name: 'Morgan Davies',
      file_name: 'Morgan_Davies_Data_Engineer_Resume.pdf',
      summary: 'Candidate shows strong data engineering and pipeline foundation with partial alignment on NLP deep learning models.',
    },
  },
  {
    id: 'hist-3',
    candidate_name: '5 Candidates (Batch)',
    file_name: 'Corpus Screening Session #1',
    job_title: 'Senior Machine Learning & NLP Engineer',
    score: 59,
    verdict: 'Moderate Match',
    date: '2026-11-18 18:40',
    type: 'bulk',
    result: MOCK_ANALYSIS_RESULT,
  },
];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalAnalyzed: 18,
  totalScreeningSessions: 6,
  averageScore: 68.4,
  topScore: 91.0,
  recentAnalyses: MOCK_HISTORY,
};
