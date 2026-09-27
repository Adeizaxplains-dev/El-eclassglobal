import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { AppError } from '../utils/AppError.js';
/**
 * Resolve a cart/order item against the LIVE product record.
 *
 * The frontend must NEVER be trusted for:
 * - product name
 * - price
 * - image
 * - stock
 * - variant details
 *
 * Everything important is read from MongoDB so the order gets an
 * authoritative snapshot of the product at checkout time.
 */
export async function resolveLineItem({
  productId,
  variantId = null,
  quantity,
}) {
  if (!productId) {
    throw AppError.badRequest('Product is required');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw AppError.badRequest(
      'Quantity must be a positive whole number'
    );
  }

  const product = await Product.findById(productId);

  if (!product || product.status !== 'active') {
    throw AppError.badRequest(
      'This product is no longer available'
    );
  }

  const category = await Category.findOne({
  _id: product.categoryId,
  storeId: product.storeId,
  status: 'active',
}).select('name');

  /*
   * Products with variants.
   *
   * Once variants exist, product.stock must NOT be used.
   * The selected variant determines availability and pricing.
   */
  if (product.variants?.length > 0) {
    if (!variantId) {
      throw AppError.badRequest(
        'Please select a product variant'
      );
    }

    const variant = product.variants.id(variantId);

    if (!variant) {
      throw AppError.badRequest(
        'Selected product variant is no longer available'
      );
    }

    if (variant.stock < quantity) {
      throw AppError.badRequest(
        `Only ${variant.stock} left in stock for this variant`
      );
    }

    const unitPrice =
      variant.priceOverride != null
        ? variant.priceOverride
        : product.getEffectivePrice();

   return {
  productId: product._id,
  variantId: null,
  name: product.name,
  category: category?.name || '',
  image: product.images?.[0]?.url || '',
  color: '',
  size: '',
  unitPrice: product.getEffectivePrice(),
  quantity,
};
  }

  /*
   * Products without variants use product-level stock.
   */
  if (variantId) {
    throw AppError.badRequest(
      'This product does not have selectable variants'
    );
  }

  if (product.stock < quantity) {
    throw AppError.badRequest(
      `Only ${product.stock} left in stock`
    );
  }

  return {
    productId: product._id,
    variantId: null,
    name: product.name,
    image: product.images?.[0]?.url || '',
    color: '',
    size: '',
    unitPrice: product.getEffectivePrice(),
    quantity,
  };
}

/**
 * Decrements stock for every item in an order.
 *
 * IMPORTANT:
 * This function accepts an optional MongoDB session.
 *
 * When called from markOrderPaid(), the session belongs to a MongoDB
 * transaction. Therefore, if ANY item fails, ALL previous stock
 * deductions in that transaction are rolled back automatically.
 *
 * The conditional updates also prevent concurrent customers from
 * overselling the available stock.
 */
export async function decrementStockForItems(items, session = null) {
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.badRequest('Order contains no items');
  }

  for (const item of items) {
    if (!item.productId) {
      throw AppError.badRequest(
        'Order item is missing product information'
      );
    }

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw AppError.badRequest(
        `Invalid quantity for ${item.name || 'order item'}`
      );
    }

    if (item.variantId) {
      /*
       * Variant stock.
       *
       * The product must:
       * - exist
       * - still be active
       * - contain the requested variant
       * - have enough stock
       *
       * The entire update is atomic.
       */
      const result = await Product.updateOne(
        {
          _id: item.productId,
          status: 'active',
          variants: {
            $elemMatch: {
              _id: item.variantId,
              stock: { $gte: item.quantity },
            },
          },
        },
        {
          $inc: {
            'variants.$.stock': -item.quantity,
          },
        },
        session ? { session } : undefined
      );

      if (result.matchedCount === 0) {
        throw AppError.conflict(
          `Insufficient stock for ${
            item.name || 'this product variant'
          }`
        );
      }
    } else {
      /*
       * Product-level stock.
       *
       * variants: { $size: 0 } guarantees that we never accidentally
       * deduct product.stock for a product that actually uses variants.
       */
      const result = await Product.updateOne(
        {
          _id: item.productId,
          status: 'active',
          variants: { $size: 0 },
          stock: { $gte: item.quantity },
        },
        {
          $inc: {
            stock: -item.quantity,
          },
        },
        session ? { session } : undefined
      );

      if (result.matchedCount === 0) {
        throw AppError.conflict(
          `Insufficient stock for ${
            item.name || 'this product'
          }`
        );
      }
    }
  }
}

/**
 * Restores stock previously deducted from an order.
 *
 * This remains useful for future cancellation/refund flows.
 *
 * When a cancellation/refund is itself transactional, pass the same
 * MongoDB session so the restock participates in that transaction.
 */
export async function restockItems(items, session = null) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  for (const item of items) {
    if (
      !item.productId ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      continue;
    }

    if (item.variantId) {
      await Product.updateOne(
        {
          _id: item.productId,
          'variants._id': item.variantId,
        },
        {
          $inc: {
            'variants.$.stock': item.quantity,
          },
        },
        session ? { session } : undefined
      );
    } else {
      await Product.updateOne(
        {
          _id: item.productId,
          variants: { $size: 0 },
        },
        {
          $inc: {
            stock: item.quantity,
          },
        },
        session ? { session } : undefined
      );
    }
  }
}