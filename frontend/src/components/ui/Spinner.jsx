import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-6 w-6' }) {
  return <Loader2 className={`animate-spin text-emerald ${className}`} aria-label="Loading" />;
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
