import React from 'react';
import { Badge } from './Badge.jsx';

const PAYMENT_VARIANTS = {
  pending: 'pending',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
};

const ORDER_VARIANTS = {
  pending: 'pending',
  processing: 'gold',
  shipped: 'gold',
  delivered: 'success',
  cancelled: 'danger',
};

export function PaymentStatusBadge({ status }) {
  return (
    <Badge variant={PAYMENT_VARIANTS[status] || 'neutral'}>
      {status}
    </Badge>
  );
}

export function OrderStatusBadge({ status }) {
  return (
    <Badge variant={ORDER_VARIANTS[status] || 'neutral'}>
      {status}
    </Badge>
  );
}