import mongoose from 'mongoose';

/*
 * ---------------------------------------------------------
 * CREATIVE CARD SCHEMA
 * ---------------------------------------------------------
 *
 * Used by carousel campaigns.
 */
const creativeCardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    mediaUrl: {
      type: String,
      default: '',
      trim: true,
    },

    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },

    buttonText: {
      type: String,
      default: '',
      trim: true,
      maxlength: 50,
    },

    buttonUrl: {
      type: String,
      default: '',
      trim: true,
    },

    /*
     * Optional price for this carousel item.
     */
    price: {
      type: Number,
      default: null,
      min: 0,
    },

    /*
     * Optional old price for showing a discount.
     */
    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    /*
     * Optional currency.
     */
    currency: {
      type: String,
      default: 'NGN',
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
  },
  { _id: false }
);

/*
 * ---------------------------------------------------------
 * PRICE / OFFER SCHEMA
 * ---------------------------------------------------------
 *
 * Stores the commercial information displayed in the
 * campaign advertisement.
 *
 * Example:
 *
 * price: 25000
 * compareAtPrice: 35000
 * currency: NGN
 * label: "Special Offer"
 * discountText: "29% OFF"
 */
const creativePriceSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    price: {
      type: Number,
      default: null,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    currency: {
      type: String,
      default: 'NGN',
      trim: true,
      uppercase: true,
      maxlength: 10,
    },

    label: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },

    discountText: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },

    /*
     * Optional promotional text.
     *
     * Example:
     * "Free delivery within Lagos"
     */
    offerText: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
  },
  {
    _id: false,
  }
);

/*
 * ---------------------------------------------------------
 * CREATIVE SCHEMA
 * ---------------------------------------------------------
 *
 * Supported campaign creatives:
 *
 * text
 * image
 * video
 * carousel
 */
const creativeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'carousel'],
      default: 'text',
      required: true,
    },

    /*
     * -----------------------------------------------------
     * MAIN MEDIA
     * -----------------------------------------------------
     *
     * Used for image/video campaigns.
     */
    mediaUrl: {
      type: String,
      default: '',
      trim: true,
    },

    mediaMimeType: {
      type: String,
      default: '',
      trim: true,
    },

    mediaName: {
      type: String,
      default: '',
      trim: true,
    },

    /*
     * -----------------------------------------------------
     * CAPTION
     * -----------------------------------------------------
     */
    caption: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4096,
    },

    /*
     * -----------------------------------------------------
     * PRICE / OFFER
     * -----------------------------------------------------
     *
     * Optional advertisement pricing.
     *
     * This is saved with the campaign draft so the admin
     * can prepare the complete advertisement before launch.
     */
    price: {
      type: creativePriceSchema,
      default: () => ({
        enabled: false,
        price: null,
        compareAtPrice: null,
        currency: 'NGN',
        label: '',
        discountText: '',
        offerText: '',
      }),
    },

    /*
     * -----------------------------------------------------
     * CTA
     * -----------------------------------------------------
     *
     * Optional primary call-to-action.
     *
     * Example:
     * "Shop Now"
     * "Order Now"
     * "View Product"
     */
    buttonText: {
      type: String,
      default: '',
      trim: true,
      maxlength: 50,
    },

    buttonUrl: {
      type: String,
      default: '',
      trim: true,
    },

    /*
     * -----------------------------------------------------
     * CAROUSEL
     * -----------------------------------------------------
     */
    cards: {
      type: [creativeCardSchema],
      default: [],
      validate: {
        validator: function (cards) {
          if (this.type !== 'carousel') {
            return true;
          }

          return cards.length >= 1 && cards.length <= 10;
        },
        message: 'A carousel must contain between 1 and 10 cards.',
      },
    },
  },
  {
    _id: false,
  }
);

/*
 * ---------------------------------------------------------
 * CAMPAIGN SCHEMA
 * ---------------------------------------------------------
 */
