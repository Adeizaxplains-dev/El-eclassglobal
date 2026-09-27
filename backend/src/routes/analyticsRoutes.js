import { Router } from 'express';
import * as controller from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/overview', protect, authorize('admin'), controller.getOverview);
router.get('/sales', protect, authorize('admin'), controller.getSalesOverTime);
router.get('/top-products', protect, authorize('admin'), controller.getTopProducts);
router.get(
  '/acquisition-sources',
  protect,
  authorize('admin'),
  controller.getAcquisitionSources
);
router.get('/funnel', protect, authorize('admin'), controller.getConversionFunnel);

export default router;