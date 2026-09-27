import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { toSlug, randomSuffix } from '../utils/slugify.js';
import { getDefaultStoreId } from './storeContext.js';
import { Category } from '../models/Category.js';

async function uniqueSlug(storeId, name) {
  let slug = toSlug(name);
  let attempt = slug;

  while (await Product.exists({ storeId, slug: attempt })) {
    attempt = `${slug}-${randomSuffix(4)}`;
  }

  return attempt;
}

/**
 * Builds a Mongo filter from storefront query params.
 *
 * Public storefront category filters normally use category slugs
 * such as "smartphones", "laptops", "audio", or "power".
 *
 * For backwards compatibility, a valid MongoDB ObjectId is also
 * accepted as a category value.
 */
async function buildFilter(storeId, query) {
  const filter = {
    storeId,
    status: 'active',
  };

  // ------------------------------------------------------------
  // CATEGORY FILTER
  // ------------------------------------------------------------

  if (query.category) {
    const categoryValue = String(query.category).trim();

    let category = null;

    // If an actual MongoDB ObjectId was supplied, look it up by _id.
    if (/^[0-9a-fA-F]{24}$/.test(categoryValue)) {
      category = await Category.findOne({
        _id: categoryValue,
        storeId,
        status: 'active',
      });
    } else {
      // Storefront normally sends the category slug,
      // e.g. /api/products?category=shoes
      category = await Category.findOne({
        slug: categoryValue,
        storeId,
        status: 'active',
      });
    }

    if (!category) {
      throw AppError.notFound('Category not found');
    }

    // Products store the category ObjectId, not the slug.
    filter.categoryId = category._id;
  }

  // ------------------------------------------------------------
  // PRODUCT FLAGS
  // ------------------------------------------------------------

  if (query.featured === 'true') {
    filter.isFeatured = true;
  }

  if (query.newArrival === 'true') {
    filter.isNewArrival = true;
  }

  if (query.onSale === 'true') {
    filter.salePrice = { $ne: null };
  }

  // ------------------------------------------------------------
  // PRICE FILTER
  // ------------------------------------------------------------

  if (query.minPrice || query.maxPrice) {
    filter.basePrice = {};

    if (query.minPrice) {
      filter.basePrice.$gte = Number(query.minPrice);
    }

    if (query.maxPrice) {
      filter.basePrice.$lte = Number(query.maxPrice);
    }
  }

  // ------------------------------------------------------------
  // SEARCH
  // ------------------------------------------------------------

  if (query.search) {
    filter.$text = {
      $search: query.search,
    };
  }

  return filter;
}

function buildSort(sort) {
  switch (sort) {
    case 'price-low':
      return { basePrice: 1 };

    case 'price-high':
      return { basePrice: -1 };

    case 'newest':
      return { createdAt: -1 };

    default:
      return { createdAt: -1 };
  }
}

// ============================================================
// PUBLIC STOREFRONT
// ============================================================

export async function listProducts(query = {}) {
  const storeId = await getDefaultStoreId();

  const filter = await buildFilter(storeId, query);
  const sort = buildSort(query.sort);

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name slug'),

    Product.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getProductBySlug(slug) {
  const storeId = await getDefaultStoreId();

  const product = await Product.findOne({
    storeId,
    slug,
    status: 'active',
  }).populate('categoryId', 'name slug');

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return product;
}

export async function getRelatedProducts(product, limit = 4) {
  return Product.find({
    storeId: product.storeId,
    categoryId: product.categoryId,
    _id: { $ne: product._id },
    status: 'active',
  }).limit(limit);
}

// ============================================================
// ADMIN OPERATIONS
// ============================================================

export async function createProduct(payload) {
  const storeId = await getDefaultStoreId();

  const slug = await uniqueSlug(storeId, payload.name);

  return Product.create({
    ...payload,
    storeId,
    slug,
  });
}

export async function updateProduct(id, payload) {
  const product = await Product.findById(id);

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  if (payload.name && payload.name !== product.name) {
    payload.slug = await uniqueSlug(product.storeId, payload.name);
  }

  Object.assign(product, payload);

  await product.save();

  return product;
}

export async function archiveProduct(id) {
  const product = await Product.findById(id);

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  product.status = 'archived';

  await product.save();

  return product;
}

export async function getProductForAdmin(id) {
  const product = await Product.findById(id).populate(
    'categoryId',
    'name slug'
  );

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return product;
}

export async function listProductsForAdmin(query = {}) {
  const storeId = await getDefaultStoreId();

  const filter = {
    storeId,
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.categoryId = query.category;
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name slug'),

    Product.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function listLowStockProducts(threshold = 5) {
  const storeId = await getDefaultStoreId();

  const products = await Product.find({
    storeId,
    status: 'active',
  });

  return products.filter((p) => {
    if (p.variants && p.variants.length > 0) {
      return p.variants.some(
        (v) => v.stock > 0 && v.stock <= threshold
      );
    }

    return p.stock > 0 && p.stock <= threshold;
  });
}