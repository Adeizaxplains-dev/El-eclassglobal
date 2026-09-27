import { Order } from '../models/Order.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { CustomerEvent } from '../models/CustomerEvent.js';
import { getDefaultStoreId } from './storeContext.js';

/**
 * Every number here comes from an actual aggregation against stored
 * documents — nothing is a placeholder array. If there's no data yet,
 * these correctly return zeros, which is the honest state of a fresh store.
 */
export async function getDashboardOverview() {
  const storeId = await getDefaultStoreId();

  const [salesAgg, orderCounts, customerCount, productCount, lowStockAgg, recentOrders] = await Promise.all([
    Order.aggregate([
      { $match: { storeId, paymentStatus: 'paid' } },
      { $group: { _id: null, totalSales: { $sum: '$total' }, paidOrders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $match: { storeId } }, { $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Customer.countDocuments({ storeId }),
    Product.countDocuments({ storeId, status: 'active' }),
    // Low stock must account for BOTH simple stock and per-variant stock
    // (a product with variants ignores its own `stock` field — see
    // Product.isInStock()) — otherwise a variant product that's nearly
    // sold out never shows up here even though listProductsAdmin's
    // low-stock filter would catch it.
    Product.aggregate([
      { $match: { storeId, status: 'active' } },
      {
        $addFields: {
          hasLowVariant: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$variants', []] },
                    as: 'v',
                    cond: { $and: [{ $gt: ['$$v.stock', 0] }, { $lte: ['$$v.stock', 5] }] },
                  },
                },
              },
              0,
            ],
          },
          hasLowFlatStock: {
            $and: [
              { $eq: [{ $size: { $ifNull: ['$variants', []] } }, 0] },
              { $gt: ['$stock', 0] },
              { $lte: ['$stock', 5] },
            ],
          },
        },
      },
      { $match: { $or: [{ hasLowVariant: true }, { hasLowFlatStock: true }] } },
      { $count: 'count' },
    ]),
    Order.find({ storeId }).sort({ createdAt: -1 }).limit(5).populate('customerId', 'name phone'),
  ]);

  const totalSales = salesAgg[0]?.totalSales || 0;
  const paidOrders = salesAgg[0]?.paidOrders || 0;
  const lowStockCount = lowStockAgg[0]?.count || 0;

  const statusBreakdown = orderCounts.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  return {
    totalSales,
    paidOrders,
    totalCustomers: customerCount,
    activeProducts: productCount,
    lowStockProducts: lowStockCount,
    orderStatusBreakdown: statusBreakdown,
    recentOrders,
  };
}

export async function getSalesOverTime({ days = 30 } = {}) {
  const storeId = await getDefaultStoreId();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return Order.aggregate([
    { $match: { storeId, paymentStatus: 'paid', createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function getTopProducts({ limit = 10 } = {}) {
  const storeId = await getDefaultStoreId();

  return Order.aggregate([
    { $match: { storeId, paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);
}

export async function getAcquisitionSourceBreakdown() {
  const storeId = await getDefaultStoreId();

  return Order.aggregate([
    { $match: { storeId, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $ifNull: ['$source', 'direct'] },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
}

/**
 * Funnel counts from actual CustomerEvent documents — traffic through
 * order completion. Returns zero counts for steps with no events yet
 * rather than fabricating a shape.
 */
export async function getConversionFunnel({ days = 30 } = {}) {
  const storeId = await getDefaultStoreId();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await CustomerEvent.aggregate([
    { $match: { storeId, createdAt: { $gte: since } } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const counts = rows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const steps = [
    'product_view',
    'add_to_cart',
    'checkout_started',
    'payment_attempted',
    'payment_successful',
    'order_completed',
  ];

  return steps.map((step) => ({ step, count: counts[step] || 0 }));
}
