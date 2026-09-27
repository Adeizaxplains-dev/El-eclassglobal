import mongoose from 'mongoose';

// Order items are snapshotted subdocuments — name/price/image are copied
// at order-creation time so later product edits (or deletion) never rewrite
// order history. Only productId/variantId are kept as live references.
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },

    sessionId: {
  type: String,
  required: true,
  index: true,
},
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Kept conceptually separate per architecture decision: a paid order
    // can still be "processing"; these must never be merged into one field.
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },

    delivery: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: '' },
      address: { type: String, required: true },
      state: { type: String, required: true },
      city: { type: String, required: true },
      note: { type: String, default: '' },
    },

    source: { type: String, default: '' },
    campaign: { type: String, default: '' },

    internalNotes: [
      {
        note: String,
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    statusHistory: [
      {
        field: { type: String, enum: ['paymentStatus', 'orderStatus'] },
        from: String,
        to: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      },
    ],
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
