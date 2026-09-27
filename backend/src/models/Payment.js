import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    provider: { type: String, enum: ['paystack'], default: 'paystack' },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }, // kobo, matches Paystack's unit
    currency: { type: String, default: 'NGN' },
    status: { type: String, enum: ['pending', 'success', 'failed', 'abandoned'], default: 'pending', index: true },
    verifiedAt: { type: Date, default: null },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null }, // Paystack's verify payload, for audit/debugging
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
