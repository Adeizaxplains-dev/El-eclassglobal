import { Router } from 'express';
import {
  login,
  me,
  changePassword,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  changePasswordSchema,
} from '../validators/authValidators.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), login);

router.get('/me', protect, me);

router.patch(
  '/change-password',
  protect,
  validate(changePasswordSchema),
  changePassword
);

export default router;