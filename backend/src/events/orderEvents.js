import { EventEmitter } from 'events';

/**
 * Central event bus for order/customer lifecycle events.
 *
 * Services emit lifecycle events here.
 * Automation handlers subscribe to these events instead of
 * calling WhatsApp or automation services directly.
 *
 * This keeps the order service independent from the automation layer.
 */
export const orderEvents = new EventEmitter();

export const ORDER_EVENTS = {
  PAID: 'order.paid',
  CANCELLED: 'order.cancelled',
  STATUS_CHANGED: 'order.status_changed',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CART_ABANDONED: 'cart.abandoned',
};