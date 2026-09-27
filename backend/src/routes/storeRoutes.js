import { Router } from 'express';
import {
  getStoreInfo,
  getStoreSettings,
  updateStoreSettings,
} from '../controllers/storeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Public storefront settings
router.get('/', getStoreInfo);

// Admin / staff settings
router.get(
  '/admin',
  protect,
  authorize('admin', 'staff'),
  getStoreSettings
);

router.patch(
  '/admin',
  protect,
  authorize('admin', 'staff'),
  updateStoreSettings
);

export default router;