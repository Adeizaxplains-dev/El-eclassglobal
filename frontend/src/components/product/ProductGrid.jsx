import React from 'react';
import { ProductCard } from './ProductCard.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { PackageSearch } from 'lucide-react';

export function ProductGrid({ products, emptyMessage = 'No products found.' }) {
  if (!products || products.length === 0) {
    return <EmptyState icon={PackageSearch} title="Nothing here yet" description={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
