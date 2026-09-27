import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as paymentService from '../services/paymentService.js';
import { isValidPaystackSignature } from '../integrations/paystack/paystackWebhook.js';
import { logger } from '../utils/logger.js';
import { recordEvent } from '../services/eventService.js';

export const initializePayment = catchAsync(async (req, res) => {
  const result = await paymentService.initializeOrderPayment(
    req.body.orderId
  );

  if (req.body.sessionId) {
    await recordEvent({
      type: 'payment_attempted',
      sessionId: req.body.sessionId,
      metadata: {
        orderId: req.body.orderId,
      },
    });
  }

  sendSuccess(res, {
    data: result,
    message: 'Payment initialized',
  });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.verifyOrderPayment(
    req.params.reference
  );

  sendSuccess(res, {
    data: payment,
    message:
      payment.status === 'success'
        ? 'Payment verified'
        : 'Payment not successful',
  });
});

/**
 * Paystack webhook.
 *
 * IMPORTANT:
 * req.body must be the RAW Buffer here.
 *
 * The Paystack signature is calculated from the exact raw
 * request body, so this route must use express.raw()
 * before the global express.json() parser.
 */
export const paystackWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  /*
   * SECURITY:
   *
   * Never process a Paystack webhook unless the signature
   * is valid.
   */
  if (!isValidPaystackSignature(req.body, signature)) {
    logger.warn(
      'Rejected Paystack webhook with invalid signature'
    );

    return res.status(401).json({
      success: false,
      message: 'Invalid webhook signature',
    });
  }

  let event;

  /*
   * The body is a raw Buffer, therefore parse it manually.
   */
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (error) {
    logger.warn(
      'Rejected Paystack webhook with invalid JSON'
    );

    return res.status(400).json({
      success: false,
      message: 'Invalid webhook payload',
    });
  }

  /*
   * Only a signature-valid and valid-JSON webhook reaches
   * the payment service.
   */
  await paymentService.handlePaystackWebhookEvent(event);

  /*
   * Paystack expects a successful acknowledgement.
   */
  return res.status(200).json({
    received: true,
  });
});