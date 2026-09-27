import express from 'express';

import {
  create,
  list,
  getById,
  update,
  previewAudience,
  previewAudienceFilter,
  launch,
  cancel,
} from '../controllers/campaignController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin', 'staff'));


/*
 * ---------------------------------------------------------
 * CAMPAIGN MANAGEMENT
 * ---------------------------------------------------------
 */

router.post('/', create);

router.get('/', list);

router.post(
  '/audience/preview',
  previewAudienceFilter
);

/*
 * ---------------------------------------------------------
 * AUDIENCE
 * ---------------------------------------------------------
 */

router.get(
  '/:id/audience/preview',
  previewAudience
);

/*
 * ---------------------------------------------------------
 * CAMPAIGN EXECUTION
 * ---------------------------------------------------------
 */

router.post(
  '/:id/launch',
  launch
);

router.post(
  '/:id/cancel',
  cancel
);

/*
 * ---------------------------------------------------------
 * SINGLE CAMPAIGN
 * ---------------------------------------------------------
 */

router.get('/:id', getById);

router.patch('/:id', update);

export default router;