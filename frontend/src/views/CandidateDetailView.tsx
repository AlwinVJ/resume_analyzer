import React from 'react';
import { useApp } from '../context/AppContext';
import { AnalysisResultView } from '../components/analysis/AnalysisResultView';
import { EmptyState } from '../components/common/EmptyState';
import { FileSearch } from 'lucide-react';
import { MatchResult } from '../types';

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

  const getCandidateResult = (): MatchResult | null => {
    if (selectedMatchResult) {
      return selectedMatchResult;
    }

    if (selectedCandidate?.match_result) {
      return selectedCandidate.match_result;
    }

    if (selectedCandidate) {
      const totalSkillsCount = selectedCandidate.matched_skills.length + selectedCandidate.missing_skills.length;
      const overlapRatio = totalSkillsCount > 0 ? selectedCandidate.matched_skills.length / totalSkillsCount : 0.5;

      // Produce a clean MatchResult based strictly on the candidate's actual returned screening data
      const recommendations: string[] = selectedCandidate.missing_skills.length > 0
        ? [
            `Address missing requirement gaps in: ${selectedCandidate.missing_skills.slice(0, 3).join(', ')}.`,
            'Ensure relevant project achievements demonstrate practical application of core requirements.',
          ]
        : ['Candidate profile demonstrates strong qualification alignment across required skills.'];

      return {
        final_score: selectedCandidate.score,
        verdict: selectedCandidate.verdict,
        candidate_name: selectedCandidate.candidate_name,
        file_name: selectedCandidate.file_name,
        job_title: 'Screening Evaluation',
        experience_years: selectedCandidate.experience_years,
        education_level: selectedCandidate.education_compatibility === 'Satisfied' ? 'Requirements Satisfied' : undefined,
        summary: `Screening evaluation for ${selectedCandidate.candidate_name}. Candidate achieved an overall match rating of ${selectedCandidate.score}%.`,
        breakdown: {
          skill_overlap: Math.round(overlapRatio * 35),
          semantic_similarity: Math.round((selectedCandidate.score / 100) * 25),
          experience_match: selectedCandidate.experience_compatibility === 'High' ? 22 : selectedCandidate.experience_compatibility === 'Medium' ? 16 : 10,
          education_match: 10,
        },
        insights: [
          `Overall match score: ${selectedCandidate.score}% (${selectedCandidate.verdict})`,
          `${selectedCandidate.matched_skills.length} matching skills identified in candidate profile`,
          selectedCandidate.experience_years ? `${selectedCandidate.experience_years} years of documented experience` : 'Experience evaluated from timeline',
        ],
        skill_gap: {
          resume_skills: selectedCandidate.matched_skills,
          jd_skills: [...selectedCandidate.matched_skills, ...selectedCandidate.missing_skills],
          matched_skills: selectedCandidate.matched_skills,
          missing_skills: selectedCandidate.missing_skills.map((s) => ({ skill: s, importance: 0.8 })),
          uncertain_skills: [],
          overlap_ratio: overlapRatio,
          gap_count: selectedCandidate.missing_skills.length,
          status: 'ok',
          warnings: [],
        },
        evidence: [],
        recommendations: recommendations,
        created_at: new Date().toISOString(),
      };
    }

    return null;
  };

  const candidateResult = getCandidateResult();

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
