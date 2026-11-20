import React from 'react';
import { CandidateScreeningResult } from '../../types';
import { ScoreGauge } from '../common/ScoreGauge';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { X, Trophy, Check, AlertTriangle, Briefcase, GraduationCap } from 'lucide-react';

export interface CandidateCompareModalProps {
  candidates: CandidateScreeningResult[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate: (candidate: CandidateScreeningResult) => void;
}

export const CandidateCompareModal: React.FC<CandidateCompareModalProps> = ({
  candidates,
  isOpen,
  onClose,
  onSelectCandidate,
}) => {
  if (!isOpen || candidates.length === 0) return null;

  // Find top score candidate
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const topPick = sorted[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Side-by-Side Candidate Comparison ({candidates.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct dimensional comparison across match score, skill coverage, and seniority
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Pick Banner */}
        {candidates.length > 1 && topPick && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Top Recommended Pick
                </span>
                <span className="text-sm font-bold text-emerald-950">
                  {topPick.candidate_name} ({topPick.score}%)
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onSelectCandidate(topPick)}
            >
              Open Full Report
            </Button>
          </div>
        )}

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(candidates.length, 3)} gap-6`}>
            {candidates.map((cand) => (
              <div
                key={cand.resume_id}
                className="bg-slate-50/60 rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4"
              >
                {/* Candidate Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge verdict={cand.verdict} size="sm" />
                    <span className="text-xs font-mono text-slate-400">
                      Rank #{sorted.findIndex((x) => x.resume_id === cand.resume_id) + 1}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{cand.candidate_name}</h4>
                  <span className="text-xs text-slate-500 font-mono block truncate">
                    {cand.file_name}
                  </span>
                </div>

                {/* Score Gauge */}
                <div className="py-2 flex justify-center">
                  <ScoreGauge score={cand.score} size="sm" showVerdict={false} />
                </div>

                {/* Comparison Metrics */}
                <div className="space-y-2.5 text-xs border-t border-slate-200/70 pt-3">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      Experience
                    </span>
                    <span className="font-semibold text-slate-800">
                      {cand.experience_years ? `${cand.experience_years} Years` : 'Not specified'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Matched Skills
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {cand.matched_skills.length} skills
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Skill Gaps
                    </span>
                    <span className="font-semibold text-amber-700">
                      {cand.missing_skills.length} missing
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      Education
                    </span>
                    <span className="font-semibold text-slate-800">
                      {cand.education_compatibility || 'Satisfied'}
                    </span>
                  </div>
                </div>

                {/* Skills tags preview */}
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Top Verified Skills
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {cand.matched_skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {cand.matched_skills.length > 4 && (
                      <span className="text-[10px] text-slate-400 py-0.5">
                        +{cand.matched_skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Selection Action */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectCandidate(cand)}
                  className="w-full bg-white hover:bg-slate-100"
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
};
