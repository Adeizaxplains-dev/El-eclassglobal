import crypto from 'crypto';
import { env } from '../../config/env.js';

/**
 * Verifies the X-Paystack-Signature header against the RAW request body.
 * Must be called with the unparsed buffer — see app.js note about mounting
 * this route with express.raw() before the global json() parser.
 */
export function isValidPaystackSignature(rawBody, signatureHeader) {
  if (!env.paystack.secretKey || !signatureHeader) {
    return false;
  }

  const expectedHash = crypto
    .createHmac('sha512', env.paystack.secretKey)
    .update(rawBody)
    .digest('hex');

  const providedHash = String(signatureHeader).trim();

  if (expectedHash.length !== providedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'utf8'),
    Buffer.from(providedHash, 'utf8')
  );
}