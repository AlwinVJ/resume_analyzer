import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CandidateScreeningResult } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { CandidateTable } from '../components/screening/CandidateTable';
import { CandidateCompareModal } from '../components/screening/CandidateCompareModal';
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  FileText,
  Users,
  ChevronRight,
  Info,
  FileSearch,
} from 'lucide-react';

export const HistorySessionView: React.FC = () => {
  const {
    selectedHistorySession,
    setCurrentTab,
    navigateToCandidateDetail,
    openMatchResult,
  } = useApp();

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [candidatesToCompare, setCandidatesToCompare] = useState<CandidateScreeningResult[]>([]);

  if (!selectedHistorySession) {
    return (
      <EmptyState
        icon={<FileSearch className="w-8 h-8 text-slate-400" />}
        title="No Analysis Session Selected"
        description="Select a record from your analysis history to view its detailed session report and candidates."
        actionText="Back to History"
        onAction={() => setCurrentTab('history')}
      />
    );
  }

  const isBulk = selectedHistorySession.type === 'bulk';
  const hasCandidates = isBulk && Array.isArray(selectedHistorySession.candidates);
  const candidateCount = hasCandidates ? selectedHistorySession.candidates!.length : 0;

  return (
    <div className="space-y-6">
      {/* Top Back Navigation & Action Bar */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentTab('history')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-slate-600 hover:text-slate-900 -ml-2"
        >
          Back to History
        </Button>
      </div>

      {/* Session Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                {isBulk ? 'Bulk Screening' : 'Single Analysis'}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {selectedHistorySession.date}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {selectedHistorySession.job_title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                {isBulk ? (
                  <>
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>
                      {hasCandidates
                        ? `${candidateCount} ${candidateCount === 1 ? 'candidate' : 'candidates'} screened`
                        : selectedHistorySession.candidate_name}
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>1 resume analyzed ({selectedHistorySession.candidate_name})</span>
                  </>
                )}
              </span>

              <span className="font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[11px] border border-slate-100">
                {selectedHistorySession.file_name}
              </span>
            </div>
          </div>

          {/* Score & Verdict Banner */}
          <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 shrink-0 self-start lg:self-center">
            <StatusBadge verdict={selectedHistorySession.verdict} size="md" />
            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                {selectedHistorySession.score}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isBulk ? 'Average score' : 'Match score'}
              </span>
            </div>
          </div>
        </div>

        {/* Job Description Snippet (if available) */}
        {selectedHistorySession.job_description_snippet && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Role Requirements</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              "{selectedHistorySession.job_description_snippet}"
            </p>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isBulk ? (
        // Bulk Session View
        hasCandidates ? (
          candidateCount > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Ranked Candidates ({candidateCount})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any candidate to view their complete match evaluation and qualification breakdown.
                  </p>
                </div>
              </div>

              <CandidateTable
                candidates={selectedHistorySession.candidates!}
                onSelectCandidate={(c) => navigateToCandidateDetail(c, undefined, 'history-session')}
                onCompareCandidates={(candidates) => {
                  setCandidatesToCompare(candidates);
                  setCompareModalOpen(true);
                }}
              />

              <CandidateCompareModal
                candidates={candidatesToCompare}
                isOpen={compareModalOpen}
                onClose={() => setCompareModalOpen(false)}
                onSelectCandidate={(cand) => {
                  setCompareModalOpen(false);
                  navigateToCandidateDetail(cand, undefined, 'history-session');
                }}
              />
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-400" />}
              title="No Candidates Found"
              description="No candidates were returned for this screening session."
              actionText="Back to History"
              onAction={() => setCurrentTab('history')}
            />
          )
        ) : (
          <EmptyState
            icon={<Info className="w-8 h-8 text-amber-500" />}
            title="Candidate Lists Unavailable"
            description="This screening was saved before candidate lists were stored, so its individual results are unavailable. Run the screening again to see all candidates."
            actionText="Run New Screening"
            onAction={() => setCurrentTab('screening')}
          />
        )
      ) : (
        // Single Session View
        selectedHistorySession.result ? (
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedHistorySession.candidate_name || selectedHistorySession.result.candidate_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {selectedHistorySession.file_name || selectedHistorySession.result.file_name}
                    </span>
                    {selectedHistorySession.result.experience_years !== undefined && (
                      <span>{selectedHistorySession.result.experience_years} years experience</span>
                    )}
                    {selectedHistorySession.result.education_level && (
                      <span>{selectedHistorySession.result.education_level}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {selectedHistorySession.result.final_score ?? selectedHistorySession.score}%
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Match score</div>
                </div>
                <StatusBadge
                  verdict={selectedHistorySession.result.verdict || selectedHistorySession.verdict}
                  size="md"
                />
              </div>
            </div>

            {selectedHistorySession.result.summary && (
              <div className="py-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Executive Summary
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedHistorySession.result.summary}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Full qualification breakdown, matched skills, and evidence citations available
              </span>
              <Button
                variant="primary"
                onClick={() => openMatchResult(selectedHistorySession.result!, 'history-session')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                View Full Analysis Report
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<FileSearch className="w-8 h-8 text-slate-400" />}
            title="Analysis Result Unavailable"
            description="Detailed report data for this single analysis record could not be found."
            actionText="Back to History"
            onAction={() => setCurrentTab('history')}
          />
        )
      )}
    </div>
  );
};
