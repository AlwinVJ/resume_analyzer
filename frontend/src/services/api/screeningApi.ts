import { apiClient } from './client';
import { CandidateScreeningResult, MatchVerdict } from '../../types';
import { verdictForScore } from '../../utils/verdict';

export interface RawCandidateResponse {
  candidate: string;
  score: number;
  verdict?: MatchVerdict;
  matched_skills?: string[];
  missing_skills?: string[];
  experience_years?: number;
  experience_compatibility?: string;
  education_compatibility?: string;
}

export interface RawScreeningResponse {
  candidates: RawCandidateResponse[];
  job_title?: string;
  total_candidates?: number;
}

export const screeningApi = {
  /**
   * Run bulk candidate screening against pre-indexed resumes or current corpus
   * Endpoint: POST /screen (Currently implemented in backend api/main.py)
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
        experience_compatibility: c.experience_compatibility || (normalizedScore >= 70 ? 'High' : normalizedScore >= 45 ? 'Medium' : 'Low'),
        education_compatibility: c.education_compatibility || 'Satisfied',
      };
    });
  },

  /**
   * Screen uploaded batch of resume files against a job description
   * Endpoint: POST /screen/batch (Proposed backend endpoint for direct multi-file screening)
   */
  async screenFiles(files: File[], jobDescription: string): Promise<CandidateScreeningResult[]> {
    const formData = new FormData();
    formData.append('job_description', jobDescription);
    files.forEach((file) => {
      formData.append('files', file);
    });

    const data = await apiClient.post<RawScreeningResponse>('/screen/batch', formData);

    return (data.candidates || []).map((c, index) => {
      const rawScore = c.score;
      const normalizedScore = rawScore > 1 ? Math.min(100, Math.round(rawScore)) : Math.round(rawScore * 100);
      const verdict: MatchVerdict = c.verdict || verdictForScore(normalizedScore);

      return {
        resume_id: `batch-${index + 1}-${c.candidate}`,
        file_name: c.candidate,
        candidate_name: c.candidate.replace(/_Resume.*|\.pdf.*$/i, '').replace(/[-_]/g, ' '),
        score: normalizedScore,
        verdict: verdict,
        matched_skills: c.matched_skills || [],
        missing_skills: c.missing_skills || [],
        experience_years: c.experience_years ?? null,
        experience_compatibility: c.experience_compatibility || 'Medium',
        education_compatibility: c.education_compatibility || 'Satisfied',
      };
    });
  },
};
