import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';

let cachedStoreId = null;

/**
 * Single-store-for-now helper: resolves the (currently only) store
 * record so services don't hardcode a business name anywhere. When a
 * second store exists, callers switch to reading storeId from the
 * authenticated admin (already on req.user) or a public storefront
 * domain/slug lookup instead of this helper.
 */
export async function getDefaultStoreId() {
  if (cachedStoreId) return cachedStoreId;

  const store = await Store.findOne({ status: 'active' }).sort({
    createdAt: 1,
  });

  if (!store) {
    throw AppError.badRequest(
      'No active store configured. Run the seed script first.'
    );
  }

  cachedStoreId = store._id;
  return cachedStoreId;
}
