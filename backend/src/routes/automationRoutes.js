import express from 'express';

import {
  getOverview,
  list,
  getById,
  cancel,
  retry,
} from '../controllers/automationController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin', 'staff'));

router.get('/overview', getOverview);
router.get('/', list);
router.get('/:id', getById);
router.patch('/:id/cancel', cancel);
router.patch('/:id/retry', retry);

export default router;