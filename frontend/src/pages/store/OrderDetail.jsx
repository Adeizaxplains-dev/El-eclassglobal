import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, MessageCircle, XCircle } from 'lucide-react';
import * as orderService from '../../services/orderService.js';
import * as paymentService from '../../services/paymentService.js';
import { formatCurrency } from '../../utils/currency.js';
import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PaymentStatusBadge, OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { useStoreInfo } from '../../hooks/useStoreInfo.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';

export function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const { store } = useStoreInfo();

  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const loadOrder = () => orderService.getOrder(id).then(setOrder).catch((err) => setError(err.message));

  useEffect(() => {
    // If Paystack redirected back with a reference, verify it against the
    // backend BEFORE trusting the order is paid — this page never assumes
    // success just because the customer landed here.
    if (reference) {
      setVerifying(true);
      paymentService
        .verifyPayment(reference)
        .catch(() => {})
        .finally(() => {
          setVerifying(false);
          loadOrder();
        });
    } else {
      loadOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reference]);

  if (error) return <div className="container-page py-16"><ErrorState message={error} /></div>;
  if (!order || verifying) return <PageSpinner />;

  const isPaid = order.paymentStatus === 'paid';
  const whatsappHref = store
    ? buildWhatsAppLink(store.whatsappNumber, `Hello ${store.name}, I have a question about my order ${order.orderNumber}.`)
    : '#';

  return (
    <div className="container-page max-w-2xl py-14">
      <div className="rounded-xl bg-white p-8 text-center shadow-card">
        {isPaid ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald" />
        ) : order.paymentStatus === 'failed' ? (
          <XCircle className="mx-auto h-14 w-14 text-terracotta" />
        ) : (
          <Clock className="mx-auto h-14 w-14 text-gold" />
        )}

        <h1 className="mt-4 font-display text-2xl font-semibold text-charcoal">
          {isPaid ? 'Thank you for your order!' : order.paymentStatus === 'failed' ? 'Payment was not successful' : 'Order received'}
        </h1>
        <p className="mt-1 text-sm text-muted">Order {order.orderNumber}</p>

        <div className="mt-5 flex justify-center gap-3">
          <PaymentStatusBadge status={order.paymentStatus} />
          <OrderStatusBadge status={order.orderStatus} />
        </div>

        <div className="mt-8 space-y-3 border-t border-charcoal/10 pt-6 text-left">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-charcoal/80">
                {item.name} {item.size ? `(${item.size})` : ''} × {item.quantity}
              </span>
              <span className="font-medium text-charcoal">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4 text-base font-semibold text-charcoal">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button as={Link} to="/shop" variant="outline" size="lg" className="flex-1">
            Continue shopping
          </Button>
          <Button as="a" href={whatsappHref} target="_blank" rel="noreferrer" variant="whatsapp" size="lg" className="flex-1">
            <MessageCircle className="h-4 w-4" /> Message us about this order
          </Button>
        </div>
      </div>
    </div>
  );
}
