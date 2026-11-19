import React, { createContext, useContext, useState } from 'react';
import { MatchResult, CandidateScreeningResult } from '../types';

export type NavigationTab = 'dashboard' | 'analyze' | 'screening' | 'history' | 'candidate-detail';

interface AppContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedMatchResult: MatchResult | null;
  setSelectedMatchResult: (result: MatchResult | null) => void;
  selectedCandidate: CandidateScreeningResult | null;
  setSelectedCandidate: (candidate: CandidateScreeningResult | null) => void;
  navigateToCandidateDetail: (candidate: CandidateScreeningResult, result?: MatchResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedMatchResult, setSelectedMatchResult] = useState<MatchResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateScreeningResult | null>(null);

  const navigateToCandidateDetail = (candidate: CandidateScreeningResult, result?: MatchResult) => {
    setSelectedCandidate(candidate);
    if (result) {
      setSelectedMatchResult(result);
    } else if (candidate.match_result) {
      setSelectedMatchResult(candidate.match_result);
    } else {
      setSelectedMatchResult(null);
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
