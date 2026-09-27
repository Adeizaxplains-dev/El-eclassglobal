import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as orderService from '../../services/orderService.js';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { Pagination } from '../../components/admin/Pagination.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { PaymentStatusBadge, OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { useDebounce } from '../../hooks/useDebounce.js';

export function Orders() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    orderService
      .listOrdersAdmin({ page, search: debouncedSearch || undefined, paymentStatus: paymentStatus || undefined })
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [page, debouncedSearch, paymentStatus]);

  const columns = [
    { key: 'orderNumber', header: 'Order' },
    { key: 'customer', header: 'Customer', render: (o) => o.customerId?.name || '—' },
    { key: 'total', header: 'Total', render: (o) => formatCurrency(o.total) },
    { key: 'payment', header: 'Payment', render: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
    { key: 'status', header: 'Status', render: (o) => <OrderStatusBadge status={o.orderStatus} /> },
    { key: 'date', header: 'Date', render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-charcoal">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input placeholder="Search order number or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-auto">
          <option value="">All payment statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>

      <div className="mt-6">
        {error && <ErrorState message={error} />}
        {!error && !result && <PageSpinner />}
        {!error && result && (
          <>
            <DataTable
              columns={columns}
              rows={result.items}
              emptyMessage="Orders will appear here once customers start checking out."
              onRowClick={(o) => navigate(`/admin/orders/${o._id}`)}
            />
            <Pagination page={result.pagination.page} pages={result.pagination.pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
