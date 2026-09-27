import React from 'react';
import { Select } from '../ui/Select.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to high' },
  { value: 'price-high', label: 'Price: High to low' },
];

export function ProductFilters({ categories, filters, onChange }) {
  const update = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        aria-label="Category"
        value={filters.category || ''}
        onChange={(e) => update({ category: e.target.value || undefined })}
        className="w-auto"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select aria-label="Sort by" value={filters.sort || 'newest'} onChange={(e) => update({ sort: e.target.value })} className="w-auto">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      <label className="flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white px-4 py-2.5 text-sm">
        <input
          type="checkbox"
          checked={filters.onSale === 'true'}
          onChange={(e) => update({ onSale: e.target.checked ? 'true' : undefined })}
          className="accent-emerald"
        />
        On sale
      </label>
    </div>
  );
}
