import crypto from 'crypto';

import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

import {
  buildPermissionsFromJobRole,
  validatePermissions,
  validateSystemRole,
  getDefaultRoles,
} from './permissionService.js';

import { sendWhatsAppText } from './whatsappService.js';

const INVITATION_EXPIRY_HOURS = 48;

/**
 * Normalize a WhatsApp number.
 *
 * We keep the stored value as digits only so the same number
 * cannot be added in multiple formats.
 *
 * Example:
 * 08164644748 -> 2348164644748
 */
function normalizeWhatsAppNumber(value) {
  if (!value || typeof value !== 'string') {
    throw AppError.badRequest('WhatsApp number is required');
  }

  let number = value.trim().replace(/[^\d+]/g, '');

  if (number.startsWith('+')) {
    number = number.slice(1);
  }

  if (number.startsWith('00')) {
    number = number.slice(2);
  }

  // Nigeria local format.
  if (number.startsWith('0')) {
    number = `234${number.slice(1)}`;
  }

  if (!/^234\d{10}$/.test(number)) {
    throw AppError.badRequest(
      'Enter a valid Nigerian WhatsApp number'
    );
  }

  return number;
}

function normalizeName(name) {
  if (!name || typeof name !== 'string') {
    throw AppError.badRequest('Staff name is required');
  }

  const normalized = name.trim();

  if (normalized.length < 2) {
    throw AppError.badRequest(
      'Staff name must be at least 2 characters'
    );
  }

  if (normalized.length > 100) {
    throw AppError.badRequest(
      'Staff name must not exceed 100 characters'
    );
  }

  return normalized;
}

function normalizeEmail(email) {
  if (email === undefined || email === null || email === '') {
    return undefined;
  }

  if (typeof email !== 'string') {
    throw AppError.badRequest(
      'Email must be a valid email address'
    );
  }

  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw AppError.badRequest(
      'Email must be a valid email address'
    );
  }

  return normalized;
}

function normalizeJobRole(jobRole) {
  if (!jobRole || typeof jobRole !== 'string') {
    throw AppError.badRequest('Job role is required');
  }

  const normalized = jobRole.trim();

  if (normalized.length < 2) {
    throw AppError.badRequest(
      'Job role must be at least 2 characters'
    );
  }

  if (normalized.length > 100) {
    throw AppError.badRequest(
      'Job role must not exceed 100 characters'
    );
  }

  return normalized;
}

function generateInvitationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash the invitation token before storing it.
 *
 * The raw token is never persisted in MongoDB.
 */
function hashInvitationToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

function getInvitationExpiry() {
  return new Date(
    Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000
  );
}

function isInvitationExpired(user) {
  if (!user.invitationExpiresAt) {
    return false;
  }

  return (
    new Date(user.invitationExpiresAt).getTime() < Date.now()
  );
}

