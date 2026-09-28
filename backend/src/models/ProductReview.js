import mongoose from 'mongoose';

const productReviewSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Useful for retrieving approved reviews for a product.
productReviewSchema.index({
  storeId: 1,
  productId: 1,
  status: 1,
  createdAt: -1,
});

// Prevent accidental duplicate review records for the same
// customer/product combination later if we decide to enforce it.
productReviewSchema.index({
  productId: 1,
  customerId: 1,
});

export const ProductReview = mongoose.model(
  'ProductReview',
  productReviewSchema
);