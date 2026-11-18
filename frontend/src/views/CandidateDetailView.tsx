import React from 'react';
import { useApp } from '../context/AppContext';
import { AnalysisResultView } from '../components/analysis/AnalysisResultView';
import { EmptyState } from '../components/common/EmptyState';
import { FileSearch } from 'lucide-react';
import { MOCK_ANALYSIS_RESULT } from '../services/mockData';

export const CandidateDetailView: React.FC = () => {
  const {
    selectedCandidate,
    selectedMatchResult,
    setCurrentTab,
    setSelectedMatchResult,
    setSelectedCandidate,
  } = useApp();

  const handleBack = () => {
    setSelectedMatchResult(null);
    setSelectedCandidate(null);
    setCurrentTab('screening');
  };

  const candidateResult = selectedMatchResult || (selectedCandidate?.match_result ? selectedCandidate.match_result : null) || (
    selectedCandidate ? {
      ...MOCK_ANALYSIS_RESULT,
      candidate_name: selectedCandidate.candidate_name,
      file_name: selectedCandidate.file_name,
      final_score: selectedCandidate.score,
      verdict: selectedCandidate.verdict,
      experience_years: selectedCandidate.experience_years,
      skill_gap: {
        ...MOCK_ANALYSIS_RESULT.skill_gap,
        matched_skills: selectedCandidate.matched_skills,
        missing_skills: selectedCandidate.missing_skills.map((s) => ({ skill: s, importance: 0.8 })),
        gap_count: selectedCandidate.missing_skills.length,
      },
    } : null
  );

  if (!candidateResult) {
    return (
      <EmptyState
        icon={<FileSearch className="w-8 h-8 text-slate-400" />}
        title="No Candidate Selected"
        description="Select a candidate from the screening table or analysis history to view their detailed evaluation breakdown."
        actionText="Go to Bulk Screening"
        onAction={() => setCurrentTab('screening')}
      />
    );
  }

  return (
    <AnalysisResultView
      result={candidateResult}
      onBack={handleBack}
    />
  );
};
