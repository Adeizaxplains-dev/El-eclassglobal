import React from 'react';
import { formatCurrency } from '../../utils/currency.js';
export function CartSummary({ subtotal, deliveryFee = 0, children }) {
  const total = subtotal + deliveryFee;

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-charcoal">Order summary</h2>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-charcoal/80">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-charcoal/80">
          <span>Delivery</span>
          <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Calculated at delivery'}</span>
        </div>
      </div>
      <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4 text-base font-semibold text-charcoal">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
      {children}
    </div>
  );
}
