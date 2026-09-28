import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as productReviewService from '../services/productReviewService.js';

/**
 * PUBLIC
 * Get approved reviews for a product.
 */
export const listProductReviews = catchAsync(async (req, res) => {
  const reviews = await productReviewService.listProductReviews(
    req.params.productId
  );

  sendSuccess(res, {
    data: reviews,
  });
});

/**
 * PUBLIC
 * Get rating summary for a product.
 */
export const getProductReviewSummary = catchAsync(async (req, res) => {
  const summary = await productReviewService.getProductReviewSummary(
    req.params.productId
  );

  sendSuccess(res, {
    data: summary,
  });
});

/**
 * PUBLIC
 * Submit a product review.
 *
 * Reviews are created as "pending" and must be
 * approved by an admin/staff member before appearing
 * on the storefront.
 */
export const createProductReview = catchAsync(async (req, res) => {
  const review = await productReviewService.createProductReview({
    ...req.body,
    productId: req.params.productId,
  });

  sendSuccess(res, {
    data: review,
    statusCode: 201,
    message: 'Review submitted for approval',
  });
});

/**
 * ADMIN
 * Get reviews awaiting moderation.
 */
export const listPendingReviews = catchAsync(async (req, res) => {
  const reviews = await productReviewService.listPendingReviews();

  sendSuccess(res, {
    data: reviews,
  });
});

/**
 * ADMIN
 * Approve a pending review.
 */
export const approveReview = catchAsync(async (req, res) => {
  const review = await productReviewService.updateReviewStatus(
    req.params.reviewId,
    'approved'
  );

  sendSuccess(res, {
    data: review,
    message: 'Review approved',
  });
});

/**
 * ADMIN
 * Reject a pending review.
 */
export const rejectReview = catchAsync(async (req, res) => {
  const review = await productReviewService.updateReviewStatus(
    req.params.reviewId,
    'rejected'
  );

  sendSuccess(res, {
    data: review,
    message: 'Review rejected',
  });
});