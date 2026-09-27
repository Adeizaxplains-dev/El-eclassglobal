import React from 'react';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-charcoal/15 px-6 py-16 text-center">
      {Icon && <Icon className="mb-4 h-10 w-10 text-muted" strokeWidth={1.5} />}
      <h3 className="font-display text-lg font-semibold text-charcoal">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
