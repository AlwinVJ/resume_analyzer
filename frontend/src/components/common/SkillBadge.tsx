import React from 'react';
import { cn } from '../../utils/cn';
import { Check, X, AlertTriangle } from 'lucide-react';

export interface SkillBadgeProps {
  name: string;
  type?: 'matched' | 'missing-required' | 'missing-preferred' | 'neutral';
  importance?: number;
  evidence?: string;
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  type = 'neutral',
  importance,
  evidence,
  className,
}) => {
  const styles = {
    matched: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/70',
    'missing-required': 'bg-rose-50 text-rose-800 border-rose-200/90 hover:bg-rose-100/70',
    'missing-preferred': 'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/70',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70',
  };

  const icons = {
    matched: <Check className="w-3 h-3 text-emerald-600 shrink-0" />,
    'missing-required': <X className="w-3 h-3 text-rose-600 shrink-0" />,
    'missing-preferred': <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />,
    neutral: null,
  };

  return (
    <span
      title={evidence || (importance ? `Weight: ${importance}` : undefined)}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
        styles[type],
        className
      )}
    >
      {icons[type]}
      <span className="capitalize">{name}</span>
      {type === 'missing-required' && (
        <span className="text-[10px] uppercase font-semibold text-rose-500 bg-rose-100/60 px-1 rounded">
          Req
        </span>
      )}
    </span>
  );
};
