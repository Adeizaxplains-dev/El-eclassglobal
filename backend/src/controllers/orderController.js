import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as orderService from '../services/orderService.js';
import { recordEvent } from '../services/eventService.js';

export const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrderFromCart(req.body.sessionId, req.body);

  await recordEvent({
    type: 'checkout_started',
    sessionId: req.body.sessionId,
    customerId: order.customerId,
    metadata: { orderId: order._id.toString() },
    source: req.body.source,
    campaign: req.body.campaign,
  });

  sendSuccess(res, { data: order, statusCode: 201, message: 'Order created' });
});

export const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.query.sessionId
  );

  sendSuccess(res, { data: order });
});

// --- Admin ---

export const listOrdersAdmin = catchAsync(async (req, res) => {
  const result = await orderService.listOrders(req.query);
  sendSuccess(res, { data: result });
});

export const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body, req.user.id);
  sendSuccess(res, { data: order, message: 'Order updated' });
});
