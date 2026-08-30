import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load data. Please check your connection and try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-red-900/30 bg-red-950/10">
      <div className="p-3 bg-red-500/10 text-red-400 rounded-full mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} className="mt-4">
          Try Again
        </Button>
      )}
    </div>
  );
};
