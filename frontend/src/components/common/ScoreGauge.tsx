import React from 'react';
import { cn } from '../../utils/cn';
import { STRONG_MATCH_MIN, MODERATE_MATCH_MIN } from '../../utils/verdict';

export interface ScoreGaugeProps {
  score: number; // 0 to 100
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verdict?: string;
  subtext?: string;
  showVerdict?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label = 'Total Score',
  size = 'md',
  verdict,
  subtext,
  showVerdict = true,
}) => {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  // Dimensions based on size
  const config = {
    sm: { dimension: 88, stroke: 7, text: 'text-xl', labelText: 'text-[10px]' },
    md: { dimension: 124, stroke: 9, text: 'text-3xl', labelText: 'text-xs' },
    lg: { dimension: 156, stroke: 12, text: 'text-4xl', labelText: 'text-xs' },
    xl: { dimension: 188, stroke: 14, text: 'text-5xl', labelText: 'text-sm' },
  }[size];

  const radius = (config.dimension - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  // Determine color styling based on score
  const getColor = () => {
    if (safeScore >= STRONG_MATCH_MIN) {
      return {
        stroke: '#10b981', // emerald-500
        text: 'text-emerald-700',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        verdictDefault: 'Strong Match',
      };
    }
    if (safeScore >= MODERATE_MATCH_MIN) {
      return {
        stroke: '#f59e0b', // amber-500
        text: 'text-amber-700',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        verdictDefault: 'Moderate Match',
      };
    }
    return {
      stroke: '#f43f5e', // rose-500
      text: 'text-rose-700',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      verdictDefault: 'Weak Match',
    };
  };

  const color = getColor();
  const displayVerdict = verdict || color.verdictDefault;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={config.dimension}
          height={config.dimension}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={config.stroke}
            fill="transparent"
          />
          {/* Progress Stroke */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={config.stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={cn('font-bold tracking-tight', config.text, 'text-slate-900')}>
            {safeScore}%
          </span>
          {label && (
            <span className={cn('text-slate-400 font-medium uppercase tracking-wider', config.labelText)}>
              {label}
            </span>
          )}
        </div>
      </div>

      {showVerdict && (
        <div className="mt-3">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
              color.badge
            )}
          >
            {displayVerdict}
          </span>
        </div>
      )}

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 max-w-[200px] leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
};
