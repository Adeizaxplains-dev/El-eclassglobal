import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    logoUrl: {
      type: String,
      default: '',
    },

    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
    },

    social: {
      instagram: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      tiktok: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
    },

    hours: {
      monday: { type: String, default: '' },
      tuesday: { type: String, default: '' },
      wednesday: { type: String, default: '' },
      thursday: { type: String, default: '' },
      friday: { type: String, default: '' },
      saturday: { type: String, default: '' },
      sunday: { type: String, default: '' },
    },

    whatsapp: {
      number: {
        type: String,
        trim: true,
        default: '',
      },
      enabled: {
        type: Boolean,
        default: true,
      },
      orderNotifications: {
        type: Boolean,
        default: true,
      },
      customerEnquiries: {
        type: Boolean,
        default: true,
      },
      abandonedCartMessages: {
        type: Boolean,
        default: false,
      },
    },

    automationSettings: {
      enabled: {
        type: Boolean,
        default: true,
      },

      abandonedCart: {
        enabled: {
          type: Boolean,
          default: false,
        },
        delayMinutes: {
          type: Number,
          default: 30,
          min: 1,
          max: 10080,
        },
      },

      paymentFollowUp: {
        enabled: {
          type: Boolean,
          default: true,
        },
        delayMinutes: {
          type: Number,
          default: 30,
          min: 1,
          max: 10080,
        },
      },

      orderConfirmation: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },

      shippingUpdate: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },

      deliveryUpdate: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },

      postPurchase: {
        enabled: {
          type: Boolean,
          default: true,
        },
        delayHours: {
          type: Number,
          default: 24,
          min: 1,
          max: 8760,
        },
      },
    },

    orderSettings: {
      allowGuestCheckout: {
        type: Boolean,
        default: true,
      },
      minimumOrderAmount: {
        type: Number,
        default: 0,
      },
      allowOrderCancellation: {
        type: Boolean,
        default: true,
      },
    },

    paymentSettings: {
      paystackEnabled: {
        type: Boolean,
        default: true,
      },
      cashOnDelivery: {
        type: Boolean,
        default: false,
      },
      bankTransfer: {
        type: Boolean,
        default: false,
      },
    },

    deliverySettings: {
      deliveryFee: {
        type: Number,
        default: 0,
      },
      freeDeliveryThreshold: {
        type: Number,
        default: null,
      },
    },

    currency: {
      type: String,
      default: 'NGN',
      trim: true,
      uppercase: true,
    },

    // Static business facts the storefront displays (trust strip, footer,
    // global-sourcing section). Admin-editable so this doesn't require a
    // code change if the client opens a new location or sourcing channel.
    locations: {
      type: [String],
      default: [],
    },
    sourcingCountries: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const Store = mongoose.model('Store', storeSchema);