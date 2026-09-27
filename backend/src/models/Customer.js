import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: {
      line: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      note: { type: String, default: '' },
    },

    acquisitionSource: {
      type: String,
      enum: ['tiktok', 'instagram', 'whatsapp', 'direct', 'google', 'referral', 'other'],
      default: 'direct',
    },
    acquisitionCampaign: { type: String, default: '' },

    tags: [{ type: String, trim: true }],

    // Denormalized for fast dashboard/admin reads — recalculated by
    // orderService whenever an order's payment status changes, never
    // edited directly from a controller.
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: { type: Date, default: null },
    lastInteractionAt: { type: Date, default: null },

    customerStatus: {
      type: String,
      enum: ['lead', 'prospect', 'customer', 'repeat_customer', 'vip', 'inactive'],
      default: 'lead',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

customerSchema.index({ storeId: 1, phone: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
