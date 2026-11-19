import { ApiError } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Sanitizes technical or internal backend errors into friendly, production-grade messages.
 * Prevents raw technical error codes or stack traces from reaching end users.
 */
function sanitizeErrorMessage(status: number, rawMessage?: string): string {
  const lower = (rawMessage || '').toLowerCase();

  // Unsupported media type
  if (status === 415 || lower.includes('pdf') || lower.includes('unsupported') || lower.includes('extension')) {
    return 'This file format is not supported. Please upload a valid PDF document.';
  }

  // File size limit
  if (status === 413 || lower.includes('size') || lower.includes('too large') || lower.includes('payload')) {
    return 'The uploaded file exceeds the size limit. Please upload a PDF under 10MB.';
  }

  // Unprocessable input or validation error
  if (status === 422) {
    if (lower.includes('job') || lower.includes('description')) {
      return 'Please provide a valid job description before continuing.';
    }
    if (lower.includes('corrupt') || lower.includes('parse') || lower.includes('resume')) {
      return "We couldn't process this resume. Please ensure it is a valid text-based PDF.";
    }
    return 'The provided information could not be processed. Please check your inputs.';
  }

  // Service unavailable (e.g. LLM, vector index, backend down)
  if (status === 503 || status === 502 || status === 504 || lower.includes('unavailable') || lower.includes('timeout')) {
    return 'The analysis service is temporarily unavailable. Please try again in a moment.';
  }

  // Not found
  if (status === 404) {
    return 'The requested analysis or candidate record could not be found.';
  }

  // Network connection error
  if (status === 0 || lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Unable to connect to the server. Please check your connection and try again.';
  }

  // Generic internal server error
  if (status >= 500) {
    return 'Something went wrong while processing your request. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;
    const url = this.buildUrl(endpoint, params);

    const config: RequestInit = {
      ...customConfig,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        // Log technical detail to console for developer inspection without showing in UI
        if (typeof console !== 'undefined' && console.error) {
          console.error(`[API Error] ${config.method || 'GET'} ${endpoint} -> Status ${response.status}`, data);
        }

        const rawDetail = typeof data === 'object' && data !== null && 'detail' in data
          ? String((data as { detail: unknown }).detail)
          : typeof data === 'string'
          ? data
          : undefined;

        const friendlyMessage = sanitizeErrorMessage(response.status, rawDetail);

        const error: ApiError = {
          message: friendlyMessage,
          status: response.status,
        };
        throw error;
      }

      return data as T;
    } catch (err: unknown) {
      if ((err as ApiError).message && (err as ApiError).status !== undefined) {
        throw err;
      }

      // Log network error for developer inspection
      if (typeof console !== 'undefined' && console.error) {
        console.error(`[Network Error] ${config.method || 'GET'} ${endpoint}`, err);
      }

      const networkError: ApiError = {
        message: sanitizeErrorMessage(0),
        status: 0,
      };
      throw networkError;
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options?.headers || {}),
      },
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
