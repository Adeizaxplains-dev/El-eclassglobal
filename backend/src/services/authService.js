import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export async function loginAdmin({ email, password }) {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true,
  }).select('+passwordHash');

  // Same error for "no user" and "wrong password" — don't leak which one it was.
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw AppError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({
    sub: user._id.toString(),
    role: user.role,
    storeId: user.storeId.toString(),
  });

  logger.info('Admin login', {
    userId: user._id.toString(),
  });

  return {
    token,
    user: user.toSafeJSON(),
  };
}

export async function changeAdminPassword(
  userId,
  { currentPassword, newPassword }
) {
  const user = await User.findOne({
    _id: userId,
    isActive: true,
  }).select('+passwordHash');

  if (!user) {
    throw AppError.unauthorized('Account no longer active');
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    throw AppError.unauthorized('Current password is incorrect');
  }

  const isSamePassword = await user.comparePassword(newPassword);

  if (isSamePassword) {
    throw AppError.badRequest(
      'New password must be different from your current password'
    );
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  logger.info('Admin password changed', {
    userId: user._id.toString(),
  });

  return user.toSafeJSON();
}