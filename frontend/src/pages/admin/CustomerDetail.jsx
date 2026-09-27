import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as customerService from '../../services/customerService.js';
import { Select } from '../../components/ui/Select.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { formatCurrency } from '../../utils/currency.js';
const STATUSES = ['lead', 'prospect', 'customer', 'repeat_customer', 'vip', 'inactive'];

export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    customerService
      .getCustomer(id)
      .then((d) => {
        setData(d);
        setStatus(d.customer.customerStatus);
        setNotes(d.customer.notes || '');
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customerService.updateCustomer(id, { customerStatus: status, notes });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!data) return <PageSpinner />;

  const { customer, orders } = data;

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/admin/customers')} className="text-sm text-emerald hover:underline">← Back to customers</button>

      <h1 className="mt-3 font-display text-2xl font-semibold text-charcoal">{customer.name}</h1>
      <p className="text-sm text-muted">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-card">
          <p className="text-xs text-muted">Total orders</p>
          <p className="mt-1 font-display text-xl font-semibold text-charcoal">{customer.totalOrders}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <p className="text-xs text-muted">Total spent</p>
          <p className="mt-1 font-display text-xl font-semibold text-charcoal">{formatCurrency(customer.totalSpent)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <p className="text-xs text-muted">Acquisition source</p>
          <p className="mt-1 font-display text-xl font-semibold capitalize text-charcoal">{customer.acquisitionSource}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 rounded-xl bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-charcoal">Manage customer</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </Select>
        </div>
        <div className="mt-4">
          <Textarea label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this customer" />
        </div>
        <Button type="submit" className="mt-4" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <div className="mt-6">
        <h2 className="font-display text-lg font-semibold text-charcoal">Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-charcoal/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-charcoal/10 bg-charcoal/[0.02] text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="cursor-pointer border-b border-charcoal/5 last:border-b-0 hover:bg-emerald/5" onClick={() => navigate(`/admin/orders/${o._id}`)}>
                    <td className="px-4 py-3 font-medium text-emerald">{o.orderNumber}</td>
                    <td className="px-4 py-3">{formatCurrency(o.total)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={o.paymentStatus} /></td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.orderStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
