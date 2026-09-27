import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-charcoal/15 disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted">Page {page} of {pages}</span>
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-charcoal/15 disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
