import { Router } from 'express';
import * as controller from '../controllers/productController.js';
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

router.post(
  '/',
  protect,
  authorize('admin', 'staff'),
  validate(createProductSchema),
  controller.createProduct
);

router.patch(
  '/:id',
  protect,
  authorize('admin', 'staff'),
  validate(updateProductSchema),
  controller.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  controller.archiveProduct
);

// ─────────────────────────────────────────────
// Public product detail
// Must remain last so :slug doesn't catch admin routes
// ─────────────────────────────────────────────

router.get('/:slug', controller.getProduct);

export default router;