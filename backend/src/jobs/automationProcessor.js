import { Automation } from '../models/Automation.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { sendFollowUp } from '../integrations/whatsapp/whatsappService.js';
import { logger } from '../utils/logger.js';
import { Campaign } from '../models/Campaign.js';

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;

/*
 * If an automation remains in "processing" for this long,
 * assume the worker that claimed it crashed or stopped.
 *
 * This prevents automations from remaining permanently stuck.
 */
const PROCESSING_TIMEOUT_MINUTES = 15;

/**
 * Processes pending WhatsApp automations whose scheduled time
 * has arrived.
 *
 * Supported automation types:
 *
 * 1. abandoned_cart
 * 2. payment_followup
 * 3. order_confirmation
 * 4. shipping_update
 * 5. delivery_update
 * 6. post_purchase
 *
 * Processing:
 *
 * Automation(status: pending)
 *        ↓
 * claim
 *        ↓
 * validate lifecycle state
 *        ↓
 * WhatsApp service
 *        ↓
 * sent / failed / cancelled
 *
 * Important:
 *
 * This processor does NOT know how WhatsApp works.
 * It only calls sendFollowUp().
 *
 * Therefore the WhatsApp provider can later be replaced
 * with Meta WhatsApp Cloud API without changing this worker.
 */

/**
 * Recover automations that became stuck in "processing".
 *
 * Example:
 *
 * Worker claims automation
 *        ↓
 * server crashes
 *        ↓
 * automation remains processing
 *
 * This function returns old processing records to pending
 * so they can be attempted again.
 */
