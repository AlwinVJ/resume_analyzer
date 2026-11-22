import React from 'react';
import { cn } from '../../utils/cn';
import { MatchVerdict } from '../../types';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export interface StatusBadgeProps {
  verdict: MatchVerdict | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  verdict,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const normalized = verdict.toLowerCase();

  const isStrong = normalized.includes('strong') || normalized.includes('high') || normalized.includes('satisfied');
  const isModerate = normalized.includes('moderate') || normalized.includes('medium') || normalized.includes('partial');
  // else weak/low/mismatch

  const getStyles = () => {
    if (isStrong) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (isModerate) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    };
  };

  const { bg, icon } = getStyles();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        bg,
        className
      )}
    >
      {showIcon && icon}
      <span>{verdict}</span>
    </span>
  );
};
