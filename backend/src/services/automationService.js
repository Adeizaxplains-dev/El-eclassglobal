import { Automation } from '../models/Automation.js';
import { Store } from '../models/Store.js';
import { getDefaultStoreId } from './storeContext.js';

/**
 * Returns the currently configured store.
 *
 * The current platform is single-store, so this uses the existing
 * getDefaultStoreId() context helper. When multi-store support is added,
 * this can later resolve the store from the authenticated user/request.
 */
async function getCurrentStore() {
  const storeId = await getDefaultStoreId();

  const store = await Store.findById(storeId).select(
    'name currency whatsapp automationSettings'
  );

  if (!store) {
    throw new Error('Store not found');
  }

  return store;
}

/**
 * Determines whether automation is enabled globally and
 * for the requested automation type.
 *
 * Abandoned-cart automation is intentionally excluded here for now.
 * Its lifecycle is controlled by abandonedCartJob.js and must be
 * coordinated there to avoid marking carts abandoned without creating
 * their automation.
 */
function isAutomationEnabled(store, type) {
  const settings = store?.automationSettings;

  /*
   * Backward compatibility:
   * If automationSettings does not exist on an older store document,
   * preserve the previous behavior.
   */
  if (!settings) {
    return true;
  }

  if (settings.enabled === false) {
    return false;
  }

  const typeSettings = {
    payment_followup: settings.paymentFollowUp,
    order_confirmation: settings.orderConfirmation,
    shipping_update: settings.shippingUpdate,
    delivery_update: settings.deliveryUpdate,
    post_purchase: settings.postPurchase,
  };

  const configuration = typeSettings[type];

  /*
   * If a specific configuration is missing, preserve previous behavior.
   */
  if (!configuration) {
    return true;
  }

  return configuration.enabled !== false;
}

/**
 * Formats a monetary amount using the store's configured currency.
 *
 * Falls back to the raw currency code if Intl does not recognize
 * a custom/invalid currency code.
 */
