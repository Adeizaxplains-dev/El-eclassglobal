import { Router } from 'express';
import * as controller from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateCustomerSchema } from '../validators/customerValidators.js';

const router = Router();

router.use(protect, authorize('admin', 'staff'));

router.get('/', controller.listCustomers);
router.get('/:id', controller.getCustomer);
router.patch('/:id', validate(updateCustomerSchema), controller.updateCustomer);

export default router;
