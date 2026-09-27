import mongoose from 'mongoose';

// Powers the conversion funnel (traffic -> product view -> add to cart ->
// checkout started -> payment attempted -> payment successful -> order
// completed) without scattering tracking calls through UI components —
// the frontend fires one event per funnel step, backend just stores it.
const customerEventSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    sessionId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'product_view',
        'add_to_cart',
        'checkout_started',
        'payment_attempted',
        'payment_successful',
        'order_completed',
      ],
      required: true,
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    source: { type: String, default: '' },
    campaign: { type: String, default: '' },
  },
  { timestamps: true }
);

customerEventSchema.index({ storeId: 1, type: 1, createdAt: -1 });

export const CustomerEvent = mongoose.model('CustomerEvent', customerEventSchema);
