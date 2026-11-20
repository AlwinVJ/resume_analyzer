import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Request Could Not Be Completed',
  message,
  onRetry,
  onDismiss,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-900 shadow-xs flex items-start gap-3.5',
        className
      )}
    >
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
        <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-white hover:bg-rose-50 text-rose-700 border-rose-300 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-600 transition-colors p-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
