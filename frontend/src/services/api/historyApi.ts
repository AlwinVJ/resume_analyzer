import { apiClient } from './client';
import { AnalysisHistoryItem } from '../../types';

const STORAGE_KEY = 'resume_analyzer_history_v1';

export const historyApi = {
  /**
   * Fetch all saved analysis records
   * Checks backend GET /history first if available, otherwise falls back to client storage.
   */
  async getHistory(): Promise<AnalysisHistoryItem[]> {
    try {
      const response = await apiClient.get<AnalysisHistoryItem[]>('/history');
      if (Array.isArray(response)) {
        return response;
      }
    } catch {
      // Backend history endpoint unavailable; fallback to local storage
    }

    return this.getLocalHistory();
  },

  /**
   * Save an analysis item to history
   */
  async saveHistoryItem(item: AnalysisHistoryItem): Promise<void> {
    try {
      await apiClient.post('/history', item);
    } catch {
      // Backend history endpoint not yet implemented
    }

    // Always keep local storage in sync
    try {
      const current = this.getLocalHistory();
      const updated = [item, ...current.filter((x) => x.id !== item.id)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
      } catch {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
        } catch (retryErr) {
          console.warn('Failed to save analysis history to localStorage:', retryErr);
        }
      }
    } catch (err) {
      console.warn('Failed to update local history storage:', err);
    }
  },

  /**
   * Delete an analysis from history
   */
  async deleteHistoryItem(id: string): Promise<void> {
    try {
      await apiClient.delete(`/history/${id}`);
    } catch {
      // Backend history not yet implemented
    }

    const current = this.getLocalHistory();
    const updated = current.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  /**
   * Clear all analysis history
   */
  async clearHistory(): Promise<void> {
    try {
      await apiClient.delete('/history');
    } catch {
      // Backend history not yet implemented
    }
    localStorage.removeItem(STORAGE_KEY);
  },

  getLocalHistory(): AnalysisHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
};