const campaignSchema = new mongoose.Schema(
  {
    /*
     * -------------------------------------------------------
     * STORE
     * -------------------------------------------------------
     */
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    /*
     * -------------------------------------------------------
     * CAMPAIGN INFORMATION
     * -------------------------------------------------------
     */
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    /*
     * -------------------------------------------------------
     * CHANNEL
     * -------------------------------------------------------
     */
    channel: {
      type: String,
      enum: ['whatsapp'],
      default: 'whatsapp',
      index: true,
    },

    /*
     * -------------------------------------------------------
     * AUDIENCE
     * -------------------------------------------------------
     */
    audience: {
      customerStatus: [
        {
          type: String,
          enum: [
            'lead',
            'prospect',
            'customer',
            'repeat_customer',
            'vip',
            'inactive',
          ],
        },
      ],

      acquisitionSource: [
        {
          type: String,
          enum: [
            'tiktok',
            'instagram',
            'whatsapp',
            'direct',
            'google',
            'referral',
            'other',
          ],
        },
      ],

      acquisitionCampaign: {
        type: String,
        default: '',
        trim: true,
      },

      tags: [
        {
          type: String,
          trim: true,
        },
      ],

      minTotalOrders: {
        type: Number,
        default: null,
        min: 0,
      },

      maxTotalOrders: {
        type: Number,
        default: null,
        min: 0,
      },

      minTotalSpent: {
        type: Number,
        default: null,
        min: 0,
      },

      maxTotalSpent: {
        type: Number,
        default: null,
        min: 0,
      },

      inactiveSince: {
        type: Date,
        default: null,
      },
    },

    /*
     * -------------------------------------------------------
     * CREATIVE
     * -------------------------------------------------------
     *
     * This is the actual advertisement content.
     *
     * It is saved when the campaign is saved as a draft.
     */
    creative: {
      type: creativeSchema,

      default: () => ({
        type: 'text',
        mediaUrl: '',
        mediaMimeType: '',
        mediaName: '',
        caption: '',

        price: {
          enabled: false,
          price: null,
          compareAtPrice: null,
          currency: 'NGN',
          label: '',
          discountText: '',
          offerText: '',
        },

        buttonText: '',
        buttonUrl: '',

        cards: [],
      }),
    },

    /*
     * -------------------------------------------------------
     * MESSAGE
     * -------------------------------------------------------
     *
     * Main campaign text.
     *
     * For text:
     *   Primary message.
     *
     * For image/video:
     *   Caption/message accompanying the creative.
     *
     * For carousel:
     *   Introductory campaign text.
     */
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4096,
    },

    /*
     * -------------------------------------------------------
     * STATUS
     * -------------------------------------------------------
     */
    status: {
      type: String,
      enum: [
        'draft',
        'scheduled',
        'running',
        'completed',
        'paused',
        'cancelled',
      ],
      default: 'draft',
      index: true,
    },

    /*
     * -------------------------------------------------------
     * SCHEDULING
     * -------------------------------------------------------
     */
    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    /*
     * -------------------------------------------------------
     * CAMPAIGN COUNTERS
     * -------------------------------------------------------
     */
    stats: {
      targeted: {
        type: Number,
        default: 0,
        min: 0,
      },

      queued: {
        type: Number,
        default: 0,
        min: 0,
      },

      sent: {
        type: Number,
        default: 0,
        min: 0,
      },

      failed: {
        type: Number,
        default: 0,
        min: 0,
      },

      cancelled: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    /*
     * -------------------------------------------------------
     * CREATOR
     * -------------------------------------------------------
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /*
     * -------------------------------------------------------
     * METADATA
     * -------------------------------------------------------
     */
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
 * INDEXES
 * ---------------------------------------------------------
 */

campaignSchema.index({
  storeId: 1,
  status: 1,
  scheduledFor: 1,
});

campaignSchema.index({
  storeId: 1,
  createdAt: -1,
});

/*
 * ---------------------------------------------------------
 * EXPORT
 * ---------------------------------------------------------
 */

export const Campaign = mongoose.model(
  'Campaign',
  campaignSchema
);