import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function assertConfigured() {
  if (!env.paystack.secretKey) {
    throw AppError.badRequest('Payments are not configured on this server yet');
  }
}

/**
 * Thin wrapper around Paystack's REST API. Secret key never leaves the
 * backend — this module is the only place it's read.
 */
export async function initializeTransaction({ email, amountKobo, reference, callbackUrl, metadata }) {
  assertConfigured();

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    logger.error('Paystack initialize failed', { message: data.message });
    throw AppError.badRequest(data.message || 'Failed to initialize payment');
  }

  return data.data; // { authorization_url, access_code, reference }
}

/**
 * The ONLY source of truth for whether a payment succeeded. The frontend's
 * redirect back to the site is never treated as proof — this call to
 * Paystack's own API is what marks an order paid.
 */
export async function verifyTransaction(reference) {
  assertConfigured();

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${env.paystack.secretKey}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    logger.error('Paystack verify failed', {
      message: data.message,
      reference,
    });

    throw AppError.badRequest(
      data.message || 'Failed to verify payment'
    );
  }

  return data.data;
}