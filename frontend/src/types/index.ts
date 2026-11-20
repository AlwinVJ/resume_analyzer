// Domain Type Definitions for Resume Analyzer Frontend

export type MatchVerdict = 'Strong Match' | 'Moderate Match' | 'Weak Match';

export interface ContactInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  links?: string[];
  location?: string | null;
}

export interface EducationEntry {
  degree_level?: string | null; // bachelor, master, phd, diploma, certificate, etc.
  degree_raw?: string | null;
  field?: string | null;
  institution?: string | null;
  year?: string | null;
}

export interface ExperienceEntry {
  title?: string | null;
  company?: string | null;
  start?: string | null;
  end?: string | null;
  text?: string | null;
  years?: number | null;
}

export interface ResumeProfile {
  resume_id: string;
  file_name: string;
  file_size?: number;
  uploaded_at?: string;
  contact?: ContactInfo;
  sections: Record<string, string>;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  total_years?: number | null;
  skills?: string[];
  parse_warnings?: string[];
}

export interface JDProfile {
  jd_id?: string;
  job_title?: string | null;
  job_level?: 'fresher' | 'mid' | 'senior' | string | null;
  experience_min?: number | null;
  experience_max?: number | null;
  required_skills: string[];
  preferred_skills: string[];
  education?: { degree_level?: string | null; field?: string | null }[];
  raw_text_hash?: string;
}

export interface MissingSkill {
  skill: string;
  importance: number;
  type?: 'required' | 'preferred';
}

export interface EvidenceItem {
  chunk_id?: string;
  section: string;
  quote: string;
  type?: 'matched' | 'gap' | 'highlight';
}

export interface SkillGapReport {
  resume_skills: string[];
  jd_skills: string[];
  matched_skills: string[];
  missing_skills: MissingSkill[];
  uncertain_skills: string[];
  overlap_ratio: number;
  weighted_overlap?: number;
  gap_count: number;
  evidence_map?: Record<string, { source_section?: string; quote?: string }>;
  status?: 'ok' | 'degraded' | 'failed';
  warnings?: string[];
}

export interface ScoreBreakdown {
  skill_overlap: number;
  semantic_similarity: number;
  experience_match: number;
  education_match: number;
  [key: string]: number;
}

export interface MatchResult {
  final_score: number;
  verdict: MatchVerdict;
  summary?: string;
  breakdown: ScoreBreakdown;
  insights: string[];
  skill_gap: SkillGapReport;
  evidence: EvidenceItem[];
  recommendations?: string[];
  warnings?: string[];
  created_at?: string;
  candidate_name?: string;
  file_name?: string;
  job_title?: string;
  experience_years?: number | null;
  education_level?: string | null;
}

// Bulk screening candidate item
export interface CandidateScreeningResult {
  resume_id: string;
  file_name: string;
  candidate_name: string;
  score: number; // 0 to 100
  verdict: MatchVerdict;
  matched_skills: string[];
  missing_skills: string[];
  experience_years?: number | null;
  experience_compatibility?: 'High' | 'Medium' | 'Low' | string;
  education_compatibility?: 'Satisfied' | 'Partial' | 'Mismatch' | string;
  match_result?: MatchResult;
}

export interface ScreeningResponsePayload {
  job_title?: string;
  total_candidates: number;
  candidates: CandidateScreeningResult[];
  processed_at: string;
}

// Analysis History Record
export interface AnalysisHistoryItem {
  id: string;
  candidate_name: string;
  file_name: string;
  job_title: string;
  score: number;
  verdict: MatchVerdict;
  date: string;
  type: 'single' | 'bulk';
  result: MatchResult;
}

// API Error representation
export interface ApiError {
  message: string;
  status?: number;
  error_code?: string;
  details?: unknown;
}

// Dashboard statistics
export interface DashboardStats {
  totalAnalyzed: number;
  totalScreeningSessions: number;
  averageScore: number;
  topScore: number;
  recentAnalyses: AnalysisHistoryItem[];
}
