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
  insights: string[];
}

export const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({
  finalScore,
  verdict,
  summary,
  breakdown,
  insights,
}) => {
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
          {summary && (
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
                sublabel="Max 35%"
                value={Math.round((breakdown.skill_overlap / 35) * 100)}
                scoreDisplay={`${breakdown.skill_overlap.toFixed(1)} / 35`}
                color="emerald"
              />
              <ProgressBar
                label="Semantic Similarity"
                sublabel="Max 25%"
                value={Math.round((breakdown.semantic_similarity / 25) * 100)}
                scoreDisplay={`${breakdown.semantic_similarity.toFixed(1)} / 25`}
                color="indigo"
              />
              <ProgressBar
                label="Experience Alignment"
                sublabel="Max 25%"
                value={Math.round((breakdown.experience_match / 25) * 100)}
                scoreDisplay={`${breakdown.experience_match.toFixed(1)} / 25`}
                color="blue"
              />
              <ProgressBar
                label="Education Match"
                sublabel="Max 15%"
                value={Math.round((breakdown.education_match / 15) * 100)}
                scoreDisplay={`${breakdown.education_match.toFixed(1)} / 15`}
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
