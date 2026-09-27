import React from 'react';
import { Card } from '../ui/Card.jsx';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-emerald',
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>

        {Icon && (
          <Icon className={`h-5 w-5 ${accent}`} />
        )}
      </div>

      <p className="mt-2 font-display text-2xl font-semibold text-charcoal">
        {value}
      </p>
    </Card>
  );
}