function toSafeUser(user) {
  if (!user) {
    return null;
  }

  if (typeof user.toSafeJSON === 'function') {
    return user.toSafeJSON();
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email || null,
    whatsappNumber: user.whatsappNumber,
    whatsappVerified: user.whatsappVerified,
    role: user.role,
    jobRole: user.jobRole,
    permissions: user.permissions || [],
    storeId: user.storeId,
    isActive: user.isActive,
    invitationStatus: user.invitationStatus,
    invitedAt: user.invitedAt,
    activatedAt: user.activatedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function ensureAdmin(actor) {
  if (!actor) {
    throw AppError.unauthorized('Authentication required');
  }

  if (actor.role !== 'admin') {
    throw AppError.forbidden(
      'Only an admin can manage team members'
    );
  }
}

function ensureStoreId(actor) {
  if (!actor?.storeId) {
    throw AppError.badRequest(
      'Your account is not connected to a store'
    );
  }

  return actor.storeId;
}

/**
 * Send the team invitation through the existing WhatsApp service.
 *
 * The raw invitation token exists only in memory and is never
 * stored directly in MongoDB.
 */
async function sendTeamInvitationWhatsApp({
  name,
  whatsappNumber,
  role,
  jobRole,
  token,
  expiresAt,
}) {
  const expiryText = new Date(expiresAt).toLocaleString(
    'en-NG',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  );

  const message = [
    `Assalamu Alaikum ${name},`,
    '',
    'You have been invited to join the Flerläss Global team.',
    '',
    `System role: ${role}`,
    `Job role: ${jobRole}`,
    '',
    `Your invitation code is:`,
    token,
    '',
    `This invitation expires on ${expiryText}.`,
    '',
    'Please keep this invitation code private.',
    '',
    'Flerläss Global',
  ].join('\n');

  return sendWhatsAppText({
    phone: whatsappNumber,
    text: message,
  });
}

/**
 * List all users belonging to the current admin's store.
 */
export async function listTeamMembers(actor, options = {}) {
  ensureAdmin(actor);

  const storeId = ensureStoreId(actor);

  const page = Math.max(
    Number.parseInt(options.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(options.limit, 10) || 20,
      1
    ),
    100
  );

  const search =
    typeof options.search === 'string'
      ? options.search.trim()
      : '';

  const filter = {
    storeId,
  };

  if (options.isActive !== undefined) {
    if (
      options.isActive !== true
      && options.isActive !== false
      && options.isActive !== 'true'
      && options.isActive !== 'false'
    ) {
      throw AppError.badRequest(
        'isActive must be true or false'
      );
    }

    filter.isActive =
      options.isActive === true
      || options.isActive === 'true';
  }

  if (
    options.invitationStatus !== undefined
    && options.invitationStatus !== ''
  ) {
    const allowedStatuses = [
      'none',
      'pending',
      'accepted',
      'expired',
    ];

    if (!allowedStatuses.includes(options.invitationStatus)) {
      throw AppError.badRequest(
        'Invalid invitation status'
      );
    }

    filter.invitationStatus = options.invitationStatus;
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        whatsappNumber: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        email: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        jobRole: {
          $regex: search,
          $options: 'i',
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({
        isActive: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit),

    User.countDocuments(filter),
  ]);

  return {
    data: users.map(toSafeUser),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get one team member.
 */
export async function getTeamMember(actor, userId) {
  ensureAdmin(actor);

  const storeId = ensureStoreId(actor);

  if (!userId) {
    throw AppError.badRequest('User ID is required');
  }

  const user = await User.findOne({
    _id: userId,
    storeId,
  });

  if (!user) {
    throw AppError.notFound('Team member not found');
  }

  return toSafeUser(user);
}

/**
 * Add/invite a new staff member.
 *
 * WhatsApp number is the primary onboarding identity.
 */
export async function inviteTeamMember(
  actor,
  payload = {}
) {
  ensureAdmin(actor);

  const storeId = ensureStoreId(actor);

  const name = normalizeName(payload.name);

  const whatsappNumber = normalizeWhatsAppNumber(
    payload.whatsappNumber
  );

  const email = normalizeEmail(payload.email);

  const requestedRole =
    payload.role === undefined
      ? 'staff'
      : payload.role;

  const role = validateSystemRole(
    actor,
    requestedRole
  );

  const jobRole = normalizeJobRole(
    payload.jobRole || 'Staff'
  );

  let permissions;

  if (payload.permissions !== undefined) {
    permissions = validatePermissions(
      payload.permissions
    );
  } else if (payload.jobRoleKey) {
    permissions = buildPermissionsFromJobRole(
      payload.jobRoleKey
    );
  } else {
    permissions = [];
  }

  const existing = await User.findOne({
    storeId,
    whatsappNumber,
  });

  if (existing) {
    if (existing.isActive) {
      throw AppError.conflict(
        'A team member with this WhatsApp number already exists'
      );
    }

    throw AppError.conflict(
      'This WhatsApp number belongs to an inactive team member. Reactivate or edit the existing member instead.'
    );
  }

  if (email) {
    const existingEmail = await User.findOne({
      storeId,
      email,
    });

    if (existingEmail) {
      throw AppError.conflict(
        'A team member with this email already exists'
      );
    }
  }

  const invitationToken = generateInvitationToken();

  const invitationTokenHash =
    hashInvitationToken(invitationToken);

  const invitationExpiresAt = getInvitationExpiry();

  const user = await User.create({
    name,
    email,
    whatsappNumber,
    whatsappVerified: false,
    role,
    jobRole,
    permissions,
    storeId,
    isActive: true,
    invitationStatus: 'pending',
    invitedAt: new Date(),
    invitationExpiresAt,
    invitationTokenHash,
    activatedAt: null,
    lastLoginAt: null,
  });

  /*
   * Send the invitation through the existing WhatsApp
   * application service.
   *
   * We do not store the raw token.
   */
  let whatsapp;

  try {
    whatsapp =
      await sendTeamInvitationWhatsApp({
        name,
        whatsappNumber,
        role,
        jobRole,
        token: invitationToken,
        expiresAt: invitationExpiresAt,
      });
  } catch (error) {
    /*
     * The team member has already been created safely.
     * Return the delivery failure so the admin knows the
     * invitation was created but WhatsApp delivery failed.
     */
    return {
      user: toSafeUser(user),
      invitation: {
        sent: false,
        channel: 'whatsapp',
        expiresAt: invitationExpiresAt,
        deliveryError:
          error?.message ||
          'Unable to send WhatsApp invitation.',
      },
    };
  }

  return {
    user: toSafeUser(user),
    invitation: {
      sent: Boolean(whatsapp?.sent),
      channel: 'whatsapp',
      expiresAt: invitationExpiresAt,
      deliveryError:
        whatsapp?.sent
          ? null
          : 'WhatsApp provider did not confirm delivery.',
    },
  };
}

/**
 * Update a team member.
 */
export async function updateTeamMember(
  actor,
  userId,
  payload = {}
) {
  ensureAdmin(actor);

  const storeId = ensureStoreId(actor);

  if (!userId) {
    throw AppError.badRequest('User ID is required');
  }

  const user = await User.findOne({
    _id: userId,
    storeId,
  });

  if (!user) {
    throw AppError.notFound('Team member not found');
  }

  // Do not allow the admin to accidentally modify
  // their own admin account through this endpoint.
  if (
    user._id.toString() === actor.id?.toString()
    || user._id.toString() === actor._id?.toString()
  ) {
    throw AppError.badRequest(
      'Your own account must be managed from account settings'
    );
  }

  if (payload.name !== undefined) {
    user.name = normalizeName(payload.name);
  }

  if (payload.whatsappNumber !== undefined) {
    const whatsappNumber =
      normalizeWhatsAppNumber(
        payload.whatsappNumber
      );

    const existing = await User.findOne({
      _id: { $ne: user._id },
      storeId,
      whatsappNumber,
    });

    if (existing) {
      throw AppError.conflict(
        'Another team member already uses this WhatsApp number'
      );
    }

    user.whatsappNumber = whatsappNumber;
    user.whatsappVerified = false;
  }

  if (payload.email !== undefined) {
    const email = normalizeEmail(payload.email);

    if (email) {
      const existing = await User.findOne({
        _id: { $ne: user._id },
        storeId,
        email,
      });

      if (existing) {
        throw AppError.conflict(
          'Another team member already uses this email'
        );
      }
    }

    user.email = email;
  }

  if (payload.role !== undefined) {
    user.role = validateSystemRole(
      actor,
      payload.role
    );
  }

  if (payload.jobRole !== undefined) {
    user.jobRole = normalizeJobRole(
      payload.jobRole
    );
  }

  if (payload.jobRoleKey !== undefined) {
    user.permissions =
      buildPermissionsFromJobRole(
        payload.jobRoleKey
      );
  }

  if (payload.permissions !== undefined) {
    user.permissions =
      validatePermissions(
        payload.permissions
      );
  }

  await user.save();

  return toSafeUser(user);
}

/**
 * Activate or deactivate a team member.
 */
export async function setTeamMemberStatus(
  actor,
  userId,
  isActive
) {
  ensureAdmin(actor);

  const storeId = ensureStoreId(actor);

  if (!userId) {
    throw AppError.badRequest('User ID is required');
  }

  if (typeof isActive !== 'boolean') {
    throw AppError.badRequest(
      'isActive must be true or false'
    );
  }

  const user = await User.findOne({
    _id: userId,
    storeId,
  });

  if (!user) {
    throw AppError.notFound('Team member not found');
  }

  if (
    user._id.toString() === actor.id?.toString()
    || user._id.toString() === actor._id?.toString()
  ) {
    throw AppError.badRequest(
      'You cannot deactivate your own account'
    );
  }

  user.isActive = isActive;

  await user.save();

  return toSafeUser(user);
}

/**
 * Resend/regenerate an invitation.
 */
export async function resendInvitation(
  actor,
  userId
) {
  ensureAdmin(actor);

  const storeId = ensureStoreId(actor);

  if (!userId) {
    throw AppError.badRequest('User ID is required');
  }

  const user = await User.findOne({
    _id: userId,
    storeId,
  });

  if (!user) {
    throw AppError.notFound('Team member not found');
  }

  if (!user.isActive) {
    throw AppError.badRequest(
      'Cannot invite an inactive team member'
    );
  }

  if (user.invitationStatus === 'accepted') {
    throw AppError.badRequest(
      'This team member has already accepted the invitation'
    );
  }

  const invitationToken = generateInvitationToken();

  const invitationTokenHash =
    hashInvitationToken(invitationToken);

  const invitationExpiresAt =
    getInvitationExpiry();

  user.invitationStatus = 'pending';
  user.invitedAt = new Date();
  user.invitationExpiresAt =
    invitationExpiresAt;
  user.invitationTokenHash =
    invitationTokenHash;

  await user.save();

  let whatsapp;

  try {
    whatsapp =
      await sendTeamInvitationWhatsApp({
        name: user.name,
        whatsappNumber: user.whatsappNumber,
        role: user.role,
        jobRole: user.jobRole,
        token: invitationToken,
        expiresAt: invitationExpiresAt,
      });
  } catch (error) {
    return {
      user: toSafeUser(user),
      invitation: {
        sent: false,
        channel: 'whatsapp',
        expiresAt: invitationExpiresAt,
        deliveryError:
          error?.message ||
          'Unable to send WhatsApp invitation.',
      },
    };
  }

  return {
    user: toSafeUser(user),
    invitation: {
      sent: Boolean(whatsapp?.sent),
      channel: 'whatsapp',
      expiresAt: invitationExpiresAt,
      deliveryError:
        whatsapp?.sent
          ? null
          : 'WhatsApp provider did not confirm delivery.',
    },
  };
}

/**
 * Mark an invitation as expired when needed.
 */
export async function refreshInvitationStatus(
  actor,
  userId
) {
  ensureAdmin(actor);

  const storeId = ensureStoreId(actor);

  const user = await User.findOne({
    _id: userId,
    storeId,
  });

  if (!user) {
    throw AppError.notFound('Team member not found');
  }

  if (
    user.invitationStatus === 'pending'
    && isInvitationExpired(user)
  ) {
    user.invitationStatus = 'expired';

    await user.save();
  }

  return toSafeUser(user);
}

/**
 * Return the predefined job roles and their permissions.
 *
 * Used by the Team UI when creating/editing staff.
 */
export function listDefaultJobRoles() {
  return getDefaultRoles().map((role) => ({
    key: role.key,
    name: role.name,
    permissions: [...role.permissions],
  }));
}