import { Router } from 'express';
import * as controller from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidators.js';

const router = Router();

router.get('/', controller.listCategories);
router.get('/:slug', controller.getCategory);

router.post('/', protect, authorize('admin', 'staff'), validate(createCategorySchema), controller.createCategory);
router.patch('/:id', protect, authorize('admin', 'staff'), validate(updateCategorySchema), controller.updateCategory);
router.delete('/:id', protect, authorize('admin'), controller.deleteCategory);

export default router;
