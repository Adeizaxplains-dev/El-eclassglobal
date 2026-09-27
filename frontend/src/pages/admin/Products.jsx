import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ChevronRight,
  Edit3,
  Filter,
  Package,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

import * as productService from '../../services/productService.js';
import { Pagination } from '../../components/admin/Pagination.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { formatCurrency } from '../../utils/currency.js';
const STATUS_VARIANT = {
  active: 'success',
  draft: 'pending',
  archived: 'neutral',
};

const STATUS_LABELS = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};

function getStock(product) {
  if (product.variants?.length) {
    return product.variants.reduce(
      (total, variant) => total + Number(variant.stock || 0),
      0
    );
  }

  return Number(product.stock || 0);
}

function getStockState(stock) {
  if (stock <= 0) {
    return {
      label: 'Out of stock',
      className: 'bg-terracotta/10 text-terracotta',
      dot: 'bg-terracotta',
    };
  }

  if (stock <= 5) {
    return {
      label: 'Low stock',
      className: 'bg-gold/10 text-gold-dark',
      dot: 'bg-gold',
    };
  }

  return {
    label: 'In stock',
    className: 'bg-emerald/10 text-emerald',
    dot: 'bg-emerald',
  };
}

function ProductImage({ product }) {
  const image = product.images?.[0]?.url;

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-charcoal/[0.05]">
      {image ? (
        <img
          src={image}
          alt={product.name || 'Product'}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package className="h-5 w-5 text-muted" />
      )}
    </div>
  );
}

function ProductBadges({ product }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {product.isFeatured && (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-dark">
          <Star className="h-2.5 w-2.5" />
          Featured
        </span>
      )}

      {product.isNewArrival && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">
          <Sparkles className="h-2.5 w-2.5" />
          New
        </span>
      )}
    </div>
  );
}

