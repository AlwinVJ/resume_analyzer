import React from 'react';
import { useApp } from '../context/AppContext';
import { AnalysisResultView } from '../components/analysis/AnalysisResultView';
import { ScreeningSummaryView } from '../components/analysis/ScreeningSummaryView';
import { EmptyState } from '../components/common/EmptyState';
import { FileSearch } from 'lucide-react';

export const CandidateDetailView: React.FC = () => {
  const {
    selectedCandidate,
    selectedMatchResult,
    setCurrentTab,
    setSelectedMatchResult,
    setSelectedCandidate,
    candidateDetailReturnTab,
  } = useApp();

  const handleBack = () => {
    if (candidateDetailReturnTab === 'screening') {
      setSelectedMatchResult(null);
      setSelectedCandidate(null);
    }
    setCurrentTab(candidateDetailReturnTab);
  };

  if (selectedMatchResult) {
    return (
      <AnalysisResultView
        result={selectedMatchResult}
        onBack={handleBack}
      />
    );
  }

  if (selectedCandidate?.match_result) {
    return (
      <AnalysisResultView
        result={selectedCandidate.match_result}
        onBack={handleBack}
      />
    );
  }

  if (selectedCandidate) {
    return (
      <ScreeningSummaryView
        candidate={selectedCandidate}
        onBack={handleBack}
      />
    );
  }

  return (
    <EmptyState
      icon={<FileSearch className="w-8 h-8 text-slate-400" />}
      title="No Candidate Selected"
      description="Select a candidate from the screening table or analysis history to view their evaluation details."
      actionText="Go to Bulk Screening"
      onAction={() => setCurrentTab('screening')}
    />
  );
};
