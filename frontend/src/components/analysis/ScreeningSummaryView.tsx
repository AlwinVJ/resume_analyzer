import React from 'react';
import { CandidateScreeningResult } from '../../types';
import { Card } from '../common/Card';
import { ScoreGauge } from '../common/ScoreGauge';
import { StatusBadge } from '../common/StatusBadge';
import { CompatibilityBadge } from '../common/CompatibilityBadge';
import { SkillBadge } from '../common/SkillBadge';
import { formatDuration } from '../../utils/experience';
import { ArrowLeft, FileText, Info, Briefcase, GraduationCap, Layers } from 'lucide-react';

export interface ScreeningSummaryViewProps {
  candidate: CandidateScreeningResult;
  onBack?: () => void;
}

export const ScreeningSummaryView: React.FC<ScreeningSummaryViewProps> = ({
  candidate,
  onBack,
}) => {
  const experienceMonths =
    typeof candidate.experience_years === 'number'
      ? Math.round(candidate.experience_years * 12)
      : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Return to previous view"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {candidate.candidate_name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                {candidate.file_name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge verdict={candidate.verdict} size="md" />
        </div>
      </div>

      {/* Info Alert: Screening Score Only */}
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/60 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-blue-950">Screening Summary</p>
          <p className="text-blue-800 mt-0.5 leading-relaxed">
            Only the screening score is available for this candidate. Run <strong>Analyze Resume</strong> with this file for the full breakdown.
          </p>
        </div>
      </div>

      {/* Main Grid: Score + Qualifications Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Score Radial Card (5 cols) */}
        <div className="md:col-span-5">
          <Card className="p-6 flex flex-col items-center justify-center text-center h-full">
            <ScoreGauge
              score={candidate.score}
              label="Match Score"
              size="lg"
              verdict={candidate.verdict}
            />
          </Card>
        </div>

        {/* Experience & Education Overview (7 cols) */}
        <div className="md:col-span-7">
          <Card
            title="Qualification Overview"
            subtitle="Extracted candidate attributes from screening evaluation"
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Experience Row */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-xs text-slate-500 block">Experience</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDuration(experienceMonths) || 'Not specified'}
                    </span>
                  </div>
                </div>
                <div>
                  <CompatibilityBadge
                    level={candidate.experience_compatibility}
                    fallbackText="Not evaluated"
                    size="sm"
                  />
                </div>
              </div>

              {/* Education Row */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="text-xs text-slate-500 block">Education Compatibility</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {candidate.education_compatibility || 'Not evaluated'}
                    </span>
                  </div>
                </div>
                <div>
                  <CompatibilityBadge
                    level={candidate.education_compatibility}
                    fallbackText="Not evaluated"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Skills Coverage Breakdown */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Extracted Skills</span>
          </div>
        }
        subtitle="Identified skills from candidate profile during screening"
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Matched Skills ({candidate.matched_skills.length})
            </h4>
            {candidate.matched_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {candidate.matched_skills.map((skill, idx) => (
                  <SkillBadge key={idx} name={skill} type="matched" />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No matched skills recorded.</p>
            )}
          </div>

          {candidate.missing_skills.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Missing Requirement Gaps ({candidate.missing_skills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidate.missing_skills.map((skill, idx) => (
                  <SkillBadge key={idx} name={skill} type="missing-required" />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
