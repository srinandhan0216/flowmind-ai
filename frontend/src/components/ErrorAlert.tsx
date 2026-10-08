import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Something went wrong',
  message,
  onRetry
}) => {
  return (
    <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-850/60 text-rose-200 flex items-start gap-3.5 my-4">
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <h4 className="font-semibold text-sm text-rose-100">{title}</h4>
        <p className="text-xs text-rose-300/80 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 border border-rose-700/60 text-rose-100 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
};