async function recoverStuckAutomations() {
  const cutoff = new Date(
    Date.now() -
      PROCESSING_TIMEOUT_MINUTES * 60 * 1000
  );

  const result = await Automation.updateMany(
    {
      channel: 'whatsapp',
      status: 'processing',
      updatedAt: { $lte: cutoff },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    {
      $set: {
        status: 'pending',
        scheduledFor: new Date(),
        error:
          'Automation recovered after processing timeout',
      },
    }
  );

  if (result.modifiedCount > 0) {
    logger.warn(
      'Automation processor recovered stuck automations',
      {
        recovered: result.modifiedCount,
      }
    );
  }

  return result.modifiedCount;
}

/**
 * Marks an automation as cancelled.
 */
async function cancelAutomation(
  automationId,
  error,
  logMessage,
  metadata = {}
) {
  const automation =
    await Automation.findByIdAndUpdate(
      automationId,
      {
        $set: {
          status: 'cancelled',
          error,
        },
      },
      { new: true }
    );

  if (automation) {
    await updateCampaignStats(
      automation,
      'cancelled'
    );
  }

  logger.info(logMessage, {
    automationId: automationId.toString(),
    ...metadata,
  });
}

async function updateCampaignStats(
  automation,
  stat
) {
  if (
    automation.type !== 'campaign' ||
    !automation.campaignId
  ) {
    return;
  }

  const update = {
    $inc: {
      [`stats.${stat}`]: 1,
    },
  };

  if (stat === 'sent' || stat === 'failed' || stat === 'cancelled') {
    update.$inc['stats.queued'] = -1;
  }

  await Campaign.findOneAndUpdate(
    {
      _id: automation.campaignId,
      storeId: automation.storeId,
    },
    update
  );
}
/**
 * Validates an abandoned cart before sending.
 *
 * An abandoned-cart automation should only be sent if:
 *
 * - cart still exists
 * - cart is still active
 * - cart still contains items
 *
 * Once the cart has been converted into an order, the
 * abandoned-cart message must never be sent.
 */
async function validateAbandonedCart(automation) {
  if (!automation.cartId) {
    return {
      valid: false,
      cancelled: false,
      failed: true,
      reason:
        'Abandoned-cart automation has no cartId',
    };
  }

  const cart = await Cart.findById(
    automation.cartId
  ).select(
    'status items customerId lastActivityAt'
  );

  /*
   * Cart no longer exists.
   */
  if (!cart) {
    return {
      valid: false,
      cancelled: true,
      failed: false,
      reason: 'Cart no longer exists',
    };
  }

  /*
   * Cart was already converted into an order.
   */
  if (cart.status !== 'active') {
    return {
      valid: false,
      cancelled: true,
      failed: false,
      reason: `Cart is no longer active (${cart.status})`,
    };
  }

  /*
   * Empty cart should never receive an abandoned-cart message.
   */
  if (!Array.isArray(cart.items) || cart.items.length === 0) {
    return {
      valid: false,
      cancelled: true,
      failed: false,
      reason: 'Cart is empty',
    };
  }

  return {
    valid: true,
    cancelled: false,
    failed: false,
    cart,
  };
}

/**
 * Validates an order-based automation against the current
 * order lifecycle state.
 */
async function validateOrderAutomation(automation) {
  if (!automation.orderId) {
    return {
      valid: false,
      cancelled: false,
      failed: true,
      reason: `${automation.type} automation has no orderId`,
    };
  }

  const order = await Order.findById(
    automation.orderId
  ).select(
    'paymentStatus orderStatus orderNumber'
  );

  /*
   * Order no longer exists.
   */
  if (!order) {
    return {
      valid: false,
      cancelled: true,
      failed: false,
      reason: 'Order no longer exists',
    };
  }

  /*
   * ---------------------------------------------------------
   * PAYMENT FOLLOW-UP
   * ---------------------------------------------------------
   */
  if (automation.type === 'payment_followup') {
    /*
     * Customer already paid.
     */
    if (order.paymentStatus === 'paid') {
      return {
        valid: false,
        cancelled: true,
        failed: false,
        reason: 'Order has already been paid',
        order,
      };
    }

    /*
     * Order was cancelled.
     */
    if (order.orderStatus === 'cancelled') {
      return {
        valid: false,
        cancelled: true,
        failed: false,
        reason: 'Order has been cancelled',
        order,
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * ORDER CONFIRMATION
   * ---------------------------------------------------------
   */
  if (
    automation.type === 'order_confirmation'
  ) {
    if (order.paymentStatus !== 'paid') {
      return {
        valid: false,
        cancelled: true,
        failed: false,
        reason:
          'Order payment is not confirmed',
        order,
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * SHIPPING UPDATE
   * ---------------------------------------------------------
   */
  if (
    automation.type === 'shipping_update'
  ) {
    if (order.orderStatus !== 'shipped') {
      return {
        valid: false,
        cancelled: true,
        failed: false,
        reason: `Order status is ${order.orderStatus}, not shipped`,
        order,
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * DELIVERY UPDATE
   * ---------------------------------------------------------
   */
  if (
    automation.type === 'delivery_update'
  ) {
    if (order.orderStatus !== 'delivered') {
      return {
        valid: false,
        cancelled: true,
        failed: false,
        reason: `Order status is ${order.orderStatus}, not delivered`,
        order,
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * POST-PURCHASE
   * ---------------------------------------------------------
   */
  if (
    automation.type === 'post_purchase'
  ) {
    if (order.orderStatus !== 'delivered') {
      return {
        valid: false,
        cancelled: true,
        failed: false,
        reason: `Order status is ${order.orderStatus}, not delivered`,
        order,
      };
    }
  }

  return {
    valid: true,
    cancelled: false,
    failed: false,
    order,
  };
}

/**
 * Processes pending WhatsApp automations.
 */
export async function processPendingAutomations() {
  const now = new Date();

  /*
   * ---------------------------------------------------------
   * RECOVER STUCK AUTOMATIONS
   * ---------------------------------------------------------
   */
  await recoverStuckAutomations();

  /*
   * ---------------------------------------------------------
   * FIND DUE AUTOMATIONS
   * ---------------------------------------------------------
   */
  const automations = await Automation.find({
    channel: 'whatsapp',
    status: 'pending',
    scheduledFor: { $lte: now },
    attempts: { $lt: MAX_ATTEMPTS },
  })
    .sort({ scheduledFor: 1 })
    .limit(BATCH_SIZE);

  if (automations.length === 0) {
    logger.info(
      'Automation processor: no pending automations'
    );

    return {
      scanned: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      cancelled: 0,
    };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let cancelled = 0;

  for (const automation of automations) {
    try {
      /*
       * -------------------------------------------------------
       * CLAIM
       * -------------------------------------------------------
       *
       * Atomic claim prevents two workers from processing
       * the same automation simultaneously.
       */
      const claimed =
        await Automation.findOneAndUpdate(
          {
            _id: automation._id,
            status: 'pending',
          },
          {
            $set: {
              status: 'processing',
              lastAttemptAt: new Date(),
            },
            $inc: {
              attempts: 1,
            },
          },
          {
            new: true,
          }
        );

      if (!claimed) {
        skipped += 1;
        continue;
      }

      /*
       * -------------------------------------------------------
       * ABANDONED CART
       * -------------------------------------------------------
       */
      if (
        claimed.type === 'abandoned_cart'
      ) {
        const validation =
          await validateAbandonedCart(
            claimed
          );

        if (!validation.valid) {
          if (validation.failed) {
            await Automation.findByIdAndUpdate(
              claimed._id,
              {
                $set: {
                  status: 'failed',
                  failedAt: new Date(),
                  error: validation.reason,
                },
              }
            );

            failed += 1;
          } else {
            await cancelAutomation(
              claimed._id,
              validation.reason,
              'Abandoned-cart automation cancelled',
              {
                type: claimed.type,
                cartId:
                  claimed.cartId?.toString(),
              }
            );

            cancelled += 1;
          }

          continue;
        }
      }

      /*
       * -------------------------------------------------------
       * ORDER-BASED AUTOMATIONS
       * -------------------------------------------------------
       */
      if (
        [
          'payment_followup',
          'order_confirmation',
          'shipping_update',
          'delivery_update',
          'post_purchase',
        ].includes(claimed.type)
      ) {
        const validation =
          await validateOrderAutomation(
            claimed
          );

        if (!validation.valid) {
          if (validation.failed) {
            await Automation.findByIdAndUpdate(
              claimed._id,
              {
                $set: {
                  status: 'failed',
                  failedAt: new Date(),
                  error: validation.reason,
                },
              }
            );

            failed += 1;
          } else {
            await cancelAutomation(
              claimed._id,
              validation.reason,
              'Order automation cancelled',
              {
                type: claimed.type,
                orderId:
                  claimed.orderId?.toString(),
              }
            );

            cancelled += 1;
          }

          continue;
        }
      }

            /*
       * -------------------------------------------------------
       * CAMPAIGN AUTOMATION
       * -------------------------------------------------------
       *
       * Campaign automations do not require a cart or order.
       * They only need a valid recipient and message.
       *
       * The campaignId is retained on the automation so that
       * campaign delivery can later update campaign statistics.
       */
      if (claimed.type === 'campaign') {
        if (!claimed.campaignId) {
          await Automation.findByIdAndUpdate(
            claimed._id,
            {
              $set: {
                status: 'failed',
                failedAt: new Date(),
                error:
                  'Campaign automation has no campaignId',
              },
            }
          );

          failed += 1;
          continue;
        }
      }
      /*
       * -------------------------------------------------------
       * COMMON VALIDATION
       * -------------------------------------------------------
       */
      if (
        !claimed.recipient ||
        !claimed.message
      ) {
        await Automation.findByIdAndUpdate(
          claimed._id,
          {
            $set: {
              status: 'failed',
              failedAt: new Date(),
              error:
                'Missing WhatsApp recipient or message',
            },
          }
        );

        failed += 1;
        continue;
      }

      /*
       * -------------------------------------------------------
       * SEND
       * -------------------------------------------------------
       *
       * The processor deliberately does not know whether
       * WhatsApp is:
       *
       * - development/mock
       * - Authkey
       * - Meta WhatsApp Cloud API
       *
       * That responsibility belongs to whatsappService.js.
       */
      const result = await sendFollowUp(
        claimed.recipient,
        claimed.message
      );

      /*
       * Protect against a malformed provider response.
       */
      if (!result || typeof result.sent !== 'boolean') {
        throw new Error(
          'Invalid WhatsApp provider response'
        );
      }

      /*
       * -------------------------------------------------------
       * SUCCESS
       * -------------------------------------------------------
       */
     if (result.sent) {
  await Automation.findByIdAndUpdate(
    claimed._id,
    {
      $set: {
        status: 'sent',
        sentAt: new Date(),
        error: '',
      },
    }
  );

  /*
   * -------------------------------------------------------
   * UPDATE CAMPAIGN STATS
   * -------------------------------------------------------
   *
   * Campaign automations need to update the parent campaign
   * when the WhatsApp message is successfully delivered.
   */
  if (
    claimed.type === 'campaign' &&
    claimed.campaignId
  ) {
    const campaignAutomations =
      await Automation.find({
        campaignId: claimed.campaignId,
        type: 'campaign',
      }).select('status');

    const sentCount =
      campaignAutomations.filter(
        (automation) =>
          automation.status === 'sent'
      ).length;

    const failedCount =
      campaignAutomations.filter(
        (automation) =>
          automation.status === 'failed'
      ).length;

    const cancelledCount =
      campaignAutomations.filter(
        (automation) =>
          automation.status === 'cancelled'
      ).length;

    const queuedCount =
      campaignAutomations.filter(
        (automation) =>
          ['pending', 'processing'].includes(
            automation.status
          )
      ).length;

    const { Campaign } =
      await import('../models/Campaign.js');

    await Campaign.findByIdAndUpdate(
      claimed.campaignId,
      {
        $set: {
          'stats.sent': sentCount,
          'stats.failed': failedCount,
          'stats.cancelled': cancelledCount,
          'stats.queued': queuedCount,
        },
      }
    );
  }

  sent += 1;

  logger.info(
    'Automation sent successfully',
    {
      automationId:
        claimed._id.toString(),
      type: claimed.type,
      recipient: claimed.recipient,
      attempts: claimed.attempts,
      campaignId:
        claimed.campaignId?.toString() || null,
    }
  );

  continue;
}
      /*
       * -------------------------------------------------------
       * WHATSAPP FAILURE / RETRY
       * -------------------------------------------------------
       */
      const reason =
        result.reason ||
        'WhatsApp send failed';

      if (claimed.attempts < MAX_ATTEMPTS) {
        /*
         * Attempt 1 → 5 minutes
         * Attempt 2 → 10 minutes
         */
        const retryMinutes =
          claimed.attempts * 5;

        await Automation.findByIdAndUpdate(
          claimed._id,
          {
            $set: {
              status: 'pending',
              scheduledFor: new Date(
                Date.now() +
                  retryMinutes *
                    60 *
                    1000
              ),
              error: reason,
            },
          }
        );

        logger.warn(
          'Automation send failed — scheduled for retry',
          {
            automationId:
              claimed._id.toString(),
            type: claimed.type,
            attempts: claimed.attempts,
            retryMinutes,
            reason,
          }
        );
      } else {
        /*
         * Maximum attempts reached.
         */
        await Automation.findByIdAndUpdate(
          claimed._id,
          {
            $set: {
              status: 'failed',
              failedAt: new Date(),
              error: reason,
            },
          }
        );
        
        await updateCampaignStats(
          claimed,
          'failed'
        );

        logger.error(
          'Automation permanently failed',
          {
            automationId:
              claimed._id.toString(),
            type: claimed.type,
            attempts: claimed.attempts,
            reason,
          }
        );
      }

      failed += 1;
    } catch (error) {
      failed += 1;

      logger.error(
        'Automation processing error',
        {
          automationId:
            automation._id?.toString(),
          type: automation.type,
          message: error.message,
        }
      );

      /*
       * If an unexpected error happens after claiming,
       * return the automation to pending.
       *
       * The attempt has already been counted.
       */
      try {
        await Automation.findOneAndUpdate(
          {
            _id: automation._id,
            status: 'processing',
          },
          {
            $set: {
              status: 'pending',
              scheduledFor: new Date(
                Date.now() +
                  5 * 60 * 1000
              ),
              error: error.message,
            },
          }
        );
      } catch (resetError) {
        logger.error(
          'Failed to reset automation after processing error',
          {
            automationId:
              automation._id?.toString(),
            message:
              resetError.message,
          }
        );
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * PROCESSOR SUMMARY
   * ---------------------------------------------------------
   */
  logger.info(
    'Automation processor completed',
    {
      scanned: automations.length,
      sent,
      failed,
      skipped,
      cancelled,
    }
  );

  return {
    scanned: automations.length,
    sent,
    failed,
    skipped,
    cancelled,
  };
}