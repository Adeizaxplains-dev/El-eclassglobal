import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * Requires a valid Bearer token. Attaches `req.user` (safe fields only)
 * so downstream handlers never need to re-verify or re-query for basic
 * identity/role checks.
 */
export const protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw AppError.unauthorized('Authentication required');
  }

  const payload = verifyToken(token);

  const user = await User.findOne({ _id: payload.sub, isActive: true });
  if (!user) {
    throw AppError.unauthorized('Account no longer active');
  }

  req.user = user.toSafeJSON();
  next();
});

/**
 * Role check. Always reads req.user set by `protect` — never trusts
 * anything the client sent about its own role.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
