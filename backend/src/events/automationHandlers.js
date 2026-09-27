import { orderEvents, ORDER_EVENTS } from './orderEvents.js';
import {
  createOrderConfirmationAutomation,
  createShipmentAutomation,
  createDeliveryAutomation,
  createPostPurchaseAutomation,
} from '../services/automationService.js';
import { logger } from '../utils/logger.js';

/**
 * Registers order lifecycle automation handlers.
 *
 * Event flow:
 *
 * payment verified
 *      ↓
 * order.paid
 *      ↓
 * order confirmation automation
 *
 * order shipped
 *      ↓
 * order.shipped
 *      ↓
 * shipment automation
 *
 * order delivered
 *      ↓
 * order.delivered
 *      ↓
 * delivery automation
 *      ↓
 * delayed post-purchase automation
 */
export function registerAutomationHandlers() {
  /*
   * ---------------------------------------------------------
   * ORDER PAID
   * ---------------------------------------------------------
   */
  orderEvents.on(
    ORDER_EVENTS.PAID,
    async ({ order, customer }) => {
      try {
        await createOrderConfirmationAutomation({
          order,
          customer,
        });

        logger.info('Order confirmation automation created', {
          orderId: order._id?.toString(),
          orderNumber: order.orderNumber,
          customerId: customer?._id?.toString(),
        });
      } catch (err) {
        logger.error(
          'Order confirmation automation failed',
          {
            message: err.message,
            orderId: order._id?.toString(),
          }
        );
      }
    }
  );

  /*
   * ---------------------------------------------------------
   * ORDER SHIPPED
   * ---------------------------------------------------------
   */
  orderEvents.on(
    ORDER_EVENTS.SHIPPED,
    async ({ order, customer }) => {
      try {
        await createShipmentAutomation({
          order,
          customer,
        });

        logger.info('Shipment automation created', {
          orderId: order._id?.toString(),
          orderNumber: order.orderNumber,
        });
      } catch (err) {
        logger.error(
          'Shipment automation failed',
          {
            message: err.message,
            orderId: order._id?.toString(),
          }
        );
      }
    }
  );

  /*
   * ---------------------------------------------------------
   * ORDER DELIVERED
   * ---------------------------------------------------------
   */
  orderEvents.on(
    ORDER_EVENTS.DELIVERED,
    async ({ order, customer }) => {
      try {
        await createDeliveryAutomation({
          order,
          customer,
        });

        /*
         * Development/testing delay.
         *
         * Later this should become configurable from store
         * automation settings.
         */
        const postPurchaseDelay =
          24 * 60 * 60 * 1000;

        await createPostPurchaseAutomation({
          order,
          customer,
          scheduledFor: new Date(
            Date.now() + postPurchaseDelay
          ),
        });

        logger.info(
          'Delivery and post-purchase automations created',
          {
            orderId: order._id?.toString(),
            orderNumber: order.orderNumber,
          }
        );
      } catch (err) {
        logger.error(
          'Delivery automation failed',
          {
            message: err.message,
            orderId: order._id?.toString(),
          }
        );
      }
    }
  );

  logger.info('Automation handlers registered');
}