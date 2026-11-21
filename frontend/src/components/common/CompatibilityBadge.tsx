import React from 'react';
import { cn } from '../../utils/cn';
import { CompatibilityLevel, EducationCompatibility } from '../../types';

export interface CompatibilityBadgeProps {
  level?: CompatibilityLevel | EducationCompatibility | string | null;
  size?: 'sm' | 'md';
  fallbackText?: string;
  plainTextIfNull?: boolean;
  className?: string;
}

export const CompatibilityBadge: React.FC<CompatibilityBadgeProps> = ({
  level,
  size = 'md',
  fallbackText = 'Not evaluated',
  plainTextIfNull = false,
  className,
}) => {
  if (!level || level === 'Not evaluated') {
    if (plainTextIfNull) {
      return (
        <span className={cn('text-slate-400 font-normal', size === 'sm' ? 'text-xs' : 'text-sm', className)}>
          {fallbackText}
        </span>
      );
    }
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium border rounded-full select-none bg-slate-50 text-slate-500 border-slate-200/80',
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
          className
        )}
      >
        <span>{fallbackText}</span>
      </span>
    );
  }

  const normalized = level.toLowerCase().trim();

  let styles = 'bg-slate-50 text-slate-600 border-slate-200/80';
  if (normalized === 'high' || normalized === 'exceeds' || normalized === 'meets') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (normalized === 'medium' || normalized === 'partially meets') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (normalized === 'low' || normalized === 'does not meet') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        styles,
        className
      )}
    >
      <span>{level}</span>
    </span>
  );
};
