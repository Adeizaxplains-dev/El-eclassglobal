import express from 'express';

import cors from 'cors';

import helmet from 'helmet';

import compression from 'compression';

import morgan from 'morgan';

import rateLimit from 'express-rate-limit';

import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';

import routes from './routes/index.js';

import { notFound } from './middleware/notFound.js';

import { errorHandler } from './middleware/errorHandler.js';

import { paystackWebhook } from './controllers/paymentController.js';

import conversationRoutes from './routes/conversationRoutes.js';
import teamRoutes from './routes/teamRoutes.js';


export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — only the configured frontend origin, not "*"
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  // Paystack webhook MUST be mounted with the raw body parser,
  // and BEFORE the global express.json() below.
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    paystackWebhook
  );

  // Body parsing for everything else
  app.use(express.json({ limit: '2mb' }));

  app.use(express.urlencoded({ extended: true }));

  // Prevent MongoDB operator injection via query/body
  app.use(mongoSanitize());

  // Response compression
  app.use(compression());

  // Request logging — dev-friendly, quiet in production
  app.use(
    morgan(env.isProduction ? 'combined' : 'dev')
  );

  // Basic rate limiting on the whole API
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Existing application routes
  app.use('/api', routes);

  // Conversation / customer messaging routes
  app.use(
    '/api/conversations',
    conversationRoutes
  );

    // Team / staff management routes
  app.use(
    '/api/team',
    teamRoutes
  );

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
}