function formatMoney(amount, currency = 'NGN') {
  const numericAmount = Number(amount) || 0;

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toLocaleString()}`;
  }
}

/**
 * Returns an existing automation when a concurrent request
 * attempts to create the same unique automation.
 */
async function createAutomationSafely(data, existingFilter) {
  try {
    return await Automation.create(data);
  } catch (error) {
    /*
     * MongoDB duplicate-key error.
     *
     * This can happen when two requests/processes attempt to
     * create the same automation at almost the same time.
     *
     * The unique indexes on Automation are the final protection.
     */
    if (error?.code === 11000) {
      return Automation.findOne(existingFilter);
    }

    throw error;
  }
}

/**
 * Creates an abandoned-cart automation.
 *
 * IMPORTANT:
 * Abandoned-cart execution is currently controlled by
 * abandonedCartJob.js. The automationSettings.abandonedCart
 * switch will be wired there together with the job's cart
 * lifecycle so we do not create inconsistent abandoned carts.
 */
export async function createAbandonedCartAutomation({
  cart,
  customer,
  scheduledFor = new Date(),
}) {
  const store = await getCurrentStore();
  const storeId = store._id;

  if (!cart?._id) {
    throw new Error('Cart is required');
  }

  if (!customer?._id) {
    throw new Error('Customer is required');
  }

  if (!customer.phone) {
    return null;
  }

  const message = [
    `Hi ${customer.name || 'there'},`,
    '',
    `You left some items in your cart at ${store.name}.`,
    'Your selected items are still waiting for you.',
    '',
    'Complete your order whenever you are ready.',
  ].join('\n');

  const data = {
    storeId,
    type: 'abandoned_cart',
    customerId: customer._id,
    cartId: cart._id,
    channel: 'whatsapp',
    status: 'pending',
    scheduledFor,
    recipient: customer.phone,
    message,
    metadata: {
      itemCount: cart.items.length,
      subtotal: cart.getSubtotal(),
      source: cart.source || '',
      campaign: cart.campaign || '',
    },
  };

  return createAutomationSafely(data, {
    storeId,
    type: 'abandoned_cart',
    cartId: cart._id,
  });
}

/**
 * Creates a payment follow-up for an unpaid order.
 */
export async function createPaymentFollowUpAutomation({
  order,
  customer,
  scheduledFor = new Date(),
}) {
  const store = await getCurrentStore();
  const storeId = store._id;
  const currency = store.currency || 'NGN';

  if (!order?._id) {
    throw new Error('Order is required');
  }

  if (!customer?._id) {
    throw new Error('Customer is required');
  }

  if (!customer.phone) {
    return null;
  }

  /*
   * Never create a payment reminder for an order that has
   * already been paid.
   */
  if (order.paymentStatus === 'paid') {
    return null;
  }

  /*
   * Respect the admin automation configuration.
   */
  if (!isAutomationEnabled(store, 'payment_followup')) {
    return null;
  }

  const existingFilter = {
    storeId,
    type: 'payment_followup',
    orderId: order._id,
  };

  /*
   * Fast path.
   */
  const existing = await Automation.findOne(existingFilter);

  if (existing) {
    return existing;
  }

  const message = [
    `Hi ${customer.name || 'there'},`,
    '',
    `You started an order at ${store.name} but your payment has not been completed.`,
    '',
    `Order number: ${order.orderNumber}.`,
    `Order total: ${formatMoney(order.total, currency)}.`,
    '',
    'Your order is still waiting for payment.',
    'Please complete your payment to confirm your order.',
  ].join('\n');

  return createAutomationSafely(
    {
      storeId,
      type: 'payment_followup',
      customerId: customer._id,
      orderId: order._id,
      channel: 'whatsapp',
      status: 'pending',
      scheduledFor,
      recipient: customer.phone,
      message,
      metadata: {
        orderNumber: order.orderNumber,
        total: order.total,
        currency,
      },
    },
    existingFilter
  );
}

/**
 * Creates an order-confirmation automation after successful payment.
 */
export async function createOrderConfirmationAutomation({
  order,
  customer,
  scheduledFor = new Date(),
}) {
  const store = await getCurrentStore();
  const storeId = store._id;
  const currency = store.currency || 'NGN';

  if (!order?._id) {
    throw new Error('Order is required');
  }

  if (!customer?._id) {
    throw new Error('Customer is required');
  }

  if (!customer.phone) {
    return null;
  }

  /*
   * Only paid orders receive confirmation.
   */
  if (order.paymentStatus !== 'paid') {
    return null;
  }

  /*
   * Respect the admin automation configuration.
   */
  if (!isAutomationEnabled(store, 'order_confirmation')) {
    return null;
  }

  const existingFilter = {
    storeId,
    type: 'order_confirmation',
    orderId: order._id,
  };

  const existing = await Automation.findOne(existingFilter);

  if (existing) {
    return existing;
  }

  const message = [
    `Hi ${customer.name || 'there'},`,
    '',
    `Thank you for your order at ${store.name}.`,
    '',
    `Order number: ${order.orderNumber}.`,
    `Order total: ${formatMoney(order.total, currency)}.`,
    '',
    'Your payment has been confirmed successfully.',
    'We will notify you when your order is ready for delivery.',
  ].join('\n');

  return createAutomationSafely(
    {
      storeId,
      type: 'order_confirmation',
      customerId: customer._id,
      orderId: order._id,
      channel: 'whatsapp',
      status: 'pending',
      scheduledFor,
      recipient: customer.phone,
      message,
      metadata: {
        orderNumber: order.orderNumber,
        total: order.total,
        currency,
        paymentStatus: order.paymentStatus,
      },
    },
    existingFilter
  );
}

/**
 * Cancels pending/processing payment follow-ups after payment.
 */
export async function cancelPaymentFollowUps(orderId) {
  if (!orderId) {
    throw new Error('Order ID is required');
  }

  const storeId = await getDefaultStoreId();

  return Automation.updateMany(
    {
      storeId,
      orderId,
      type: 'payment_followup',
      status: {
        $in: ['pending', 'processing'],
      },
    },
    {
      $set: {
        status: 'cancelled',
        error: 'Payment completed before follow-up was sent',
      },
    }
  );
}

/**
 * Creates a shipment notification.
 */
export async function createShipmentAutomation({
  order,
  customer,
  scheduledFor = new Date(),
}) {
  const store = await getCurrentStore();
  const storeId = store._id;

  if (!order?._id) {
    throw new Error('Order is required');
  }

  if (!customer?._id) {
    throw new Error('Customer is required');
  }

  if (!customer.phone) {
    return null;
  }

  /*
   * Respect the admin automation configuration.
   */
  if (!isAutomationEnabled(store, 'shipping_update')) {
    return null;
  }

  const existingFilter = {
    storeId,
    type: 'shipping_update',
    orderId: order._id,
  };

  const existing = await Automation.findOne(existingFilter);

  if (existing) {
    return existing;
  }

  const message = [
    `Hi ${customer.name || 'there'},`,
    '',
    `Good news! Your ${store.name} order ${order.orderNumber} has been shipped.`,
    '',
    'Your order is now on its way to you.',
    '',
    'We will notify you when it has been delivered.',
  ].join('\n');

  return createAutomationSafely(
    {
      storeId,
      type: 'shipping_update',
      customerId: customer._id,
      orderId: order._id,
      channel: 'whatsapp',
      status: 'pending',
      scheduledFor,
      recipient: customer.phone,
      message,
      metadata: {
        event: 'order_shipped',
        orderNumber: order.orderNumber,
      },
    },
    existingFilter
  );
}

/**
 * Creates a delivery notification.
 */
export async function createDeliveryAutomation({
  order,
  customer,
  scheduledFor = new Date(),
}) {
  const store = await getCurrentStore();
  const storeId = store._id;

  if (!order?._id) {
    throw new Error('Order is required');
  }

  if (!customer?._id) {
    throw new Error('Customer is required');
  }

  if (!customer.phone) {
    return null;
  }

  /*
   * Respect the admin automation configuration.
   */
  if (!isAutomationEnabled(store, 'delivery_update')) {
    return null;
  }

  const existingFilter = {
    storeId,
    type: 'delivery_update',
    orderId: order._id,
  };

  const existing = await Automation.findOne(existingFilter);

  if (existing) {
    return existing;
  }

  const message = [
    `Hi ${customer.name || 'there'},`,
    '',
    `Your ${store.name} order ${order.orderNumber} has been delivered.`,
    '',
    `Thank you for shopping with ${store.name}.`,
    '',
    'We hope you enjoy your purchase.',
  ].join('\n');

  return createAutomationSafely(
    {
      storeId,
      type: 'delivery_update',
      customerId: customer._id,
      orderId: order._id,
      channel: 'whatsapp',
      status: 'pending',
      scheduledFor,
      recipient: customer.phone,
      message,
      metadata: {
        event: 'order_delivered',
        orderNumber: order.orderNumber,
      },
    },
    existingFilter
  );
}

/**
 * Creates a delayed post-purchase follow-up.
 */
export async function createPostPurchaseAutomation({
  order,
  customer,
  scheduledFor,
}) {
  const store = await getCurrentStore();
  const storeId = store._id;

  if (!order?._id) {
    throw new Error('Order is required');
  }

  if (!customer?._id) {
    throw new Error('Customer is required');
  }

  if (!customer.phone) {
    return null;
  }

  /*
   * Respect the admin automation configuration.
   */
  if (!isAutomationEnabled(store, 'post_purchase')) {
    return null;
  }

  const existingFilter = {
    storeId,
    type: 'post_purchase',
    orderId: order._id,
  };

  const existing = await Automation.findOne(existingFilter);

  if (existing) {
    return existing;
  }

  const message = [
    `Hi ${customer.name || 'there'},`,
    '',
    `We hope you are enjoying your purchase from ${store.name}.`,
    '',
    `Thank you for choosing ${store.name}. We would love to serve you again.`,
  ].join('\n');

  return createAutomationSafely(
    {
      storeId,
      type: 'post_purchase',
      customerId: customer._id,
      orderId: order._id,
      channel: 'whatsapp',
      status: 'pending',
      scheduledFor,
      recipient: customer.phone,
      message,
      metadata: {
        orderNumber: order.orderNumber,
      },
    },
    existingFilter
  );
}