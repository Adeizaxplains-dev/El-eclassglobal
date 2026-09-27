import mongoose from 'mongoose';

const automationSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        'abandoned_cart',
        'payment_followup',
        'order_confirmation',
        'shipping_update',
        'delivery_update',
        'post_purchase',
        'campaign',
      ],
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
      index: true,
    },

    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      default: null,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    channel: {
      type: String,
      enum: ['whatsapp'],
      default: 'whatsapp',
    },

    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'sent',
        'failed',
        'cancelled',
      ],
      default: 'pending',
      index: true,
    },

    scheduledFor: {
      type: Date,
      default: Date.now,
      index: true,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    recipient: {
      type: String,
      default: '',
    },

    message: {
      type: String,
      default: '',
    },

    error: {
      type: String,
      default: '',
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/*
 * ---------------------------------------------------------
 * ABANDONED CART AUTOMATION
 * ---------------------------------------------------------
 *
 * Prevents multiple abandoned-cart automations from being
 * created for the same cart.
 *
 * The scheduler runs every few minutes, so this unique index
 * protects against duplicate automation creation.
 */
automationSchema.index(
  {
    storeId: 1,
    type: 1,
    cartId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      type: 'abandoned_cart',
      cartId: { $type: 'objectId' },
    },
  }
);

/*
 * ---------------------------------------------------------
 * ORDER-BASED AUTOMATIONS
 * ---------------------------------------------------------
 *
 * Prevents duplicate automations for the same order and
 * automation type.
 *
 * This covers:
 * - payment_followup
 * - order_confirmation
 * - shipping_update
 * - delivery_update
 * - post_purchase
 */
automationSchema.index(
  {
    storeId: 1,
    type: 1,
    orderId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      orderId: { $type: 'objectId' },
      type: {
        $in: [
          'payment_followup',
          'order_confirmation',
          'shipping_update',
          'delivery_update',
          'post_purchase',
        ],
      },
    },
  }
);

/*
 * ---------------------------------------------------------
 * CAMPAIGN AUTOMATIONS
 * ---------------------------------------------------------
 *
 * Prevents the same customer from receiving duplicate
 * automation records for the same campaign.
 *
 * Example:
 *
 * Campaign A
 *   └── Customer 123 → one automation
 *
 * If the campaign launch process runs again, the existing
 * automation is reused instead of creating another one.
 */
automationSchema.index(
  {
    storeId: 1,
    type: 1,
    campaignId: 1,
    customerId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      type: 'campaign',
      campaignId: { $type: 'objectId' },
      customerId: { $type: 'objectId' },
    },
  }
);

/*
 * ---------------------------------------------------------
 * PROCESSOR INDEX
 * ---------------------------------------------------------
 *
 * Allows the automation processor to efficiently find:
 *
 * pending automations
 * whose scheduled time has arrived.
 */
automationSchema.index({
  storeId: 1,
  status: 1,
  scheduledFor: 1,
});

/*
 * ---------------------------------------------------------
 * EXPORT
 * ---------------------------------------------------------
 */
export const Automation = mongoose.model(
  'Automation',
  automationSchema
);