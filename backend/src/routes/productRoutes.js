import { Router } from 'express';

import * as controller from '../controllers/productController.js';
import * as reviewController from '../controllers/productReviewController.js';
import * as uploadController from '../controllers/uploadController.js';

import { protect, authorize } from '../middleware/auth.js';

import { validate } from '../middleware/validate.js';

import {
  createProductSchema,
  updateProductSchema,
} from '../validators/productValidators.js';

const router = Router();

// ─────────────────────────────────────────────
// Public storefront
// ─────────────────────────────────────────────

router.get('/', controller.listProducts);

// ─────────────────────────────────────────────
// Product reviews
// ─────────────────────────────────────────────

router.get(
  '/:productId/reviews',
  reviewController.listProductReviews
);

router.get(
  '/:productId/reviews/summary',
  reviewController.getProductReviewSummary
);

router.post(
  '/:productId/reviews',
  reviewController.createProductReview
);

// ─────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────

router.get(
  '/admin/list',
  protect,
  authorize('admin', 'staff'),
  controller.listProductsAdmin
);

router.get(
  '/admin/low-stock',
  protect,
  authorize('admin', 'staff'),
  controller.lowStockProducts
);

// ─────────────────────────────────────────────
// Admin review moderation
// ─────────────────────────────────────────────

router.get(
  '/admin/reviews',
  protect,
  authorize('admin', 'staff'),
  reviewController.listPendingReviews
);

router.patch(
  '/admin/reviews/:reviewId/approve',
  protect,
  authorize('admin', 'staff'),
  reviewController.approveReview
);

router.patch(
  '/admin/reviews/:reviewId/reject',
  protect,
  authorize('admin', 'staff'),
  reviewController.rejectReview
);

router.get(
  '/admin/:id',
  protect,
  authorize('admin', 'staff'),
  controller.getProductAdmin
);

router.post(
  '/admin/upload-image',
  protect,
  authorize('admin', 'staff'),
  uploadController.uploadImage
);

// ─────────────────────────────────────────────
// Public product detail
// Must remain last so :slug doesn't catch admin routes
// ─────────────────────────────────────────────

router.get('/:slug', controller.getProduct);

export default router;