import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import * as productService from '../../services/productService.js';
import { ProductGrid } from '../../components/product/ProductGrid.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebounce(query, 400);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResult({ items: [] });
      setSearchParams({});
      return;
    }
    setSearchParams({ q: debouncedQuery });
    productService.listProducts({ search: debouncedQuery }).then(setResult);
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Search products</h1>
      <div className="relative mt-6 max-w-lg">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          autoFocus
          placeholder="Search phones, laptops, audio, power…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11"
        />
      </div>

      <div className="mt-8">
        {result === null && query && <PageSpinner />}
        {result !== null && (
          <ProductGrid
            products={result.items}
            emptyMessage={query ? `No results for "${query}". Try a different search.` : 'Start typing to search our gadgets.'}
          />
        )}
      </div>
    </div>
  );
}
