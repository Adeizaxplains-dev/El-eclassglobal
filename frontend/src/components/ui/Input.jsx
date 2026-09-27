import React from 'react';

export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-charcoal">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald ${
          error ? 'border-terracotta' : 'border-charcoal/15'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
    </div>
  );
}
