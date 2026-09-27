import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency.js';
import { Badge } from '../ui/Badge.jsx';

export function ProductCard({ product }) {
  const effectivePrice =
    product.salePrice != null && product.salePrice < product.basePrice
      ? product.salePrice
      : product.basePrice;

  const onSale =
    product.salePrice != null && product.salePrice < product.basePrice;

  const inStock =
    product.variants?.length > 0
      ? product.variants.some((v) => v.stock > 0)
      : product.stock > 0;

  const image = product.images?.[0]?.url;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-charcoal/5">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No image
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {onSale && <Badge variant="sale">Sale</Badge>}
          {product.isNewArrival && <Badge variant="gold">New</Badge>}
          {!inStock && <Badge variant="neutral">Sold out</Badge>}
        </div>
      </div>

      <div className="mt-3">
        <p className="truncate text-sm font-medium text-charcoal">
          {product.name}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-emerald">
            {formatCurrency(effectivePrice)}
          </span>

          {onSale && (
            <span className="text-xs text-muted line-through">
              {formatCurrency(product.basePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
