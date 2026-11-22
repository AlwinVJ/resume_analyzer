import React from 'react';
import { CandidateScreeningResult } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CompatibilityBadge } from '../common/CompatibilityBadge';
import { Button } from '../common/Button';
import { formatDuration } from '../../utils/experience';
import { ChevronRight, Briefcase, GraduationCap } from 'lucide-react';

export interface CandidateCardProps {
  candidate: CandidateScreeningResult;
  onSelect: (candidate: CandidateScreeningResult) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onSelect,
  isSelected,
  onToggleSelect,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-all shadow-xs hover:shadow-card flex flex-col justify-between ${
        isSelected ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
              {candidate.candidate_name.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                {candidate.candidate_name}
              </h4>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">
                {candidate.file_name}
              </p>
            </div>
          </div>
          <StatusBadge verdict={candidate.verdict} size="sm" />
        </div>

        {/* Score & Key Highlights */}
        <div className="my-4 flex items-center justify-between p-3 bg-slate-50/70 rounded-lg border border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Match Rating
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {candidate.score}%
            </span>
          </div>
          <div className="text-right text-xs">
            <span className="text-emerald-700 font-medium block">
              {candidate.matched_skills.length} matched
            </span>
            <span className="text-slate-400 block text-[11px]">
              {candidate.missing_skills.length} gaps
            </span>
          </div>
        </div>

        {/* Details row */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              Experience
            </span>
            <div className="text-right flex items-center gap-2">
              {typeof candidate.experience_years === 'number' && (
                <span className="text-[11px] text-slate-500">
                  {formatDuration(Math.round(candidate.experience_years * 12))}
                </span>
              )}
              <CompatibilityBadge
                level={candidate.experience_compatibility}
                plainTextIfNull
                fallbackText="Not evaluated"
                size="sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              Education
            </span>
            <div>
              <CompatibilityBadge
                level={candidate.education_compatibility}
                plainTextIfNull
                fallbackText="Not evaluated"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {onToggleSelect && (
          <button
            onClick={onToggleSelect}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
              isSelected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isSelected ? 'Selected' : 'Compare'}
          </button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-white hover:bg-slate-50 text-slate-700"
          onClick={() => onSelect(candidate)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          View Full Report
        </Button>
      </div>
    </div>
  );
};
