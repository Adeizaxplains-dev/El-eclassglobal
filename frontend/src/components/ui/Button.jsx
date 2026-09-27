import React from 'react';

const VARIANTS = {
  primary: 'bg-emerald text-ivory hover:bg-emerald-light disabled:bg-emerald/50',
  secondary: 'bg-gold text-ivory hover:bg-gold-dark disabled:bg-gold/50',
  outline: 'border border-emerald text-emerald hover:bg-emerald hover:text-ivory disabled:opacity-50',
  ghost: 'text-emerald hover:bg-emerald/10 disabled:opacity-50',
  whatsapp: 'bg-whatsapp text-white hover:brightness-95 disabled:opacity-50',
  danger: 'bg-terracotta text-white hover:brightness-95 disabled:opacity-50',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export function Button({ as: As = 'button', variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <As
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </As>
  );
}
