import mongoose from 'mongoose';
import { productVariantSchema } from './ProductVariant.js';

const productSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    images: [{ url: String, publicId: String }], // publicId = Cloudinary asset id, for later deletion/replacement

    basePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null, min: 0 }, // null = not on sale

    // Gadget-specific fields — the client has not confirmed a full
    // condition/warranty policy yet, so these stay per-product and
    // optional rather than a single hardcoded default. Never assume
    // "New" or a specific warranty length when this is absent.
    condition: {
      type: String,
      enum: ['New', 'UK Used', 'US Used', 'Refurbished'],
      default: null,
    },
    warranty: { type: String, default: '' }, // e.g. "3 months" — free text, admin-entered; empty = not yet confirmed

    // Stock at the product level applies only when there are no variants.
    // Once variants exist, availability is derived from variant stock.
    stock: { type: Number, default: 0, min: 0 },
    variants: [productVariantSchema],

    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },

    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, slug: 1 }, { unique: true });
productSchema.index({ storeId: 1, status: 1, categoryId: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Effective selling price — sale price when set, otherwise base price.
// Kept as a method (not stored) so it's never stale relative to edits.
productSchema.methods.getEffectivePrice = function getEffectivePrice() {
  return this.salePrice != null && this.salePrice < this.basePrice ? this.salePrice : this.basePrice;
};

// True availability, accounting for variants vs simple stock.
productSchema.methods.isInStock = function isInStock() {
  if (this.variants && this.variants.length > 0) {
    return this.variants.some((v) => v.stock > 0);
  }
  return this.stock > 0;
};

export const Product = mongoose.model('Product', productSchema);
