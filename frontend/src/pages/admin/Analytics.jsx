import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  Package,
  RefreshCw,
  ShoppingBag,
  Target,
  Users,
  Wallet,
} from 'lucide-react';

import * as analyticsService from '../../services/analyticsService.js';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { formatCurrency } from '../../utils/currency.js';
const PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-NG').format(Number(value || 0));
}

function StatBox({
  label,
  value,
  icon: Icon,
  description,
  trend,
  positive = true,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald/[0.04] transition group-hover:bg-emerald/[0.08]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-charcoal">
            {value}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {trend !== undefined && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                  positive
                    ? 'bg-emerald/10 text-emerald'
                    : 'bg-terracotta/10 text-terracotta'
                }`}
              >
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {trend}
              </span>
            )}

            {description && (
              <span className="text-[11px] text-muted">{description}</span>
            )}
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, description, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-charcoal/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-xs leading-5 text-muted">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function SalesChart({ data }) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-charcoal/[0.025]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
            <BarChart3 className="h-6 w-6" />
          </div>

          <p className="mt-4 text-sm font-medium text-charcoal">
            No sales data yet
          </p>

          <p className="mt-1 text-xs text-muted">
            Paid orders will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  const totalRevenue = chartData.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0
  );

  const totalOrders = chartData.reduce(
    (sum, item) => sum + Number(item.orders || 0),
    0
  );

  const averageOrderValue =
    totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const revenues = chartData.map((item) => Number(item.revenue || 0));

  const maxRevenue = Math.max(...revenues, 1);

  /*
   * SVG chart dimensions.
   * viewBox makes the graph responsive without needing
   * an external chart library.
   */
  const width = 1000;
  const height = 330;

  const padding = {
    top: 25,
    right: 25,
    bottom: 45,
    left: 70,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = chartData.map((item, index) => {
    const x =
      chartData.length === 1
        ? padding.left + chartWidth / 2
        : padding.left +
          (index / (chartData.length - 1)) * chartWidth;

    const revenue = Number(item.revenue || 0);

    const y =
      padding.top +
      chartHeight -
      (revenue / maxRevenue) * chartHeight;

    return {
      x,
      y,
      revenue,
      orders: Number(item.orders || 0),
      date: item._id,
    };
  });

  const linePath = points
    .map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ');

  /*
   * Area underneath the line.
   */
  const areaPath =
    points.length > 0
      ? `
        ${linePath}
        L ${points[points.length - 1].x} ${
          padding.top + chartHeight
        }
        L ${points[0].x} ${padding.top + chartHeight}
        Z
      `
      : '';

  /*
   * Keep date labels readable.
   * On longer ranges we don't display every single label.
   */
  const labelInterval =
    chartData.length <= 10
      ? 1
      : chartData.length <= 20
        ? 2
        : chartData.length <= 45
          ? 5
          : 7;

  const yGridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-charcoal/[0.025] p-4">
          <p className="text-xs text-muted">Revenue</p>

          <p className="mt-1 text-lg font-bold text-charcoal">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="rounded-xl bg-charcoal/[0.025] p-4">
          <p className="text-xs text-muted">Paid orders</p>

          <p className="mt-1 text-lg font-bold text-charcoal">
            {formatNumber(totalOrders)}
          </p>
        </div>

        <div className="col-span-2 rounded-xl bg-charcoal/[0.025] p-4 sm:col-span-1">
          <p className="text-xs text-muted">Average order value</p>

          <p className="mt-1 text-lg font-bold text-charcoal">
            {formatCurrency(averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[330px] w-full overflow-visible"
            role="img"
            aria-label="Sales revenue line chart"
          >
            <defs>
              <linearGradient
                id="salesAreaGradient"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity="0.18"
                />

                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Horizontal grid */}
            {yGridLines.map((position) => {
              const y =
                padding.top + chartHeight * position;

              const value =
                maxRevenue * (1 - position);

              return (
                <g key={position}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    strokeDasharray="4 5"
                  />

                  <text
                    x={padding.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted text-[11px]"
                  >
                    {formatCurrency(value)}
                  </text>
                </g>
              );
            })}

            {/* Bottom axis */}
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + chartHeight}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              strokeOpacity="0.12"
            />

            {/* Area under line */}
            <path
              d={areaPath}
              fill="url(#salesAreaGradient)"
              className="text-emerald"
            />

            {/* Main line */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald"
            />

            {/* Data points */}
            {points.map((point, index) => {
              const shouldShowLabel =
                index % labelInterval === 0 ||
                index === points.length - 1;

              return (
                <g key={`${point.date}-${index}`}>
                  {/* Invisible larger hover target */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="16"
                    fill="transparent"
                  >
                    <title>
                      {formatDate(point.date)} —{' '}
                      {formatCurrency(point.revenue)} —{' '}
                      {formatNumber(point.orders)} orders
                    </title>
                  </circle>

                  {/* Visible point */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    className="fill-white stroke-emerald"
                    strokeWidth="3"
                  />

                  {/* Date */}
                  {shouldShowLabel && (
                    <text
                      x={point.x}
                      y={height - 12}
                      textAnchor="middle"
                      className="fill-muted text-[11px]"
                    >
                      {formatDate(point.date)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend / footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
          <span>Daily revenue</span>
        </div>

        <span>
          {chartData.length} recorded day
          {chartData.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function TopProducts({ products }) {
  if (!products?.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal/[0.04] text-muted">
            <Package className="h-6 w-6" />
          </div>

          <p className="mt-4 text-sm font-medium text-charcoal">
            No product sales yet
          </p>

          <p className="mt-1 text-xs text-muted">
            Your best-selling products will appear here.
          </p>
        </div>
      </div>
    );
  }

  const maxUnits = Math.max(
    ...products.map((product) => Number(product.unitsSold || 0)),
    1
  );

  return (
    <div className="space-y-5">
      {products.map((product, index) => {
        const unitsSold = Number(product.unitsSold || 0);
        const revenue = Number(product.revenue || 0);
        const percentage = (unitsSold / maxUnits) * 100;

        return (
          <div key={product._id || index}>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  index === 0
                    ? 'bg-emerald text-white'
                    : 'bg-charcoal/[0.05] text-charcoal'
                }`}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-charcoal">
                  {product.name || 'Unnamed product'}
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  {formatNumber(unitsSold)} units sold
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-charcoal">
                  {formatCurrency(revenue)}
                </p>

                <p className="text-[10px] text-muted">revenue</p>
              </div>
            </div>

            <div className="ml-11 mt-3 h-2 overflow-hidden rounded-full bg-charcoal/[0.05]">
              <div
                className="h-full rounded-full bg-emerald transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AcquisitionSources({ sources }) {
  if (!sources?.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal/[0.04] text-muted">
            <Users className="h-6 w-6" />
          </div>

          <p className="mt-4 text-sm font-medium text-charcoal">
            No acquisition data yet
          </p>

          <p className="mt-1 text-xs text-muted">
            Traffic sources will appear as paid orders are recorded.
          </p>
        </div>
      </div>
    );
  }

  const totalRevenue = sources.reduce(
    (sum, source) => sum + Number(source.revenue || 0),
    0
  );

  return (
    <div className="space-y-5">
      {sources.map((source, index) => {
        const revenue = Number(source.revenue || 0);
        const orders = Number(source.orders || 0);

        const percentage =
          totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

        const sourceName =
          source._id && String(source._id).trim()
            ? String(source._id)
            : 'Direct';

        return (
          <div key={`${sourceName}-${index}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                {index === 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold capitalize text-charcoal">
                  {sourceName}
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  {formatNumber(orders)} paid orders
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-charcoal">
                  {formatCurrency(revenue)}
                </p>

                <p className="text-[10px] text-muted">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="ml-12 mt-3 h-2 overflow-hidden rounded-full bg-charcoal/[0.05]">
              <div
                className="h-full rounded-full bg-emerald transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConversionFunnel({ funnel }) {
  const rows = Array.isArray(funnel) ? funnel : [];

  if (!rows.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal/[0.04] text-muted">
            <Target className="h-6 w-6" />
          </div>

          <p className="mt-4 text-sm font-medium text-charcoal">
            No funnel data yet
          </p>

          <p className="mt-1 text-xs text-muted">
            Customer journey data will appear as visitors interact with the store.
          </p>
        </div>
      </div>
    );
  }

  const labels = {
    product_view: 'Product views',
    add_to_cart: 'Added to cart',
    checkout_started: 'Checkout started',
    payment_successful: 'Payment successful',
    order_completed: 'Orders completed',
  };

  const icons = {
    product_view: Eye,
    add_to_cart: ShoppingBag,
    checkout_started: Wallet,
    payment_successful: CheckCircle2,
    order_completed: CheckCircle2,
  };

  const firstCount = Number(rows[0]?.count || 0);

  return (
    <div className="space-y-5">
      {rows.map((row, index) => {
        const count = Number(row.count || 0);

        const previousCount =
          index > 0 ? Number(rows[index - 1]?.count || 0) : count;

        const fromPrevious =
          previousCount > 0 ? (count / previousCount) * 100 : 0;

        const overall =
          firstCount > 0 ? (count / firstCount) * 100 : 0;

        const Icon = icons[row.step] || Target;

        return (
          <div key={row.step}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-charcoal">
                  {labels[row.step] || row.step}
                </p>

                {index > 0 && (
                  <p className="mt-0.5 text-[11px] text-muted">
                    {fromPrevious.toFixed(1)}% from previous step
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-charcoal">
                  {formatNumber(count)}
                </p>

                <p className="text-[10px] text-muted">
                  {overall.toFixed(1)}% overall
                </p>
              </div>
            </div>

            <div className="ml-12 mt-3 h-3 overflow-hidden rounded-full bg-charcoal/[0.05]">
              <div
                className="h-full rounded-full bg-emerald transition-all duration-700"
                style={{
                  width: `${Math.max(
                    Math.min(overall, 100),
                    count > 0 ? 1 : 0
                  )}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Analytics() {
  const [days, setDays] = useState(30);

  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [acquisitionSources, setAcquisitionSources] = useState([]);
  const [funnel, setFunnel] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        salesData,
        productsData,
        acquisitionData,
        funnelData,
      ] = await Promise.all([
        analyticsService.getSalesOverTime(days),
        analyticsService.getTopProducts(10),
        analyticsService.getAcquisitionSources(),
        analyticsService.getConversionFunnel(days),
      ]);

      setSales(Array.isArray(salesData) ? salesData : []);
      setTopProducts(Array.isArray(productsData) ? productsData : []);
      setAcquisitionSources(
        Array.isArray(acquisitionData) ? acquisitionData : []
      );
      setFunnel(Array.isArray(funnelData) ? funnelData : []);
    } catch (err) {
      setError(err?.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const summary = useMemo(() => {
    const revenue = sales.reduce(
      (sum, item) => sum + Number(item.revenue || 0),
      0
    );

    const orders = sales.reduce(
      (sum, item) => sum + Number(item.orders || 0),
      0
    );

    const unitsSold = topProducts.reduce(
      (sum, item) => sum + Number(item.unitsSold || 0),
      0
    );

    const firstFunnel = Number(funnel[0]?.count || 0);

    const completedFunnel = Number(
      funnel.find((item) => item.step === 'order_completed')?.count || 0
    );

    const conversionRate =
      firstFunnel > 0 ? (completedFunnel / firstFunnel) * 100 : 0;

    const averageOrderValue =
      orders > 0 ? revenue / orders : 0;

    return {
      revenue,
      orders,
      unitsSold,
      conversionRate,
      averageOrderValue,
    };
  }, [sales, topProducts, funnel]);

  if (error && !sales.length && !topProducts.length) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <div className="relative px-5 py-6 sm:px-6">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald/[0.05] blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-emerald">
                  Business intelligence
                </span>
              </div>

              <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
                Analytics
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Monitor sales performance, product demand, acquisition sources,
                and customer conversion from one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-charcoal/10 bg-charcoal/[0.025] p-1">
                {PERIODS.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setDays(period.value)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      days === period.value
                        ? 'bg-white text-charcoal shadow-sm'
                        : 'text-muted hover:text-charcoal'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={loadAnalytics}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-charcoal/10 bg-white px-4 py-2.5 text-sm font-medium text-charcoal shadow-sm transition hover:bg-charcoal/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox
          label="Revenue"
          value={formatCurrency(summary.revenue)}
          icon={CircleDollarSign}
          description={`last ${days} days`}
        />

        <StatBox
          label="Paid orders"
          value={formatNumber(summary.orders)}
          icon={ShoppingBag}
          description={`last ${days} days`}
        />

        <StatBox
          label="Average order"
          value={formatCurrency(summary.averageOrderValue)}
          icon={Wallet}
          description="per paid order"
        />

        <StatBox
          label="Conversion"
          value={`${summary.conversionRate.toFixed(1)}%`}
          icon={Target}
          description="view → completed order"
        />
      </div>

      {/* Sales */}
      <SectionCard
        title="Sales performance"
        description={`Revenue and order activity over the last ${days} days`}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-2.5 py-1 text-[11px] font-semibold text-emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
            Live data
          </span>
        }
      >
        {loading && !sales.length ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <PageSpinner />
          </div>
        ) : (
          <SalesChart data={sales} />
        )}
      </SectionCard>

      {/* Product + acquisition */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Top products"
          description="Your strongest products by units sold"
          action={
            <Package className="h-5 w-5 text-muted" />
          }
        >
          <TopProducts products={topProducts} />
        </SectionCard>

        <SectionCard
          title="Acquisition sources"
          description="Where your paid revenue is coming from"
          action={
            <Users className="h-5 w-5 text-muted" />
          }
        >
          <AcquisitionSources sources={acquisitionSources} />
        </SectionCard>
      </div>

      {/* Funnel */}
      <SectionCard
        title="Conversion funnel"
        description={`Customer journey from product view to completed order over the last ${days} days`}
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <ConversionFunnel funnel={funnel} />

          <div className="rounded-2xl bg-charcoal/[0.025] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
              <Target className="h-5 w-5" />
            </div>

            <p className="mt-5 text-sm font-semibold text-charcoal">
              Overall conversion
            </p>

            <p className="mt-2 text-4xl font-bold tracking-tight text-charcoal">
              {summary.conversionRate.toFixed(1)}%
            </p>

            <p className="mt-3 text-xs leading-5 text-muted">
              Percentage of tracked product views that eventually reached a
              completed order.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-charcoal/10">
              <div
                className="h-full rounded-full bg-emerald transition-all duration-700"
                style={{
                  width: `${Math.min(summary.conversionRate, 100)}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted">Tracked views</span>
              <span className="font-semibold text-charcoal">
                {formatNumber(funnel[0]?.count || 0)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted">Completed orders</span>
              <span className="font-semibold text-charcoal">
                {formatNumber(
                  funnel.find(
                    (item) => item.step === 'order_completed'
                  )?.count || 0
                )}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Partial refresh warning */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm text-terracotta">
          <span className="h-2 w-2 shrink-0 rounded-full bg-terracotta" />
          Some analytics could not be refreshed. Showing the latest available
          data.
        </div>
      )}
    </div>
  );
}

export default Analytics;
