import {
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  PERMISSION_GROUPS,
  PERMISSIONS,
} from '../config/permissions.js';

import { AppError } from '../utils/AppError.js';

/**
 * Return all available permissions.
 */
export function getAllPermissions() {
  return ALL_PERMISSIONS;
}

/**
 * Return permissions grouped for the Team & Users UI.
 */
export function getPermissionGroups() {
  return PERMISSION_GROUPS;
}

/**
 * Return the built-in job-role templates.
 */
export function getDefaultRoles() {
  return DEFAULT_ROLES;
}

/**
 * Check whether a permission is valid.
 */
export function isValidPermission(permission) {
  return ALL_PERMISSIONS.includes(permission);
}

/**
 * Validate and normalize a permissions array.
 *
 * This prevents clients from submitting arbitrary permission strings.
 */
export function validatePermissions(permissions = []) {
  if (!Array.isArray(permissions)) {
    throw AppError.badRequest('Permissions must be an array');
  }

  const uniquePermissions = [...new Set(permissions)];

  const invalidPermissions = uniquePermissions.filter(
    (permission) => !isValidPermission(permission)
  );

  if (invalidPermissions.length > 0) {
    throw AppError.badRequest(
      `Invalid permission(s): ${invalidPermissions.join(', ')}`
    );
  }

  return uniquePermissions;
}

/**
 * Get the permissions belonging to one of the built-in roles.
 */
export function getRolePermissions(roleKey) {
  const role = DEFAULT_ROLES.find((item) => item.key === roleKey);

  if (!role) {
    throw AppError.badRequest('Invalid job role');
  }

  return [...role.permissions];
}

/**
 * Check whether a user has a specific permission.
 *
 * Admins always have full access.
 */
export function hasPermission(user, permission) {
  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  if (!isValidPermission(permission)) {
    return false;
  }

  return Array.isArray(user.permissions)
    && user.permissions.includes(permission);
}

/**
 * Check whether a user has at least one permission
 * from a supplied list.
 */
export function hasAnyPermission(user, permissions = []) {
  if (!user || !Array.isArray(permissions)) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  return permissions.some((permission) =>
    hasPermission(user, permission)
  );
}

/**
 * Check whether a user has every permission
 * from a supplied list.
 */
export function hasAllPermissions(user, permissions = []) {
  if (!user || !Array.isArray(permissions)) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  return permissions.every((permission) =>
    hasPermission(user, permission)
  );
}

/**
 * Ensure the requested permissions do not exceed
 * what a non-admin staff member is allowed to receive.
 *
 * Admin is the only role allowed to manage unrestricted
 * permissions.
 */
export function assertManageablePermissions(actor, permissions = []) {
  if (!actor) {
    throw AppError.unauthorized('Authentication required');
  }

  const normalizedPermissions = validatePermissions(permissions);

  if (actor.role === 'admin') {
    return normalizedPermissions;
  }

  throw AppError.forbidden(
    'Only an admin can assign or change user permissions'
  );
}

/**
 * Prevent staff users from assigning the system-level
 * admin role.
 */
export function validateSystemRole(actor, requestedRole) {
  if (!['admin', 'staff'].includes(requestedRole)) {
    throw AppError.badRequest('Invalid system role');
  }

  if (requestedRole === 'admin' && actor?.role !== 'admin') {
    throw AppError.forbidden(
      'Only an admin can assign the admin role'
    );
  }

  return requestedRole;
}

/**
 * Prevent permission escalation through job-role templates.
 *
 * Returns a clean copy so callers cannot accidentally mutate
 * the central role definitions.
 */
export function buildPermissionsFromJobRole(jobRoleKey) {
  return getRolePermissions(jobRoleKey);
}

/**
 * Utility used by the frontend/admin API to determine whether
 * a permission belongs to a particular permission group.
 */
export function getPermissionGroup(permission) {
  for (const group of PERMISSION_GROUPS) {
    const found = group.permissions.find(
      (item) => item.key === permission
    );

    if (found) {
      return {
        key: group.key,
        label: group.label,
        permission: found,
      };
    }
  }

  return null;
}

/**
 * Export commonly-used permission constants so backend
 * services can import from one place when useful.
 */
export { PERMISSIONS };