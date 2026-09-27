import { Router } from 'express';
import * as controller from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';
import { initializePaymentSchema } from '../validators/paymentValidators.js';

const router = Router();

/**
 * Initialize Paystack payment for an existing order.
 *
 * The sessionId is validated here because guest checkout relies
 * on the browser's persistent session identifier to associate
 * the payment request with the correct order.
 */
router.post(
  '/initialize',
  validate(initializePaymentSchema),
  controller.initializePayment
);

/**
 * Verify a Paystack transaction.
 *
 * IMPORTANT:
 * The frontend redirect is NOT trusted as proof of payment.
 * paymentController.verifyPayment() must verify the reference
 * directly against Paystack before marking the order as paid.
 */
router.get(
  '/:reference/verify',
  controller.verifyPayment
);

/**
 * Paystack webhook is intentionally NOT defined here.
 *
 * It must receive the raw request body so that the Paystack
 * HMAC signature can be verified correctly.
 *
 * It is mounted directly in app.js BEFORE express.json().
 */

export default router;