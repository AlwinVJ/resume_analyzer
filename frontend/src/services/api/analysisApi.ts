import { apiClient } from './client';
import { MatchResult } from '../../types';

export interface AnalyzeRequest {
  resume_id?: string;
  job_description: string;
}

export const analysisApi = {
  /**
   * Run a single resume analysis comparing a resume against a job description
   * Endpoint: POST /analyze
   *
   * Accepts either an existing resume_id or a direct file upload multipart request.
   */
  async analyze(params: {
    resume_id?: string;
    file?: File;
    job_description: string;
  }): Promise<MatchResult> {
    if (params.file) {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('job_description', params.job_description);
      if (params.resume_id) {
        formData.append('resume_id', params.resume_id);
      }
      return apiClient.post<MatchResult>('/analyze', formData);
    }

    return apiClient.post<MatchResult>('/analyze', {
      resume_id: params.resume_id,
      job_description: params.job_description,
    });
  },
};
