import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Primary staff identity / onboarding channel.
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    whatsappVerified: {
      type: Boolean,
      default: false,
    },

    passwordHash: {
      type: String,
      required: false,
      select: false,
    },

    // System-level access.
    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff',
    },

    // Business/job role.
    // Examples:
    // Order Manager
    // Customer Support
    // Marketing Manager
    // Inventory Manager
    // Sales Agent
    jobRole: {
      type: String,
      trim: true,
      default: 'Staff',
    },

    // Fine-grained activity permissions.
    permissions: {
      type: [String],
      default: [],
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Invitation lifecycle.
    invitationStatus: {
      type: String,
      enum: ['none', 'pending', 'accepted', 'expired'],
      default: 'none',
    },

    invitedAt: {
      type: Date,
      default: null,
    },

    invitationExpiresAt: {
      type: Date,
      default: null,
    },

    /*
     * SECURITY:
     * Never store the raw invitation token.
     * The invitation service will hash the token before storing it.
     */
    invitationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    activatedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compare a login password with the stored password hash.
 */
userSchema.methods.comparePassword = function comparePassword(
  candidate
) {
  if (!this.passwordHash || !candidate) {
    return false;
  }

  return bcrypt.compare(
    candidate,
    this.passwordHash
  );
};

/**
 * Convert the user into a safe object for API responses.
 */
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email || null,
    whatsappNumber: this.whatsappNumber,
    whatsappVerified: this.whatsappVerified,
    role: this.role,
    jobRole: this.jobRole,
    permissions: this.permissions,
    storeId: this.storeId,
    isActive: this.isActive,
    invitationStatus: this.invitationStatus,
    invitedAt: this.invitedAt,
    activatedAt: this.activatedAt,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model('User', userSchema);