function ProductRow({ product }) {
  const stock = getStock(product);
  const stockState = getStockState(stock);

  const basePrice = Number(product.basePrice || 0);
  const salePrice =
    product.salePrice !== null && product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  return (
    <tr className="border-b border-charcoal/[0.07] last:border-b-0 hover:bg-charcoal/[0.015]">
      {/* Product */}
      <td className="px-5 py-4">
        <div className="flex min-w-[260px] items-center gap-3">
          <ProductImage product={product} />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-charcoal">
                {product.name || 'Unnamed product'}
              </p>
            </div>

            <div className="mt-1">
              <ProductBadges product={product} />
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-5 py-4">
        <span className="text-sm text-charcoal">
          {product.categoryId?.name || 'Uncategorized'}
        </span>
      </td>

      {/* Price */}
      <td className="px-5 py-4">
        <div>
          {salePrice !== null ? (
            <>
              <p className="text-sm font-semibold text-charcoal">
                {formatCurrency(salePrice)}
              </p>

              <p className="mt-0.5 text-xs text-muted line-through">
                {formatCurrency(basePrice)}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-charcoal">
              {formatCurrency(basePrice)}
            </p>
          )}
        </div>
      </td>

      {/* Stock */}
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-charcoal">
            {stock.toLocaleString('en-NG')}
          </p>

          <span
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockState.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${stockState.dot}`} />
            {stockState.label}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <Badge variant={STATUS_VARIANT[product.status] || 'neutral'}>
          {STATUS_LABELS[product.status] || product.status || 'Unknown'}
        </Badge>
      </td>

      {/* Action */}
      <td className="px-5 py-4 text-right">
        <Link
          to={`/admin/products/${product._id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-xs font-medium text-charcoal transition hover:border-emerald/30 hover:bg-emerald/[0.04] hover:text-emerald"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </Link>
      </td>
    </tr>
  );
}

function MobileProductCard({ product }) {
  const stock = getStock(product);
  const stockState = getStockState(stock);

  const basePrice = Number(product.basePrice || 0);
  const salePrice =
    product.salePrice !== null && product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <ProductImage product={product} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-charcoal">
                {product.name || 'Unnamed product'}
              </h3>

              <p className="mt-1 text-xs text-muted">
                {product.categoryId?.name || 'Uncategorized'}
              </p>
            </div>

            <Badge variant={STATUS_VARIANT[product.status] || 'neutral'}>
              {STATUS_LABELS[product.status] || product.status || 'Unknown'}
            </Badge>
          </div>

          <div className="mt-3">
            <ProductBadges product={product} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-charcoal/[0.025] p-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Price
          </p>

          {salePrice !== null ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-charcoal">
                {formatCurrency(salePrice)}
              </p>

              <p className="text-[11px] text-muted line-through">
                {formatCurrency(basePrice)}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm font-semibold text-charcoal">
              {formatCurrency(basePrice)}
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Inventory
          </p>

          <p className="mt-1 text-sm font-semibold text-charcoal">
            {stock.toLocaleString('en-NG')}
          </p>

          <span
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockState.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${stockState.dot}`} />
            {stockState.label}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Link
          to={`/admin/products/${product._id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-charcoal/10 bg-white px-4 py-2.5 text-sm font-medium text-charcoal transition hover:border-emerald/30 hover:bg-emerald/[0.04] hover:text-emerald"
        >
          <Edit3 className="h-4 w-4" />
          Edit product
        </Link>
      </div>
    </div>
  );
}

function EmptyProducts({ hasSearch }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6 py-12 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
          {hasSearch ? (
            <Search className="h-6 w-6" />
          ) : (
            <Package className="h-6 w-6" />
          )}
        </div>

        <h3 className="mt-5 text-base font-semibold text-charcoal">
          {hasSearch ? 'No products found' : 'Your product catalogue is empty'}
        </h3>

        <p className="mt-2 text-sm leading-6 text-muted">
          {hasSearch
            ? 'Try a different search term or clear your search.'
            : 'Create your first product to start building your storefront catalogue.'}
        </p>
      </div>
    </div>
  );
}

export function Products() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setError(null);

    productService
      .listProductsAdmin({ page })
      .then(setResult)
      .catch((err) => setError(err?.message || 'Unable to load products.'));
  }, [page]);

  const products = result?.items || [];

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.categoryId?.name?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || product.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!result) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald">
            <Package className="h-4 w-4" />
            Catalogue
          </div>

          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
            Products
          </h1>

          <p className="mt-1 text-sm text-muted">
            Manage your products, pricing, inventory and storefront visibility.
          </p>
        </div>

        <Button as={Link} to="/admin/products/new">
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          <p className="text-xs text-muted">Products</p>
          <p className="mt-1 text-xl font-bold text-charcoal">
            {result.pagination?.total ?? products.length}
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          <p className="text-xs text-muted">Active</p>
          <p className="mt-1 text-xl font-bold text-emerald">
            {products.filter((p) => p.status === 'active').length}
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          <p className="text-xs text-muted">Low stock</p>
          <p className="mt-1 text-xl font-bold text-gold-dark">
            {products.filter((p) => {
              const stock = getStock(p);
              return stock > 0 && stock <= 5;
            }).length}
          </p>
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          <p className="text-xs text-muted">Out of stock</p>
          <p className="mt-1 text-xl font-bold text-terracotta">
            {products.filter((p) => getStock(p) <= 0).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or categories..."
              className="h-11 w-full rounded-xl border border-charcoal/10 bg-charcoal/[0.02] pl-10 pr-10 text-sm text-charcoal outline-none transition placeholder:text-muted focus:border-emerald/40 focus:bg-white focus:ring-2 focus:ring-emerald/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-charcoal/10 bg-white px-3 text-sm text-charcoal outline-none focus:border-emerald/40 focus:ring-2 focus:ring-emerald/10"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {(search || statusFilter !== 'all') && (
          <div className="mt-3 flex items-center justify-between border-t border-charcoal/[0.07] pt-3">
            <p className="text-xs text-muted">
              Showing {filteredProducts.length} of {products.length} products
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="text-xs font-medium text-emerald hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm lg:block">
        <div className="border-b border-charcoal/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-charcoal">
                Product catalogue
              </h2>

              <p className="mt-1 text-xs text-muted">
                Manage products currently available in your store.
              </p>
            </div>

            <span className="text-xs text-muted">
              {filteredProducts.length} shown
            </span>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyProducts hasSearch={Boolean(search || statusFilter !== 'all')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-charcoal/10 bg-charcoal/[0.02]">
                <tr className="text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Inventory</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <ProductRow
                    key={product._id}
                    product={product}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="space-y-3 lg:hidden">
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-charcoal/10 bg-white shadow-sm">
            <EmptyProducts
              hasSearch={Boolean(search || statusFilter !== 'all')}
            />
          </div>
        ) : (
          filteredProducts.map((product) => (
            <MobileProductCard
              key={product._id}
              product={product}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {result.pagination?.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            page={result.pagination.page}
            pages={result.pagination.pages}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export default Products;