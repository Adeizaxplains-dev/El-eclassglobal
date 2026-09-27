import mongoose from 'mongoose';

/*
 * ---------------------------------------------------------
 * PRODUCT REFERENCE SCHEMA
 * ---------------------------------------------------------
 *
 * Stores a snapshot of a product that was referenced in a
 * conversation message.
 *
 * IMPORTANT:
 * productId remains the link to the real Product document.
 *
 * The snapshot fields preserve what the customer actually saw
 * at the time of the conversation.
 */
const productReferenceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    name: {
      type: String,
      default: '',
      trim: true,
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

    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    variantName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/*
 * ---------------------------------------------------------
 * MEDIA SCHEMA
 * ---------------------------------------------------------
 */
const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'image',
        'video',
        'audio',
        'document',
      ],
      required: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      default: '',
      trim: true,
    },

    filename: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/*
 * ---------------------------------------------------------
 * MESSAGE SCHEMA
 * ---------------------------------------------------------
 *
 * A conversation contains multiple messages.
 *
 * sender:
 *   customer
 *   business
 *   ai
 *
 * type:
 *   text
 *   image
 *   video
 *   audio
 *   document
 *   product
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: [
        'customer',
        'business',
        'ai',
      ],
      required: true,
    },

    type: {
      type: String,
      enum: [
        'text',
        'image',
        'video',
        'audio',
        'document',
        'product',
      ],
      default: 'text',
      required: true,
    },

    text: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4096,
    },

    media: {
      type: mediaSchema,
      default: null,
    },

    /*
     * Products referenced or recommended during the message.
     */
    products: {
      type: [productReferenceSchema],
      default: [],
    },

    /*
     * -------------------------------------------------------
     * AI METADATA
     * -------------------------------------------------------
     *
     * Keeps AI-specific information separate from the actual
     * customer-facing message.
     */
    ai: {
      generated: {
        type: Boolean,
        default: false,
      },

      confidence: {
        type: Number,
        default: null,
        min: 0,
        max: 1,
      },

      intent: {
        type: String,
        default: '',
        trim: true,
      },

      source: {
        type: String,
        enum: [
          'product',
          'knowledge_base',
          'conversation',
          'mixed',
          'none',
        ],
        default: 'none',
      },

      handoffRequested: {
        type: Boolean,
        default: false,
      },

      toolCalls: {
        type: [
          {
            name: {
              type: String,
              trim: true,
            },

            arguments: {
              type: mongoose.Schema.Types.Mixed,
              default: {},
            },

            result: {
              type: mongoose.Schema.Types.Mixed,
              default: null,
            },
          },
        ],
        default: [],
      },
    },

    /*
     * WhatsApp/provider message ID.
     *
     * Useful for preventing duplicate webhook processing.
     */
    externalMessageId: {
      type: String,
      default: '',
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

/*
 * ---------------------------------------------------------
 * CONVERSATION SCHEMA
 * ---------------------------------------------------------
 */
const conversationSchema = new mongoose.Schema(
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
     * CUSTOMER
     * -------------------------------------------------------
     */
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    /*
     * -------------------------------------------------------
     * CHANNEL
     * -------------------------------------------------------
     *
     * WhatsApp is the first supported channel.
     *
     * We can add Instagram, Facebook, website chat etc.
     * later without redesigning the conversation system.
     */
    channel: {
      type: String,
      enum: [
        'whatsapp',
        'instagram',
        'facebook',
        'web',
      ],
      default: 'whatsapp',
      required: true,
      index: true,
    },

    /*
     * -------------------------------------------------------
     * STATUS
     * -------------------------------------------------------
     */
    status: {
      type: String,
      enum: [
        'open',
        'pending',
        'resolved',
        'closed',
      ],
      default: 'open',
      index: true,
    },

    /*
     * -------------------------------------------------------
     * HANDLING MODE
     * -------------------------------------------------------
     *
     * ai:
     *   AI can automatically respond.
     *
     * human:
     *   Business owner/staff is handling the conversation.
     *
     * hybrid:
     *   AI can assist while a human remains involved.
     */
    mode: {
      type: String,
      enum: [
        'ai',
        'human',
        'hybrid',
      ],
      default: 'ai',
      index: true,
    },

    /*
     * -------------------------------------------------------
     * ASSIGNMENT
     * -------------------------------------------------------
     */
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /*
     * -------------------------------------------------------
     * MESSAGES
     * -------------------------------------------------------
     */
    messages: {
      type: [messageSchema],
      default: [],
    },

    /*
     * -------------------------------------------------------
     * CONVERSATION SUMMARY
     * -------------------------------------------------------
     *
     * Later the AI can maintain a compact summary instead of
     * sending the entire conversation history to the model.
     */
    summary: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000,
    },

    /*
     * -------------------------------------------------------
     * LAST MESSAGE
     * -------------------------------------------------------
     */
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    lastMessagePreview: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },

    /*
     * -------------------------------------------------------
     * AI SETTINGS
     * -------------------------------------------------------
     */
    aiSettings: {
      enabled: {
        type: Boolean,
        default: true,
      },

      autoReply: {
        type: Boolean,
        default: true,
      },

      humanHandoff: {
        type: Boolean,
        default: true,
      },
    },

    /*
     * -------------------------------------------------------
     * CUSTOMER CONTEXT
     * -------------------------------------------------------
     *
     * Lightweight context that can be useful to the AI.
     * This is NOT a replacement for the Customer model.
     */
    context: {
      lastProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
      },

      lastOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
      },

      cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
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

/*
 * Quickly find conversations belonging to a store.
 */
conversationSchema.index({
  storeId: 1,
  lastMessageAt: -1,
});

/*
 * Quickly find a customer's conversations.
 */
conversationSchema.index({
  storeId: 1,
  customerId: 1,
  lastMessageAt: -1,
});

/*
 * Useful for the admin inbox.
 */
conversationSchema.index({
  storeId: 1,
  status: 1,
  mode: 1,
  lastMessageAt: -1,
});

/*
 * Prevent duplicate WhatsApp messages from creating duplicate
 * processing records when an external provider message ID exists.
 *
 * Sparse allows messages without an external ID.
 */
messageSchema.index(
  { externalMessageId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

/*
 * ---------------------------------------------------------
 * EXPORT
 * ---------------------------------------------------------
 */

export const Conversation = mongoose.model(
  'Conversation',
  conversationSchema
);