import React from 'react';
import { cn } from '../../utils/cn';

export interface CircularProgressProps {
  completed: number;
  total: number;
  failed?: number;
  size?: number;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  completed,
  total,
  failed = 0,
  size = 124,
  label = 'resumes processed',
  className,
}) => {
  const stroke = 9;
  const dimension = size;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeTotal = Math.max(1, total);
  const safeCompleted = Math.min(safeTotal, Math.max(0, completed));
  const safeFailed = Math.min(safeCompleted, Math.max(0, failed));
  const safeSuccessful = safeCompleted - safeFailed;

  const successfulRatio = safeSuccessful / safeTotal;
  const failedRatio = safeFailed / safeTotal;

  const successfulStrokeLength = successfulRatio * circumference;
  const failedStrokeLength = failedRatio * circumference;
  const failedOffset = -successfulStrokeLength;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      aria-label={`Resumes processed: ${completed} of ${total}`}
      className={cn('inline-flex flex-col items-center justify-center text-center select-none', className)}
    >
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={dimension}
          height={dimension}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background Track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="transparent"
          />

          {/* Successful (Emerald) Arc */}
          {safeSuccessful > 0 && (
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius}
              stroke="#10b981"
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={`${successfulStrokeLength} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Failed (Rose) Arc */}
          {safeFailed > 0 && (
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius}
              stroke="#f43f5e"
              strokeWidth={stroke}
              fill="transparent"
              strokeDasharray={`${failedStrokeLength} ${circumference}`}
              strokeDashoffset={failedOffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          )}
        </svg>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center justify-center text-center px-2">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {completed} / {total}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};
