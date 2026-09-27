import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from "../../utils/currency.js";
import { QuantityStepper } from '../ui/QuantityStepper.jsx';

export function CartItemRow({ item, onUpdateQuantity, onRemove, updating }) {
  return (
    <div className="flex gap-4 border-b border-charcoal/10 py-5 last:border-b-0">
      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
        {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-charcoal">{item.name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {[item.color, item.size].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            aria-label={`Remove ${item.name} from cart`}
            onClick={() => onRemove(item._id)}
            className="text-muted hover:text-terracotta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <QuantityStepper
            value={item.quantity}
            disabled={updating}
            onChange={(qty) => onUpdateQuantity(item._id, qty)}
          />
          <span className="text-sm font-semibold text-emerald">{formatCurrency(item.unitPrice * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
}
