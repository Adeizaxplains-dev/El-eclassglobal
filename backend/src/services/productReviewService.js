import { ProductReview } from '../models/ProductReview.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { getDefaultStoreId } from './storeContext.js';

/**
 * Get approved reviews for a product.
 */
export async function listProductReviews(productId) {
  const storeId = await getDefaultStoreId();

  const product = await Product.findOne({
    _id: productId,
    storeId,
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return ProductReview.find({
    storeId,
    productId,
    status: 'approved',
  })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Create a customer review.
 * Reviews start as pending and require admin approval.
 */
export async function createProductReview(payload) {
  const storeId = await getDefaultStoreId();

  const product = await Product.findOne({
    _id: payload.productId,
    storeId,
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return ProductReview.create({
    storeId,
    productId: payload.productId,
    customerId: payload.customerId || null,
    customerName: payload.customerName,
    rating: payload.rating,
    title: payload.title || '',
    comment: payload.comment,
    verifiedPurchase: payload.verifiedPurchase || false,
    status: 'pending',
  });
}

/**
 * Get review summary for a product.
 */
export async function getProductReviewSummary(productId) {
  const storeId = await getDefaultStoreId();

  const reviews = await ProductReview.find({
    storeId,
    productId,
    status: 'approved',
  })
    .select('rating')
    .lean();

  const count = reviews.length;

  if (count === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };
  }

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  let total = 0;

  for (const review of reviews) {
    total += review.rating;
    distribution[review.rating] += 1;
  }

  return {
    averageRating: Number((total / count).toFixed(1)),
    reviewCount: count,
    distribution,
  };
}

/**
 * ADMIN
 * Get all pending reviews for the current store.
 */
export async function listPendingReviews() {
  const storeId = await getDefaultStoreId();

  return ProductReview.find({
    storeId,
    status: 'pending',
  })
    .populate('productId', 'name slug images')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * ADMIN
 * Change the moderation status of a review.
 */
export async function updateReviewStatus(reviewId, status) {
  const storeId = await getDefaultStoreId();

  if (!['approved', 'rejected'].includes(status)) {
    throw AppError.badRequest('Invalid review status');
  }

  const review = await ProductReview.findOne({
    _id: reviewId,
    storeId,
  });

  if (!review) {
    throw AppError.notFound('Review not found');
  }

  review.status = status;

  await review.save();

  return review;
}