import mongoose from 'mongoose';

// Variants are embedded on Product as subdocuments rather than a separate
// collection — a variant never needs to be queried independently of its
// product, and embedding keeps price/stock updates atomic with the product
// write. Each subdocument still gets its own _id so the cart/order can
// reference a specific variant precisely.
const productVariantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    color: { type: String, trim: true, default: '' },
    size: { type: String, trim: true, default: '' },
    priceOverride: { type: Number, default: null }, // null = use product.basePrice/salePrice
    stock: { type: Number, required: true, default: 0, min: 0 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export { productVariantSchema };
