import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-terracotta/20 bg-terracotta/5 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-terracotta" strokeWidth={1.5} />
      <p className="text-sm text-charcoal">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-sm font-medium text-emerald underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
