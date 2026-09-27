import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as customerService from '../../services/customerService.js';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { Pagination } from '../../components/admin/Pagination.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { useDebounce } from '../../hooks/useDebounce.js';

const STATUS_VARIANT = { lead: 'neutral', prospect: 'pending', customer: 'success', repeat_customer: 'gold', vip: 'gold', inactive: 'neutral' };

export function Customers() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    customerService
      .listCustomers({ page, search: debouncedSearch || undefined, source: source || undefined })
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [page, debouncedSearch, source]);

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'source', header: 'Source', render: (c) => <Badge>{c.acquisitionSource}</Badge> },
    { key: 'orders', header: 'Orders', render: (c) => c.totalOrders },
    { key: 'spent', header: 'Total spent', render: (c) => formatCurrency(c.totalSpent) },
    { key: 'status', header: 'Status', render: (c) => <Badge variant={STATUS_VARIANT[c.customerStatus]}>{c.customerStatus.replace('_', ' ')}</Badge> },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-charcoal">Customers</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input placeholder="Search name or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={source} onChange={(e) => setSource(e.target.value)} className="w-auto">
          <option value="">All sources</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="direct">Direct</option>
          <option value="google">Google</option>
          <option value="referral">Referral</option>
          <option value="other">Other</option>
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
              emptyMessage="Customers will appear here as orders come in."
              onRowClick={(c) => navigate(`/admin/customers/${c._id}`)}
            />
            <Pagination page={result.pagination.page} pages={result.pagination.pages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
