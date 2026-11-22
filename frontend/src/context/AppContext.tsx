import React, { createContext, useContext, useState } from 'react';
import { MatchResult, CandidateScreeningResult, AnalysisHistoryItem } from '../types';

export type NavigationTab = 'dashboard' | 'analyze' | 'screening' | 'history' | 'candidate-detail' | 'history-session';

interface AppContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedMatchResult: MatchResult | null;
  setSelectedMatchResult: (result: MatchResult | null) => void;
  selectedCandidate: CandidateScreeningResult | null;
  setSelectedCandidate: (candidate: CandidateScreeningResult | null) => void;
  selectedHistorySession: AnalysisHistoryItem | null;
  setSelectedHistorySession: (session: AnalysisHistoryItem | null) => void;
  candidateDetailReturnTab: NavigationTab;
  setCandidateDetailReturnTab: (tab: NavigationTab) => void;
  openHistorySession: (item: AnalysisHistoryItem) => void;
  openMatchResult: (result: MatchResult, returnTab?: NavigationTab) => void;
  navigateToCandidateDetail: (candidate: CandidateScreeningResult, result?: MatchResult, returnTab?: NavigationTab) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedMatchResult, setSelectedMatchResult] = useState<MatchResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateScreeningResult | null>(null);
  const [selectedHistorySession, setSelectedHistorySession] = useState<AnalysisHistoryItem | null>(null);
  const [candidateDetailReturnTab, setCandidateDetailReturnTab] = useState<NavigationTab>('screening');

  const openHistorySession = (item: AnalysisHistoryItem) => {
    setSelectedHistorySession(item);
    setSelectedCandidate(null);
    setSelectedMatchResult(null);
    setCurrentTab('history-session');
  };

  const openMatchResult = (result: MatchResult, returnTab: NavigationTab = 'history-session') => {
    setSelectedCandidate(null);
    setSelectedMatchResult(result);
    setCandidateDetailReturnTab(returnTab);
    setCurrentTab('candidate-detail');
  };

  const navigateToCandidateDetail = (
    candidate: CandidateScreeningResult,
    result?: MatchResult,
    returnTab: NavigationTab = 'screening'
  ) => {
    setSelectedCandidate(candidate);
    if (result) {
      setSelectedMatchResult(result);
    } else if (candidate.match_result) {
      setSelectedMatchResult(candidate.match_result);
    } else {
      setSelectedMatchResult(null);
    }
    setCandidateDetailReturnTab(returnTab);
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
        selectedHistorySession,
        setSelectedHistorySession,
        candidateDetailReturnTab,
        setCandidateDetailReturnTab,
        openHistorySession,
        openMatchResult,
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
