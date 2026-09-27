import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as customerService from '../services/customerService.js';
import { Order } from '../models/Order.js';

export const listCustomers = catchAsync(async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  sendSuccess(res, { data: result });
});

export const getCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);

  const orders = await Order.find({
    customerId: customer._id,
  })
    .sort({ createdAt: -1 })
    .limit(20);

  sendSuccess(res, {
    data: { customer, orders },
  });
});

export const updateCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  sendSuccess(res, { data: customer, message: 'Customer updated' });
});
