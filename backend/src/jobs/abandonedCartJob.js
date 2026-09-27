import { Cart } from '../models/Cart.js';
import { Customer } from '../models/Customer.js';
import { createAbandonedCartAutomation } from '../services/automationService.js';
import { getDefaultStoreId } from '../services/storeContext.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const ABANDONED_CART_MINUTES =
  env.abandonedCartMinutes;

const MAX_CARTS_PER_RUN = 100;

/**
 * Finds active carts that have been inactive long enough
 * to be considered abandoned and creates a recovery
 * automation for customers who have provided contact
 * information.
 *
 * This job DOES NOT send WhatsApp messages.
 *
 * Its responsibility is only:
 *
 * active cart
 *      ↓
 * inactive long enough
 *      ↓
 * known customer
 *      ↓
 * create pending automation
 *      ↓
 * mark cart abandoned
 */
export async function processAbandonedCarts() {
  const storeId = await getDefaultStoreId();

  const cutoff = new Date(
    Date.now() -
      ABANDONED_CART_MINUTES * 60 * 1000
  );

  const carts = await Cart.find({
    storeId,
    status: 'active',
    'items.0': { $exists: true },
    lastActivityAt: { $lte: cutoff },
    customerId: { $ne: null },
  })
    .sort({ lastActivityAt: 1 })
    .limit(MAX_CARTS_PER_RUN);

  if (carts.length === 0) {
    logger.info(
      'Abandoned-cart job: no eligible carts found'
    );

    return {
      scanned: 0,
      created: 0,
      skipped: 0,
    };
  }

  let created = 0;
  let skipped = 0;

  for (const cart of carts) {
    try {
      /*
       * Re-read the customer so we verify that the customer
       * still exists and still has a usable phone number.
       */
      const customer = await Customer.findOne({
        _id: cart.customerId,
        storeId,
      });

      if (!customer || !customer.phone) {
        skipped += 1;

        logger.info(
          'Abandoned-cart skipped — customer contact unavailable',
          {
            cartId: cart._id.toString(),
            customerId: cart.customerId?.toString(),
          }
        );

        continue;
      }

      /*
       * The automation service/database unique index protects
       * against duplicate abandoned-cart automations.
       */
      const automation =
        await createAbandonedCartAutomation({
          cart,
          customer,
          scheduledFor: new Date(),
        });

      /*
       * Only mark the cart abandoned when an automation was
       * successfully created or already exists according to
       * the automation service contract.
       */
      if (automation) {
        cart.status = 'abandoned';

        await cart.save();

        created += 1;

        logger.info(
          'Abandoned-cart automation created',
          {
            cartId: cart._id.toString(),
            customerId: customer._id.toString(),
            automationId:
              automation._id?.toString(),
          }
        );
      } else {
        skipped += 1;
      }
    } catch (error) {
      skipped += 1;

      logger.error(
        'Failed to create abandoned-cart automation',
        {
          cartId: cart._id?.toString(),
          customerId: cart.customerId?.toString(),
          message: error.message,
        }
      );
    }
  }

  logger.info(
    'Abandoned-cart job completed',
    {
      scanned: carts.length,
      created,
      skipped,
      abandonedAfterMinutes:
        ABANDONED_CART_MINUTES,
    }
  );

  return {
    scanned: carts.length,
    created,
    skipped,
  };
}