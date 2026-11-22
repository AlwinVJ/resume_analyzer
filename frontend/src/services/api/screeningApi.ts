import { apiClient } from './client';
import { CandidateScreeningResult, MatchVerdict, CompatibilityLevel, EducationCompatibility } from '../../types';
import { verdictForScore } from '../../utils/verdict';

export interface RawCandidateResponse {
  candidate: string;
  score: number;
  verdict?: MatchVerdict;
  matched_skills?: string[];
  missing_skills?: string[];
  experience_years?: number | null;
  experience_compatibility?: CompatibilityLevel | null;
  education_compatibility?: EducationCompatibility | null;
}

export interface RawScreeningResponse {
  candidates: RawCandidateResponse[];
  job_title?: string;
  total_candidates?: number;
}

export const screeningApi = {
  /**
   * Run bulk candidate screening against pre-indexed resumes or current corpus
   * Endpoint: POST /screen (Implemented in backend api/main.py)
   */
  async screen(jobDescription: string, topN: number = 10): Promise<CandidateScreeningResult[]> {
    const payload = {
      job_description: jobDescription,
      top_n: topN,
    };

    const data = await apiClient.post<RawScreeningResponse>('/screen', payload);

    // Normalize response whether backend returns raw { candidate, score } or enhanced shape
    return (data.candidates || []).map((c, index) => {
      // Score normalization (current backend returns float ~0.2-1.12, target is 0-100)
      const rawScore = c.score;
      const normalizedScore = rawScore > 1 ? Math.min(100, Math.round(rawScore)) : Math.round(rawScore * 100);

      const verdict: MatchVerdict = c.verdict || verdictForScore(normalizedScore);

      const cleanFileName = c.candidate.replace(/^.*[\\/]/, '');
      const candidateName = c.candidate
        .replace(/^.*[\\/]/, '')
        .replace(/_Resume.*|\.pdf.*$/i, '')
        .replace(/[-_]/g, ' ');

      return {
        resume_id: `res-${index + 1}-${cleanFileName}`,
        file_name: cleanFileName,
        candidate_name: candidateName || cleanFileName,
        score: normalizedScore,
        verdict: verdict,
        matched_skills: c.matched_skills || [],
        missing_skills: c.missing_skills || [],
        experience_years: c.experience_years ?? null,
        experience_compatibility: c.experience_compatibility ?? null,
        education_compatibility: c.education_compatibility ?? null,
      };
    });
  },
};
