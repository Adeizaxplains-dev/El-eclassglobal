import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingCart,
  Truck,
  Users2,
  Wallet,
} from 'lucide-react';

import * as analyticsService from '../../services/analyticsService.js';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { formatCurrency } from '../../utils/currency.js';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../../components/ui/StatusBadge.jsx';

function formatDate(date) {
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function getStatusCount(statusBreakdown, status) {
  return statusBreakdown?.[status] || 0;
}

function SalesChart({ data }) {
  const chart = useMemo(() => {
    if (!data?.length) return null;

    const width = 700;
    const height = 250;
    const padding = {
      top: 20,
      right: 20,
      bottom: 35,
      left: 55,
    };

    const values = data.map((item) => Number(item.revenue) || 0);
    const max = Math.max(...values, 1);

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((item, index) => {
      const x =
        padding.left +
        (data.length === 1
          ? chartWidth / 2
          : (index / (data.length - 1)) * chartWidth);

      const y =
        padding.top +
        chartHeight -
        ((Number(item.revenue) || 0) / max) * chartHeight;

      return {
        x,
        y,
        revenue: Number(item.revenue) || 0,
        date: item._id,
      };
    });

    const line = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    const area = `${line} L ${points[points.length - 1].x} ${
      padding.top + chartHeight
    } L ${points[0].x} ${padding.top + chartHeight} Z`;

    return {
      width,
      height,
      padding,
      points,
      line,
      area,
      max,
    };
  }, [data]);

  if (!chart) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-xl bg-charcoal/[0.02]">
        <div className="text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-charcoal/20" />
          <p className="mt-2 text-sm text-muted">
            No sales data available yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="h-[250px] min-w-[600px] w-full"
        preserveAspectRatio="none"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((percentage) => {
          const y =
            chart.padding.top +
            (chart.height -
              chart.padding.top -
              chart.padding.bottom) *
              (1 - percentage);

          const value = chart.max * percentage;

          return (
            <g key={percentage}>
              <line
                x1={chart.padding.left}
                y1={y}
                x2={chart.width - chart.padding.right}
                y2={y}
                stroke="currentColor"
                className="text-charcoal/5"
              />

              <text
                x={chart.padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-charcoal/40 text-[10px]"
              >
                ₦{Math.round(value).toLocaleString('en-NG')}
              </text>
            </g>
          );
        })}

        <path
          d={chart.area}
          className="fill-emerald/10"
        />

        <path
          d={chart.line}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald"
        />

        {chart.points.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            className="fill-emerald stroke-white"
            strokeWidth="2"
          />
        ))}

        {chart.points.map((point, index) => {
          if (
            index !== 0 &&
            index !== chart.points.length - 1 &&
            index % Math.ceil(chart.points.length / 5) !== 0
          ) {
            return null;
          }

          return (
            <text
              key={`label-${point.date}-${index}`}
              x={point.x}
              y={chart.height - 10}
              textAnchor="middle"
              className="fill-charcoal/40 text-[10px]"
            >
              {new Intl.DateTimeFormat('en-NG', {
                day: 'numeric',
                month: 'short',
              }).format(new Date(point.date))}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function OrderStatusCard({ icon: Icon, label, value, description }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal/[0.04]">
          <Icon className="h-5 w-5 text-charcoal/60" />
        </div>

        <div>
          <p className="text-sm font-medium text-charcoal">{label}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>

      <span className="text-xl font-semibold text-charcoal">{value}</span>
    </div>
  );
}

export function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState([]);
  const [error, setError] = useState(null);
  const [salesError, setSalesError] = useState(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      analyticsService.getOverview(),
      analyticsService.getSalesOverTime(30),
    ])
      .then(([overviewData, salesData]) => {
        if (!mounted) return;

        setOverview(overviewData);
        setSales(salesData || []);
      })
      .catch((err) => {
        if (!mounted) return;

        // Overview failure should stop the dashboard.
        if (!overview) {
          setError(err.message);
        } else {
          setSalesError(err.message);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!overview) return <PageSpinner />;

  const statusBreakdown = overview.orderStatusBreakdown || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald">
            Store overview
          </p>

          <h1 className="mt-1 font-display text-2xl font-semibold text-charcoal sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted">
            Monitor sales, orders, customers and inventory from one place.
            All figures are based on your live store data.
          </p>
        </div>

        <NavLink
  to="/admin/analytics"
  className={({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-emerald/10 text-emerald'
        : 'text-muted hover:bg-charcoal/[0.04] hover:text-charcoal'
    }`
  }
>
  <BarChart3 className="h-4 w-4" />
  Analytics
</NavLink>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total sales"
          value={formatCurrency(overview.totalSales)}
          icon={Wallet}
        />

        <StatCard
          label="Paid orders"
          value={overview.paidOrders}
          icon={ShoppingCart}
        />

        <StatCard
          label="Customers"
          value={overview.totalCustomers}
          icon={Users2}
        />

        <StatCard
          label="Active products"
          value={overview.activeProducts}
          icon={Package}
        />
      </div>

      {/* Main analytics row */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        {/* Sales performance */}
        <section className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10">
                  <BarChart3 className="h-4 w-4 text-emerald" />
                </div>

                <h2 className="font-display text-lg font-semibold text-charcoal">
                  Sales performance
                </h2>
              </div>

              <p className="mt-2 text-sm text-muted">
                Revenue from paid orders over the last 30 days.
              </p>
            </div>

            <NavLink
  to="/admin/analytics"
  className={({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-emerald/10 text-emerald'
        : 'text-muted hover:bg-charcoal/[0.04] hover:text-charcoal'
    }`
  }
>
  <BarChart3 className="h-4 w-4" />
  Analytics
</NavLink>
          </div>

          <div className="mt-6">
            {salesError ? (
              <div className="rounded-xl bg-terracotta/5 px-4 py-8 text-center text-sm text-terracotta">
                Unable to load sales performance.
              </div>
            ) : (
              <SalesChart data={sales} />
            )}
          </div>
        </section>

        {/* Order status */}
        <section className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-charcoal">
              Order status
            </h2>

            <p className="mt-1 text-sm text-muted">
              Current order distribution.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <OrderStatusCard
              icon={Clock3}
              label="Pending"
              description="Awaiting processing"
              value={getStatusCount(statusBreakdown, 'pending')}
            />

            <OrderStatusCard
              icon={Package}
              label="Processing"
              description="Being prepared"
              value={getStatusCount(statusBreakdown, 'processing')}
            />

            <OrderStatusCard
              icon={Truck}
              label="Shipped"
              description="On the way"
              value={getStatusCount(statusBreakdown, 'shipped')}
            />

            <OrderStatusCard
              icon={CheckCircle2}
              label="Delivered"
              description="Successfully delivered"
              value={getStatusCount(statusBreakdown, 'delivered')}
            />
          </div>
        </section>
      </div>

      {/* Low stock */}
      {overview.lowStockProducts > 0 && (
        <section className="rounded-2xl border border-gold/20 bg-gold/[0.06] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                <AlertTriangle className="h-5 w-5 text-gold-dark" />
              </div>

              <div>
                <h2 className="font-medium text-charcoal">
                  Inventory attention required
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {overview.lowStockProducts} product
                  {overview.lowStockProducts > 1 ? 's are' : ' is'} currently
                  running low on stock.
                </p>
              </div>
            </div>

            <Link
              to="/admin/products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal/90"
            >
              Review inventory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section className="rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-charcoal/10 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-charcoal">
              Recent orders
            </h2>

            <p className="mt-1 text-sm text-muted">
              The latest activity from your store.
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald hover:underline"
          >
            View all orders
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {overview.recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-charcoal/15" />

            <p className="mt-3 text-sm font-medium text-charcoal">
              No orders yet
            </p>

            <p className="mt-1 text-sm text-muted">
              Orders will appear here as customers complete checkout.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-charcoal/10 bg-charcoal/[0.02]">
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {overview.recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-charcoal/5 last:border-b-0 hover:bg-charcoal/[0.015]"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="font-medium text-emerald hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-charcoal">
                          {order.customerId?.name || 'Unknown customer'}
                        </p>

                        {order.customerId?.phone && (
                          <p className="mt-0.5 text-xs text-muted">
                            {order.customerId.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-muted">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-6 py-4 font-medium text-charcoal">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>

                    <td className="px-6 py-4">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Quick actions
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link
            to="/admin/products"
            className="group rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald/20 hover:shadow-md"
          >
            <Package className="h-5 w-5 text-emerald" />

            <h3 className="mt-4 font-medium text-charcoal">
              Manage products
            </h3>

            <p className="mt-1 text-sm text-muted">
              Add products, update prices and manage inventory.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald">
              Open products
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            to="/admin/orders"
            className="group rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald/20 hover:shadow-md"
          >
            <ShoppingCart className="h-5 w-5 text-emerald" />

            <h3 className="mt-4 font-medium text-charcoal">
              Manage orders
            </h3>

            <p className="mt-1 text-sm text-muted">
              Process orders and update delivery status.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald">
              Open orders
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            to="/admin/customers"
            className="group rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald/20 hover:shadow-md"
          >
            <Users2 className="h-5 w-5 text-emerald" />

            <h3 className="mt-4 font-medium text-charcoal">
              View customers
            </h3>

            <p className="mt-1 text-sm text-muted">
              Review customer information and purchase activity.
            </p>

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald">
              Open customers
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}