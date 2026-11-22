import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { FileQuestion } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-dashed border-slate-300',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        {icon || <FileQuestion className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};
