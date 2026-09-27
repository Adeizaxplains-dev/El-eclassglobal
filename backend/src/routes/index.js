import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import customerRoutes from './customerRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import eventRoutes from './eventRoutes.js';
import storeRoutes from './storeRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import automationRoutes from './automationRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/store', storeRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/customers', customerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/events', eventRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/automations', automationRoutes);
// Note: /api/payments/webhook is mounted directly in app.js (raw body
// requirement), not here — see the comment there.

export default router;
