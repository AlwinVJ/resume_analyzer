import React, { createContext, useContext, useState, useEffect } from 'react';
import { MatchResult, CandidateScreeningResult } from '../types';
import { apiClient } from '../services/api/client';

export type NavigationTab = 'dashboard' | 'analyze' | 'screening' | 'history' | 'candidate-detail';

interface AppContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedMatchResult: MatchResult | null;
  setSelectedMatchResult: (result: MatchResult | null) => void;
  selectedCandidate: CandidateScreeningResult | null;
  setSelectedCandidate: (candidate: CandidateScreeningResult | null) => void;
  isDemoMode: boolean;
  setIsDemoMode: (enabled: boolean) => void;
  backendStatus: 'checking' | 'online' | 'offline';
  backendUrl: string;
  refreshBackendStatus: () => Promise<void>;
  navigateToCandidateDetail: (candidate: CandidateScreeningResult, result?: MatchResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedMatchResult, setSelectedMatchResult] = useState<MatchResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateScreeningResult | null>(null);

  // Initialize Demo Mode based on env or default to false (can be toggled by user in UI)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
  });

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const backendUrl = apiClient.getBaseUrl();

  const refreshBackendStatus = async () => {
    setBackendStatus('checking');
    try {
      // Try /health or root /
      const response = await fetch(`${backendUrl}/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    refreshBackendStatus();
  }, [backendUrl]);

  const navigateToCandidateDetail = (candidate: CandidateScreeningResult, result?: MatchResult) => {
    setSelectedCandidate(candidate);
    if (result) {
      setSelectedMatchResult(result);
    } else if (candidate.match_result) {
      setSelectedMatchResult(candidate.match_result);
    }
    setCurrentTab('candidate-detail');
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        selectedMatchResult,
        setSelectedMatchResult,
        selectedCandidate,
        setSelectedCandidate,
        isDemoMode,
        setIsDemoMode,
        backendStatus,
        backendUrl,
        refreshBackendStatus,
        navigateToCandidateDetail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
