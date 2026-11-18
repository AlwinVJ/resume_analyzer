import React from 'react';
import { cn } from '../../utils/cn';
import { Check, Loader2 } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

export interface ProgressStepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStepIndex,
  className,
}) => {
  return (
    <div className={cn('w-full py-4', className)}>
      <div className="flex items-center justify-between relative">
        {/* Background connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 flex-1 px-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all border-2',
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-white border-emerald-600 text-emerald-600 shadow-sm ring-4 ring-emerald-50'
                    : 'bg-white border-slate-300 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium mt-2 text-center',
                  isCurrent ? 'text-emerald-700 font-semibold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="text-[10px] text-slate-400 text-center hidden md:block">
                  {step.description}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
