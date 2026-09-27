import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  XCircle,
  Zap,
} from 'lucide-react';

import {
  cancelAutomation,
  getAutomationOverview,
  listAutomations,
  retryAutomation,
} from '../../services/automationService.js';

import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { Pagination } from '../../components/admin/Pagination.jsx';

const STATUS_VARIANTS = {
  pending: 'pending',
  processing: 'gold',
  sent: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  sent: 'Sent',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/*
 * These keys MUST match the backend Automation.type enum.
 * The values are the friendly labels shown in the UI.
 */
const TYPE_LABELS = {
  payment_followup: 'Payment Follow-up',
  order_confirmation: 'Order Confirmation',
  shipping_update: 'Shipping Update',
  delivery_update: 'Delivery Update',
  post_purchase: 'Post Purchase',
  abandoned_cart: 'Abandoned Cart',
};

const TYPE_ICONS = {
  payment_followup: Clock3,
  order_confirmation: CheckCircle2,
  shipping_update: Send,
  delivery_update: CheckCircle2,
  post_purchase: MessageCircle,
  abandoned_cart: AlertCircle,
};

function formatNumber(value) {
  return new Intl.NumberFormat('en-NG').format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getStatusVariant(status) {
  return STATUS_VARIANTS[status] || 'neutral';
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || 'Unknown';
}

function getTypeLabel(type) {
  return TYPE_LABELS[type] || type || 'Automation';
}

function StatusBadge({ status }) {
  return (
    <Badge variant={getStatusVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}

function TypeBadge({ type }) {
  const Icon = TYPE_ICONS[type] || Zap;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-charcoal">
      <Icon className="h-4 w-4 text-emerald" />
      {getTypeLabel(type)}
    </span>
  );
}

function EmptyState({ message = 'No automation jobs found.' }) {
  return (
    <div className="py-12 text-center">
      <Zap className="mx-auto h-10 w-10 text-charcoal/20" />

      <p className="mt-3 text-sm text-muted">
        {message}
      </p>
    </div>
  );
}

function AutomationRow({
  automation,
  onCancel,
  onRetry,
  actionId,
}) {
  const id = automation._id || automation.id;
  const isActing = actionId === id;

  const customerName =
    automation.customer?.name ||
    automation.customer?.fullName ||
    automation.customer?.phone ||
    'Customer';

  const channel = automation.channel || 'whatsapp';

  return (
    <div className="border-b border-charcoal/10 px-5 py-4 last:border-b-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <TypeBadge type={automation.type} />
            <StatusBadge status={automation.status} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium text-charcoal">
              {customerName}
            </span>

            <span className="text-muted">
              {channel}
            </span>

            {automation.attempts !== undefined && (
              <span className="text-muted">
                Attempts: {automation.attempts}
              </span>
            )}
          </div>

          <div className="mt-1 text-xs text-muted">
            Created {formatDate(automation.createdAt)}

            {automation.scheduledFor
              ? ` • Scheduled ${formatDate(automation.scheduledFor)}`
              : ''}
          </div>

          {automation.error && (
            <p className="mt-2 text-xs text-red-700">
              {automation.error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {(automation.status === 'pending' ||
            automation.status === 'processing') && (
            <Button
              type="button"
              variant="secondary"
              disabled={isActing}
              onClick={() => onCancel(id)}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
          )}

          {automation.status === 'failed' && (
            <Button
              type="button"
              variant="secondary"
              disabled={isActing}
              onClick={() => onRetry(id)}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Automations() {
  const [overview, setOverview] = useState(null);
  const [automations, setAutomations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [actionId, setActionId] = useState('');

  const loadOverview = useCallback(async () => {
    const response = await getAutomationOverview();

    setOverview(response?.data || response || null);
  }, []);

  const loadAutomations = useCallback(async () => {
    setListLoading(true);

    try {
      const params = {
        page,
        limit: 20,
      };

      if (status) {
        params.status = status;
      }

      if (type) {
        /*
         * type is already the backend enum value:
         * payment_followup
         * order_confirmation
         * shipping_update
         * delivery_update
         * post_purchase
         * abandoned_cart
         */
        params.type = type;
      }

      const response = await listAutomations(params);

      const data = response?.data || response || {};

      setAutomations(
        Array.isArray(data)
          ? data
          : data.items || data.automations || []
      );

      setPagination({
        page: data.page || page,
        pages: data.pages || data.totalPages || 1,
        total: data.total || data.count || 0,
      });
    } finally {
      setListLoading(false);
    }
  }, [page, status, type]);

  const loadData = useCallback(
    async (initial = false) => {
      if (initial) {
        setLoading(true);
      }

      setError('');

      try {
        await Promise.all([
          loadOverview(),
          loadAutomations(),
        ]);
      } catch (err) {
        setError(
          err.message || 'Failed to load automation data.'
        );
      } finally {
        if (initial) {
          setLoading(false);
        }
      }
    },
    [loadOverview, loadAutomations]
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const filteredAutomations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return automations;
    }

    return automations.filter((automation) => {
      const customerName =
        automation.customer?.name ||
        automation.customer?.fullName ||
        automation.customer?.phone ||
        '';

      const searchable = [
        automation.type,
        getTypeLabel(automation.type),
        automation.status,
        automation.channel,
        customerName,
        automation._id,
        automation.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [automations, search]);

  const handleRefresh = async () => {
    await loadData(false);
  };

  const handleCancel = async (automationId) => {
    setActionId(automationId);

    try {
      await cancelAutomation(automationId);
      await loadData(false);
    } catch (err) {
      setError(
        err.message || 'Failed to cancel automation.'
      );
    } finally {
      setActionId('');
    }
  };

  const handleRetry = async (automationId) => {
    setActionId(automationId);

    try {
      await retryAutomation(automationId);
      await loadData(false);
    } catch (err) {
      setError(
        err.message || 'Failed to retry automation.'
      );
    } finally {
      setActionId('');
    }
  };

  const handleStatusChange = (event) => {
    setPage(1);
    setStatus(event.target.value);
  };

  const handleTypeChange = (event) => {
    setPage(1);
    setType(event.target.value);
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (error && !overview && automations.length === 0) {
    return <ErrorState message={error} />;
  }

  const counts =
    overview?.counts ||
    overview?.statusCounts ||
    {};

  const typeCounts =
    overview?.types ||
    overview?.typeCounts ||
    {};

  return (
    <div className="space-y-6">
      {/* Control Center Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-emerald" />

            <h1 className="font-display text-2xl font-semibold text-charcoal">
              Control Center
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted">
            Monitor and control automated customer communication.
          </p>

          {/* Control Center Navigation */}
          <div className="mt-5 inline-flex rounded-xl border border-charcoal/10 bg-white p-1 shadow-sm">
            <Link
              to="/admin/automations"
              className="rounded-lg bg-emerald px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Activity
            </Link>

            <Link
              to="/admin/automations/config"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:bg-charcoal/5 hover:text-charcoal"
            >
              Configuration
            </Link>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleRefresh}
          disabled={listLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              listLoading ? 'animate-spin' : ''
            }`}
          />

          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Pending"
          value={formatNumber(counts.pending)}
          icon={Clock3}
          accent="text-amber-600"
        />

        <StatCard
          label="Processing"
          value={formatNumber(counts.processing)}
          icon={RefreshCw}
          accent="text-gold-dark"
        />

        <StatCard
          label="Sent"
          value={formatNumber(counts.sent)}
          icon={CheckCircle2}
          accent="text-emerald"
        />

        <StatCard
          label="Failed"
          value={formatNumber(counts.failed)}
          icon={AlertCircle}
          accent="text-red-600"
        />

        <StatCard
          label="Sent Today"
          value={formatNumber(
            overview?.sentToday ??
            overview?.sent_today
          )}
          icon={Send}
          accent="text-emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-charcoal">
                Automation Types
              </h2>

              <p className="mt-1 text-sm text-muted">
                Current automation workload by type.
              </p>
            </div>

            <Zap className="h-5 w-5 text-emerald" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {Object.keys(TYPE_LABELS).map(
              (automationType) => {
                const Icon =
                  TYPE_ICONS[automationType] || Zap;

                const value =
                  typeCounts[automationType] || 0;

                return (
                  <div
                    key={automationType}
                    className="flex items-center justify-between rounded-xl border border-charcoal/10 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-emerald" />

                      <span className="text-sm text-charcoal">
                        {getTypeLabel(automationType)}
                      </span>
                    </div>

                    <span className="font-display text-lg font-semibold text-charcoal">
                      {formatNumber(value)}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald" />

            <h2 className="font-display text-lg font-semibold text-charcoal">
              Channels
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {Object.entries(
              overview?.channels || {}
            ).length > 0 ? (
              Object.entries(
                overview.channels
              ).map(([channel, value]) => (
                <div
                  key={channel}
                  className="flex items-center justify-between border-b border-charcoal/10 pb-3 last:border-b-0"
                >
                  <span className="text-sm capitalize text-muted">
                    {channel}
                  </span>

                  <span className="font-display font-semibold text-charcoal">
                    {formatNumber(value)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">
                No channel data available.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-charcoal/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-charcoal">
                Automation Activity
              </h2>

              <p className="mt-1 text-sm text-muted">
                Recent automated jobs and their current state.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search customer or job..."
                  className="pl-9"
                />
              </div>

              <select
                value={status}
                onChange={handleStatusChange}
                className="rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-emerald"
              >
                <option value="">
                  All statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="processing">
                  Processing
                </option>

                <option value="sent">
                  Sent
                </option>

                <option value="failed">
                  Failed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <select
                value={type}
                onChange={handleTypeChange}
                className="rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-emerald"
              >
                <option value="">
                  All types
                </option>

                {Object.entries(TYPE_LABELS).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {listLoading ? (
          <div className="p-10">
            <PageSpinner />
          </div>
        ) : filteredAutomations.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {filteredAutomations.map(
              (automation) => (
                <AutomationRow
                  key={
                    automation._id ||
                    automation.id
                  }
                  automation={automation}
                  onCancel={handleCancel}
                  onRetry={handleRetry}
                  actionId={actionId}
                />
              )
            )}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="border-t border-charcoal/10 p-4">
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
