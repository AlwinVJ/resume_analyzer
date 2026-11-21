import React from 'react';
import { Card } from '../common/Card';
import { Lightbulb, ArrowRight } from 'lucide-react';

export interface RecommendationsCardProps {
  recommendations: string[];
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
}) => {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Actionable Resume Improvement Recommendations</span>
        </div>
      }
      subtitle="Data-driven suggestions to optimize resume keyword alignment and ATS match score"
    >
      <div className="space-y-3">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed hover:bg-slate-100/60 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{rec}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
            </div>
          ))
        ) : (
          <div className="p-3 text-xs text-slate-500 italic">
            <span>No recommendations were generated for this analysis.</span>
          </div>
        )}
      </div>
    </Card>
  );
};
