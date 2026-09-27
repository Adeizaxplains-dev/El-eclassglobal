import { AppError } from '../utils/AppError.js';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isValidPermission,
} from '../services/permissionService.js';

/**
 * Require a specific permission.
 *
 * Example:
 * router.patch(
 *   '/:id',
 *   protect,
 *   requirePermission('orders.update'),
 *   updateOrder
 * );
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!permission || !isValidPermission(permission)) {
      return next(
        AppError.badRequest('Invalid permission')
      );
    }

    if (!req.user) {
      return next(
        AppError.unauthorized('Authentication required')
      );
    }

    if (!hasPermission(req.user, permission)) {
      return next(
        AppError.forbidden(
          `You do not have permission to perform this action`
        )
      );
    }

    next();
  };
}

/**
 * Require at least one permission from a list.
 *
 * Example:
 * requireAnyPermission([
 *   'orders.view',
 *   'orders.update'
 * ])
 */
export function requireAnyPermission(permissions = []) {
  return (req, res, next) => {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return next(
        AppError.badRequest('Permissions are required')
      );
    }

    const invalidPermissions = permissions.filter(
      (permission) => !isValidPermission(permission)
    );

    if (invalidPermissions.length > 0) {
      return next(
        AppError.badRequest('Invalid permission')
      );
    }

    if (!req.user) {
      return next(
        AppError.unauthorized('Authentication required')
      );
    }

    if (!hasAnyPermission(req.user, permissions)) {
      return next(
        AppError.forbidden(
          'You do not have permission to perform this action'
        )
      );
    }

    next();
  };
}

/**
 * Require every permission from a list.
 *
 * Example:
 * requireAllPermissions([
 *   'products.view',
 *   'products.edit'
 * ])
 */
export function requireAllPermissions(permissions = []) {
  return (req, res, next) => {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return next(
        AppError.badRequest('Permissions are required')
      );
    }

    const invalidPermissions = permissions.filter(
      (permission) => !isValidPermission(permission)
    );

    if (invalidPermissions.length > 0) {
      return next(
        AppError.badRequest('Invalid permission')
      );
    }

    if (!req.user) {
      return next(
        AppError.unauthorized('Authentication required')
      );
    }

    if (!hasAllPermissions(req.user, permissions)) {
      return next(
        AppError.forbidden(
          'You do not have permission to perform this action'
        )
      );
    }

    next();
  };
}

/**
 * Require either a specific permission or one of several permissions.
 *
 * Useful when a route should remain accessible to admins
 * or staff with the appropriate activity permission.
 */
export function requirePermissionOrRole(permission, ...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        AppError.unauthorized('Authentication required')
      );
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    if (!permission || !isValidPermission(permission)) {
      return next(
        AppError.badRequest('Invalid permission')
      );
    }

    if (!hasPermission(req.user, permission)) {
      return next(
        AppError.forbidden(
          'You do not have permission to perform this action'
        )
      );
    }

    next();
  };
}