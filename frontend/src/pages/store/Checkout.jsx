import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart.js';
import { CheckoutForm } from '../../components/checkout/CheckoutForm.jsx';
import { CartSummary } from '../../components/cart/CartSummary.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import * as orderService from '../../services/orderService.js';
import * as paymentService from '../../services/paymentService.js';
import { getSessionId } from '../../utils/session.js';
import { getAttribution } from '../../utils/attribution.js';

export function Checkout() {
  const { items, subtotal, refreshCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleSubmit = async (form) => {
    setSubmitting(true);
    setError(null);
    try {
      const { source, campaign } = getAttribution();

      const order = await orderService.createOrder({
        sessionId: getSessionId(),
        customer: { name: form.name, phone: form.phone, email: form.email },
        delivery: { address: form.address, state: form.state, city: form.city, note: form.note },
        source,
        campaign,
      });

      await refreshCart();

      const payment = await paymentService.initializePayment(order._id, getSessionId());

      // Hand off to Paystack's hosted checkout — the backend verifies the
      // result independently once the customer is redirected back.
      window.location.href = payment.authorizationUrl;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Checkout</h1>

      {error && <div className="mt-6"><ErrorState message={error} /></div>}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-card lg:col-span-2">
          <CheckoutForm onSubmit={handleSubmit} submitting={submitting} />
        </div>
        <div>
          <CartSummary subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}
