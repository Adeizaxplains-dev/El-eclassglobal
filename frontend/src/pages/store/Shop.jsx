import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as productService from '../../services/productService.js';
import * as categoryService from '../../services/categoryService.js';
import { ProductGrid } from '../../components/product/ProductGrid.jsx';
import { ProductFilters } from '../../components/product/ProductFilters.jsx';
import { Pagination } from '../../components/admin/Pagination.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const filters = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    categoryService.listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setResult(null);
    setError(null);
    productService
      .listProducts(filters)
      .then(setResult)
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const updateFilters = (next) => {
    const params = {};
    Object.entries(next).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    setSearchParams(params);
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Shop all gadgets</h1>

      <div className="mt-6">
        <ProductFilters categories={categories} filters={filters} onChange={updateFilters} />
      </div>

      <div className="mt-8">
        {error && <ErrorState message={error} onRetry={() => setSearchParams(filters)} />}
        {!error && result === null && <PageSpinner />}
        {!error && result !== null && (
          <>
            <ProductGrid products={result.items} emptyMessage="Try adjusting your filters, or check back soon for new pieces." />
            <Pagination
              page={result.pagination.page}
              pages={result.pagination.pages}
              onChange={(page) => updateFilters({ ...filters, page })}
            />
          </>
        )}
      </div>
    </div>
  );
}
