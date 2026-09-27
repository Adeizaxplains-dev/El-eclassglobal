import { processAbandonedCarts } from './abandonedCartJob.js';
import { processPendingAutomations } from './automationProcessor.js';
import { logger } from '../utils/logger.js';

const INTERVAL_MINUTES = 5;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

let schedulerInterval = null;
let isRunning = false;
let stopRequested = false;

/**
 * Runs all automation jobs periodically.
 *
 * The scheduler only coordinates jobs.
 * Business logic remains inside the individual job modules.
 */
export async function runAutomationJobs() {
  if (isRunning) {
    logger.warn(
      'Automation scheduler skipped — previous run still active'
    );

    return {
      skipped: true,
    };
  }

  if (stopRequested) {
    return {
      stopped: true,
    };
  }

  isRunning = true;

  try {
    /*
     * First discover newly abandoned carts.
     */
    const abandonedCartResult =
      await processAbandonedCarts();

    /*
     * Then process automation records that are ready
     * to be delivered.
     */
    const automationResult =
      await processPendingAutomations();

    return {
      skipped: false,
      abandonedCartResult,
      automationResult,
    };
  } catch (error) {
    logger.error('Automation scheduler failed', {
      message: error.message,
      stack: error.stack,
    });

    /*
     * The scheduler itself should not crash because one
     * automation job failed.
     */
    return {
      skipped: false,
      error: error.message,
    };
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the automation scheduler.
 *
 * Runs once immediately after startup,
 * then every five minutes.
 */
export function startAutomationScheduler() {
  if (schedulerInterval) {
    logger.warn('Automation scheduler is already running');
    return false;
  }

  stopRequested = false;

  logger.info(
    `Automation scheduler started — interval: ${INTERVAL_MINUTES} minutes`
  );

  /*
   * Run immediately, but do not block server startup.
   *
   * runAutomationJobs() catches its own errors, so this
   * background invocation will not create an unhandled
   * promise rejection.
   */
  void runAutomationJobs();

  schedulerInterval = setInterval(
    () => {
      void runAutomationJobs();
    },
    INTERVAL_MS
  );

  /*
   * Do not keep the Node.js process alive solely because
   * of the scheduler timer.
   */
  schedulerInterval.unref?.();

  return true;
}

/**
 * Stops the scheduler gracefully.
 *
 * This prevents new scheduler runs from starting.
 * An already-running job is allowed to finish naturally.
 */
export function stopAutomationScheduler() {
  stopRequested = true;

  if (!schedulerInterval) {
    return false;
  }

  clearInterval(schedulerInterval);
  schedulerInterval = null;

  logger.info('Automation scheduler stopped');

  return true;
}

/**
 * Returns scheduler state.
 *
 * Useful for health checks, diagnostics and tests.
 */
export function getAutomationSchedulerStatus() {
  return {
    running: isRunning,
    scheduled: Boolean(schedulerInterval),
    stopRequested,
    intervalMinutes: INTERVAL_MINUTES,
  };
}