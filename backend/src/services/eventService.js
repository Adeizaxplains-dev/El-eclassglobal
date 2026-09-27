import { CustomerEvent } from '../models/CustomerEvent.js';
import { getDefaultStoreId } from './storeContext.js';

/**
 * Records one conversion-funnel event. Called from controllers at each
 * funnel step (product view, add to cart, checkout started, payment
 * attempted/successful, order completed) so analyticsService can compute
 * the funnel from real stored events rather than estimates.
 */
export async function recordEvent({ type, sessionId, customerId = null, metadata = {}, source = '', campaign = '' }) {
  const storeId = await getDefaultStoreId();
  return CustomerEvent.create({ storeId, type, sessionId, customerId, metadata, source, campaign });
}
