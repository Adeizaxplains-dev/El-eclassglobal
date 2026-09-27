import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { trackEventSchema } from '../validators/eventValidators.js';
import * as controller from '../controllers/eventController.js';

const router = Router();

router.post('/', validate(trackEventSchema), controller.trackEvent);

export default router;