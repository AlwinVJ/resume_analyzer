import React, { useState } from 'react';
import { Card } from '../common/Card';
import { SkillBadge } from '../common/SkillBadge';
import { SkillGapReport } from '../../types';
import { Check, Copy, AlertTriangle, Layers } from 'lucide-react';

export interface SkillAnalysisCardProps {
  skillGap: SkillGapReport;
}

export const SkillAnalysisCard: React.FC<SkillAnalysisCardProps> = ({ skillGap }) => {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'matched' | 'missing'>('all');

  const matchPercentage = Math.round((skillGap.overlap_ratio || 0) * 100);

  const handleCopyMissing = () => {
    const text = skillGap.missing_skills.map((s) => s.skill).join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requiredMissing = skillGap.missing_skills.filter((s) => s.type === 'required' || s.importance >= 0.8);
  const preferredMissing = skillGap.missing_skills.filter((s) => s.type === 'preferred' || s.importance < 0.8);

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Skill Coverage & Gap Analysis</span>
        </div>
      }
      subtitle={`Matched ${skillGap.matched_skills.length} of ${skillGap.jd_skills.length} target skills (${matchPercentage}%)`}
      action={
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'all' ? 'bg-white font-medium text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('matched')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'matched' ? 'bg-white font-medium text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Matched ({skillGap.matched_skills.length})
            </button>
            <button
              onClick={() => setFilter('missing')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'missing' ? 'bg-white font-medium text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Gaps ({skillGap.gap_count})
            </button>
          </div>

          {skillGap.missing_skills.length > 0 && (
            <button
              onClick={handleCopyMissing}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs transition-colors"
              title="Copy missing skills list"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Gaps'}</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Matched Skills Section */}
        {(filter === 'all' || filter === 'matched') && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Verified Matched Skills ({skillGap.matched_skills.length})
              </span>
            </div>
            {skillGap.matched_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillGap.matched_skills.map((skill, idx) => {
                  const ev = skillGap.evidence_map?.[skill];
                  return (
                    <SkillBadge
                      key={idx}
                      name={skill}
                      type="matched"
                      evidence={ev?.quote ? `From ${ev.source_section}: "${ev.quote}"` : undefined}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No skills matched directly with requirements.</p>
            )}
          </div>
        )}

        {/* Missing Required Skills Section */}
        {(filter === 'all' || filter === 'missing') && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {requiredMissing.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Critical Missing Requirements ({requiredMissing.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {requiredMissing.map((s, idx) => (
                    <SkillBadge
                      key={idx}
                      name={s.skill}
                      type="missing-required"
                      importance={s.importance}
                    />
                  ))}
                </div>
              </div>
            )}

            {preferredMissing.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Secondary / Preferred Skill Gaps ({preferredMissing.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {preferredMissing.map((s, idx) => (
                    <SkillBadge
                      key={idx}
                      name={s.skill}
                      type="missing-preferred"
                      importance={s.importance}
                    />
                  ))}
                </div>
              </div>
            )}

            {skillGap.missing_skills.length === 0 && (
              <p className="text-xs text-emerald-600 font-medium">All target skills are matched!</p>
            )}
          </div>
        )}

        {/* Uncertain or unverified items if any */}
        {skillGap.uncertain_skills && skillGap.uncertain_skills.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
              Contextually Uncertain Skills ({skillGap.uncertain_skills.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {skillGap.uncertain_skills.map((skill, idx) => (
                <SkillBadge key={idx} name={skill} type="neutral" />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
