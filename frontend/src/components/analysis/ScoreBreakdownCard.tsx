import React from 'react';
import { Card } from '../common/Card';
import { ScoreGauge } from '../common/ScoreGauge';
import { ProgressBar } from '../common/ProgressBar';
import { ScoreBreakdown } from '../../types';
import { CheckCircle2 } from 'lucide-react';

export interface ScoreBreakdownCardProps {
  finalScore: number;
  verdict: string;
  summary?: string;
  breakdown: ScoreBreakdown;
  breakdownMax?: ScoreBreakdown;
  insights: string[];
}

export const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({
  finalScore,
  verdict,
  summary,
  breakdown,
  breakdownMax,
  insights,
}) => {
  // Default weights from get_weights('mid') in src/scoring/weighted_score.py: 35 / 25 / 30 / 10
  const maxWeights = breakdownMax || {
    skill_overlap: 35,
    semantic_similarity: 25,
    experience_match: 30,
    education_match: 10,
  };

  const maxSkill = maxWeights.skill_overlap || 35;
  const maxSemantic = maxWeights.semantic_similarity || 25;
  const maxExp = maxWeights.experience_match || 30;
  const maxEdu = maxWeights.education_match || 10;

  return (
    <Card className="overflow-hidden border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Overall Score Radial Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 lg:border-r lg:border-slate-100">
          <ScoreGauge
            score={finalScore}
            label="Match Score"
            size="lg"
            verdict={verdict}
          />
        </div>

        {/* Right: Component Breakdown & Insights */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
          {summary && summary.trim().length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900 block mb-0.5">Executive Summary</span>
              {summary}
            </div>
          )}

          {/* Progress Bars for Scoring Pillars */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Scoring Weight Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProgressBar
                label="Skill Overlap"
                sublabel={`Max ${maxSkill} pts`}
                value={Math.round((breakdown.skill_overlap / maxSkill) * 100)}
                scoreDisplay={`${breakdown.skill_overlap.toFixed(1)} / ${maxSkill}`}
                color="emerald"
              />
              <ProgressBar
                label="Semantic Similarity"
                sublabel={`Max ${maxSemantic} pts`}
                value={Math.round((breakdown.semantic_similarity / maxSemantic) * 100)}
                scoreDisplay={`${breakdown.semantic_similarity.toFixed(1)} / ${maxSemantic}`}
                color="indigo"
              />
              <ProgressBar
                label="Experience Alignment"
                sublabel={`Max ${maxExp} pts`}
                value={Math.round((breakdown.experience_match / maxExp) * 100)}
                scoreDisplay={`${breakdown.experience_match.toFixed(1)} / ${maxExp}`}
                color="blue"
              />
              <ProgressBar
                label="Education Match"
                sublabel={`Max ${maxEdu} pts`}
                value={Math.round((breakdown.education_match / maxEdu) * 100)}
                scoreDisplay={`${breakdown.education_match.toFixed(1)} / ${maxEdu}`}
                color="purple"
              />
            </div>
          </div>

          {/* Key Insights bullets */}
          {insights && insights.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Scoring Signals & Verification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
