import React from 'react';
import { Card } from '../common/Card';
import { EvidenceItem } from '../../types';
import { Quote, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EvidenceViewerCardProps {
  evidence: EvidenceItem[];
}

export const EvidenceViewerCard: React.FC<EvidenceViewerCardProps> = ({ evidence }) => {
  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-indigo-600" />
          <span>Grounded Evidence & Citations</span>
        </div>
      }
      subtitle="Excerpts retrieved directly from resume sections to back up scoring decisions"
    >
      <div className="space-y-3">
        {evidence && evidence.length > 0 ? (
          evidence.map((item, idx) => {
            const isMatch = item.type === 'matched';
            return (
              <div
                key={idx}
                className={cn(
                  'p-3.5 rounded-lg border text-xs leading-relaxed transition-colors',
                  isMatch
                    ? 'bg-blue-50/60 border-blue-200/80 text-blue-950'
                    : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isMatch ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="capitalize">{item.section || 'Resume Text'}</span>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded font-medium uppercase',
                      isMatch
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {isMatch ? 'Matched Evidence' : 'Gap Note'}
                  </span>
                </div>
                <p className="italic font-serif text-slate-800">
                  "{item.quote}"
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 italic">No specific text citations available for this run.</p>
        )}
      </div>
    </Card>
  );
};
