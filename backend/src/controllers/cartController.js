import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as cartService from '../services/cartService.js';
import { recordEvent } from '../services/eventService.js';
import { AppError } from '../utils/AppError.js';

function requireSessionId(req) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  if (!sessionId) throw AppError.badRequest('Missing session identifier');
  return sessionId;
}

export const getCart = catchAsync(async (req, res) => {
  const sessionId = requireSessionId(req);
  const cart = await cartService.getCart(sessionId);
  sendSuccess(res, { data: cart });
});

export const addItem = catchAsync(async (req, res) => {
  const sessionId = requireSessionId(req);
  const cart = await cartService.addItemToCart(sessionId, req.body, {
    source: req.query.source,
    campaign: req.query.campaign,
  });

  await recordEvent({
    type: 'add_to_cart',
    sessionId,
    metadata: { productId: req.body.productId },
    source: req.query.source,
    campaign: req.query.campaign,
  });

  sendSuccess(res, { data: cart, message: 'Item added to cart' });
});

export const updateItem = catchAsync(async (req, res) => {
  const sessionId = requireSessionId(req);
  const cart = await cartService.updateCartItem(sessionId, req.params.itemId, req.body.quantity);
  sendSuccess(res, { data: cart, message: 'Cart updated' });
});

export const removeItem = catchAsync(async (req, res) => {
  const sessionId = requireSessionId(req);
  const cart = await cartService.removeCartItem(sessionId, req.params.itemId);
  sendSuccess(res, { data: cart, message: 'Item removed' });
});
