import React from 'react';
import { formatCurrency } from '../../utils/currency.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { CategoryIcon } from './CategoryIcon.jsx';
import { Badge } from '../ui/Badge.jsx';
import { STORE_CONFIG } from '../../config/store.config.js';

export function DemoProductCard({ product, whatsappNumber }) {
  const number = whatsappNumber || STORE_CONFIG.contact.whatsappNumber;
  const message = `Hello ${STORE_CONFIG.brand.name}, I'm interested in the ${product.name}. Is it available?`;
  const href = buildWhatsAppLink(number, message);

  return (
    <a href={href} target="_blank" rel="noreferrer" className="group block">
      <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-surface text-charcoal/25 transition-colors group-hover:border-primary/30 group-hover:text-primary/40">
        <CategoryIcon icon={product.icon} className="h-14 w-14" />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <Badge variant="demo">Demo</Badge>
          {product.wasPrice && <Badge variant="sale">Sale</Badge>}
        </div>
      </div>

      <div className="mt-3">
        <p className="truncate text-sm font-medium text-charcoal">{product.name}</p>
        {product.condition && (
          <p className="mt-0.5 text-xs text-muted">{product.condition}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{formatCurrency(product.price)}</span>
          {product.wasPrice && (
            <span className="text-xs text-muted line-through">{formatCurrency(product.wasPrice)}</span>
          )}
        </div>
      </div>
    </a>
  );
}
