import { Router } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  sendSuccess(res, {
    data: {
      status: 'ok',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
    message: 'Flerläss Global API is running',
  });
});

export default router;
