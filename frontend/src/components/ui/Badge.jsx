import React from 'react';

const VARIANTS = {
  neutral: 'bg-charcoal/5 text-charcoal',
  sale: 'bg-terracotta/10 text-terracotta',
  gold: 'bg-gold/15 text-gold-dark',
  success: 'bg-emerald/10 text-emerald',
  demo: 'bg-charcoal text-white',
  pending: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
};

export function Badge({ variant = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
