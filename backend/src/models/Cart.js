import mongoose from 'mongoose';

// Cart items are embedded subdocuments rather than a separate CartItem
// collection — a cart item has no independent lifecycle outside its cart,
// and embedding lets add/remove/update-quantity happen as one atomic write.
const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null }, // subdocument _id within Product.variants
    name: { type: String, required: true }, // snapshot at time of add, for display even if product changes
    category: { type: String, default: '' },
    image: { type: String, default: '' },
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    unitPrice: { type: Number, required: true }, // snapshot — cart total must not silently change if price changes
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    sessionId: { type: String, required: true, index: true }, // guest cart identifier, set via cookie/header
    items: [cartItemSchema],
    status: { type: String, enum: ['active', 'abandoned', 'converted'], default: 'active' },

    // Attribution captured at cart-creation time so it survives even if
    // the customer later browses without UTM params.
    source: { type: String, default: '' },
    campaign: { type: String, default: '' },

    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

cartSchema.methods.getSubtotal = function getSubtotal() {
  return this.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
};

export const Cart = mongoose.model('Cart', cartSchema);
