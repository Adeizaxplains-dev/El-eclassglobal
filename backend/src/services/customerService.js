import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/AppError.js';
import { getDefaultStoreId } from './storeContext.js';

/**
 * Finds an existing customer by phone (the natural key for this business —
 * most contact happens over WhatsApp) or creates a new lead. Used by
 * checkout so guest orders still build a real CRM record.
 */
export async function findOrCreateCustomer({ name, phone, email, address, source, campaign }) {
  const storeId = await getDefaultStoreId();
  let customer = await Customer.findOne({ storeId, phone });

  if (!customer) {
    customer = await Customer.create({
      storeId,
      name,
      phone,
      email: email || '',
      address: address || {},
      acquisitionSource: source || 'direct',
      acquisitionCampaign: campaign || '',
      customerStatus: 'lead',
      lastInteractionAt: new Date(),
    });
  } else {
    customer.lastInteractionAt = new Date();
    // Keep the latest delivery details on file without discarding
    // acquisition history.
    if (address) customer.address = address;
    if (email) customer.email = email;
    await customer.save();
  }

  return customer;
}

/**
 * Recalculates the denormalized order stats + status ladder. Called by
 * orderService whenever an order's paymentStatus flips to 'paid' — never
 * edited directly by a controller.
 */
export async function recordPaidOrder(customerId, orderTotal) {
  const customer = await Customer.findById(customerId);
  if (!customer) return;

  customer.totalOrders += 1;
  customer.totalSpent += orderTotal;
  customer.lastOrderAt = new Date();

  if (customer.customerStatus === 'lead' || customer.customerStatus === 'prospect') {
    customer.customerStatus = 'customer';
  } else if (customer.totalOrders >= 3) {
    customer.customerStatus = 'repeat_customer';
  }
  if (customer.totalSpent >= 500000) {
    customer.customerStatus = 'vip';
  }

  await customer.save();
}

export async function listCustomers(query = {}) {
  const storeId = await getDefaultStoreId();
  const filter = { storeId };
  if (query.status) filter.customerStatus = query.status;
  if (query.source) filter.acquisitionSource = query.source;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
    ];
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);

  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getCustomerById(id) {
  const customer = await Customer.findById(id);
  if (!customer) throw AppError.notFound('Customer not found');
  return customer;
}

export async function updateCustomer(id, payload) {
  const customer = await Customer.findById(id);
  if (!customer) throw AppError.notFound('Customer not found');
  Object.assign(customer, payload);
  await customer.save();
  return customer;
}
