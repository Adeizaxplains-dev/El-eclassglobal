import { Cart } from '../models/Cart.js';
import { AppError } from '../utils/AppError.js';
import { resolveLineItem } from './inventoryService.js';
import { getDefaultStoreId } from './storeContext.js';

async function getOrCreateActiveCart(sessionId, attribution = {}) {
  const storeId = await getDefaultStoreId();
  let cart = await Cart.findOne({ storeId, sessionId, status: 'active' });
  if (!cart) {
    cart = await Cart.create({
      storeId,
      sessionId,
      source: attribution.source || '',
      campaign: attribution.campaign || '',
    });
  }
  return cart;
}

export async function getCart(sessionId) {
  const storeId = await getDefaultStoreId();
  const cart = await Cart.findOne({ storeId, sessionId, status: 'active' });
  return cart || { items: [], getSubtotal: () => 0 };
}

export async function addItemToCart(sessionId, { productId, variantId, quantity }, attribution) {
  const cart = await getOrCreateActiveCart(sessionId, attribution);

  // Re-validate against live inventory every time — a product loaded
  // earlier in the session may be out of stock now.
  const resolved = await resolveLineItem({ productId, variantId, quantity });

  const existing = cart.items.find(
    (i) => String(i.productId) === String(resolved.productId) && String(i.variantId) === String(resolved.variantId)
  );

  if (existing) {
    existing.quantity += quantity;
    existing.unitPrice = resolved.unitPrice; // refresh snapshot to current price
  } else {
    cart.items.push(resolved);
  }

  cart.lastActivityAt = new Date();
  await cart.save();
  return cart;
}

export async function updateCartItem(sessionId, itemId, quantity) {
  const storeId = await getDefaultStoreId();
  const cart = await Cart.findOne({ storeId, sessionId, status: 'active' });
  if (!cart) throw AppError.notFound('Cart not found');

  const item = cart.items.id(itemId);
  if (!item) throw AppError.notFound('Cart item not found');

  // Re-validate stock for the new quantity before accepting it.
  await resolveLineItem({ productId: item.productId, variantId: item.variantId, quantity });

  item.quantity = quantity;
  cart.lastActivityAt = new Date();
  await cart.save();
  return cart;
}

export async function removeCartItem(sessionId, itemId) {
  const storeId = await getDefaultStoreId();
  const cart = await Cart.findOne({ storeId, sessionId, status: 'active' });
  if (!cart) throw AppError.notFound('Cart not found');

  cart.items.id(itemId)?.deleteOne();
  cart.lastActivityAt = new Date();
  await cart.save();
  return cart;
}
