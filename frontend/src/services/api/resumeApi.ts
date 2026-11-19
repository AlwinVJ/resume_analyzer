import { apiClient } from './client';
import { ResumeProfile } from '../../types';

export interface UploadResumeResponse {
  resume_id: string;
  file_name: string;
  parse_warnings?: string[];
  profile?: ResumeProfile;
}

export const resumeApi = {
  /**
   * Upload a single resume PDF
   * Endpoint: POST /resumes
   */
  async uploadResume(file: File): Promise<UploadResumeResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<UploadResumeResponse>('/resumes', formData);
  },

  /**
   * Fetch a parsed resume profile by ID
   * Endpoint: GET /resumes/{resume_id} (Proposed backend endpoint)
   */
  async getResume(resumeId: string): Promise<ResumeProfile> {
    return apiClient.get<ResumeProfile>(`/resumes/${resumeId}`);
  },

  /**
   * List all indexed resumes
   * Endpoint: GET /resumes (Proposed backend endpoint)
   */
  async listResumes(): Promise<ResumeProfile[]> {
    return apiClient.get<ResumeProfile[]>('/resumes');
  },
};
