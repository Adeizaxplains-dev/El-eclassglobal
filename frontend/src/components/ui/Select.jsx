import React from 'react';

export function Select({ label, error, className = '', id, children, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-charcoal">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full rounded-xl border border-charcoal/15 bg-white px-4 py-2.5 text-sm text-charcoal focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
    </div>
  );
}
