import { Router } from 'express';
import * as controller from '../controllers/cartController.js';
import { validate } from '../middleware/validate.js';
import {
  addCartItemSchema,
  updateCartItemSchema,
} from '../validators/cartValidators.js';

const router = Router();

router.get('/', controller.getCart);

router.post(
  '/items',
  validate(addCartItemSchema),
  controller.addItem
);

router.patch(
  '/items/:itemId',
  validate(updateCartItemSchema),
  controller.updateItem
);

router.delete(
  '/items/:itemId',
  controller.removeItem
);

export default router;