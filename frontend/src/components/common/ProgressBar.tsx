import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  scoreDisplay?: string | number;
  color?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  sublabel,
  scoreDisplay,
  color = 'blue',
  size = 'md',
  showPercentage = true,
  className,
}) => {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colorStyles = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-600',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <div>
            {label && <span className="font-medium text-slate-800">{label}</span>}
            {sublabel && <span className="text-slate-400 ml-1.5">({sublabel})</span>}
          </div>
          <span className="font-semibold text-slate-700 font-mono">
            {scoreDisplay !== undefined ? scoreDisplay : `${safeValue}%`}
          </span>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', colorStyles[color])}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
};
