import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-xl bg-white shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}
