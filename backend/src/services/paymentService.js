import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import {
  initializeTransaction,
  verifyTransaction,
} from '../integrations/paystack/paystackClient.js';
import {
  markOrderPaid,
  markOrderPaymentFailed,
} from './orderService.js';
import { getDefaultStoreId } from './storeContext.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function initializeOrderPayment(orderId) {
  const order = await Order.findById(orderId).populate(
    'customerId',
    'name phone email'
  );

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  if (order.paymentStatus === 'paid') {
    throw AppError.badRequest('This order has already been paid for');
  }

  const storeId = await getDefaultStoreId();

  if (order.storeId.toString() !== storeId.toString()) {
    throw AppError.forbidden('Order does not belong to this store');
  }

  const amountKobo = Math.round(order.total * 100);

  if (amountKobo <= 0) {
    throw AppError.badRequest('Order amount must be greater than zero');
  }

  const email =
    order.delivery?.email ||
    order.customerId?.email ||
    `${order.delivery?.phone || order.orderNumber}@guest.flerlassglobal.com`;

  const reference = `${order.orderNumber}-${Date.now()}`;

  const paystackData = await initializeTransaction({
    email,
    amountKobo,
    reference,
    callbackUrl: `${env.clientUrl}/order/${order._id}`,
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  });

  await Payment.create({
    storeId,
    orderId: order._id,
    provider: 'paystack',
    reference,
    amount: amountKobo,
    status: 'pending',
  });

  return {
    authorizationUrl: paystackData.authorization_url,
    reference,
  };
}

/**
 * Verifies a Paystack transaction and updates the corresponding
 * payment/order only when the transaction is valid.
 *
 * Paystack remains the source of truth for payment confirmation.
 *
 * This function is safe to call from:
 * - customer redirect verification
 * - Paystack webhook
 *
 * Successful processing is idempotent.
 */
export async function verifyOrderPayment(reference) {
  const payment = await Payment.findOne({ reference });

  if (!payment) {
    throw AppError.notFound('Payment record not found');
  }

  // Already successfully processed.
  // Prevent webhook + redirect from processing the same payment twice.
  if (payment.status === 'success') {
    return payment;
  }

  const order = await Order.findById(payment.orderId);

  if (!order) {
    throw AppError.notFound('Order associated with this payment was not found');
  }

  // Make sure the payment and order belong together.
  if (payment.orderId.toString() !== order._id.toString()) {
    throw AppError.conflict('Payment does not belong to this order');
  }

  // Make sure this payment belongs to the active store.
  const storeId = await getDefaultStoreId();

  if (payment.storeId.toString() !== storeId.toString()) {
    throw AppError.forbidden('Payment does not belong to this store');
  }

  const result = await verifyTransaction(reference);

  payment.rawResponse = result;

  if (result.status === 'success') {
    const verifiedAmount = Number(result.amount);

    const expectedAmount = Math.round(order.total * 100);

    // Paystack amount must match the order amount.
    if (verifiedAmount !== expectedAmount) {
      payment.status = 'failed';
      await payment.save();

      logger.error('Paystack amount mismatch', {
        reference,
        expectedAmount,
        verifiedAmount,
        orderId: order._id.toString(),
      });

      throw AppError.conflict(
        'Payment amount does not match the order amount'
      );
    }

    // Also make sure the amount stored when initializing
    // the payment matches the order.
    if (Number(payment.amount) !== expectedAmount) {
      payment.status = 'failed';
      await payment.save();

      logger.error('Stored payment amount mismatch', {
        reference,
        paymentAmount: payment.amount,
        expectedAmount,
        orderId: order._id.toString(),
      });

      throw AppError.conflict(
        'Stored payment amount does not match the order amount'
      );
    }

    payment.status = 'success';
    payment.verifiedAt = new Date();

    await payment.save();

    await markOrderPaid(payment.orderId);

    return payment;
  }

  if (result.status === 'failed') {
    payment.status = 'failed';

    await payment.save();

    await markOrderPaymentFailed(payment.orderId);

    logger.warn('Payment verification failed', {
      reference,
      paystackStatus: result.status,
      orderId: order._id.toString(),
    });

    return payment;
  }

  // Abandoned/pending/other Paystack states should not
  // automatically be treated as a successful payment.
  payment.status = 'pending';

  await payment.save();

  logger.info('Payment remains pending after verification', {
    reference,
    paystackStatus: result.status,
    orderId: order._id.toString(),
  });

  return {
  reference: payment.reference,
  status: payment.status,
  amount: payment.amount,
  verifiedAt: payment.verifiedAt,
  orderId: payment.orderId,
};
}

/**
 * Handles Paystack webhook events.
 *
 * The webhook signature must already have been verified
 * by paymentController.js before this function is called.
 */
export async function handlePaystackWebhookEvent(event) {
  if (event.event === 'charge.success') {
    const reference = event.data?.reference;

    if (!reference) {
      logger.warn('Paystack charge.success event has no reference');
      return;
    }

    await verifyOrderPayment(reference);
    return;
  }

  logger.info('Unhandled Paystack webhook event type', {
    type: event.event,
  });
}