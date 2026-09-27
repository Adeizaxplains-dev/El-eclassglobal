import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';
import { registerAutomationHandlers } from './events/automationHandlers.js';
import { startAutomationScheduler } from './jobs/automationScheduler.js';

async function start() {
  try {
    await connectDB();
    registerAutomationHandlers();
	startAutomationScheduler();

	const app = createApp();

    const server = app.listen(env.port, () => {
      logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`);
    });

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled promise rejection — shutting down', { message: err.message });
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received — closing server gracefully');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  }
}

start();
