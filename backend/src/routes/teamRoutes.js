import express from 'express';

import {
  listTeamMembers,
  listDefaultJobRoles,
  getTeamMember,
  inviteTeamMember,
  updateTeamMember,
  setTeamMemberStatus,
  resendInvitation,
  refreshInvitationStatus,
} from '../controllers/teamController.js';

import { protect, authorize } from '../middleware/auth.js';
import {
  requirePermission,
  requirePermissionOrRole,
} from '../middleware/permission.js';

import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

// All team endpoints require authentication.
router.use(protect, authorize('admin', 'staff'));

// Team management is restricted according to permissions.
// Admins automatically pass permission checks.
router.get(
  '/',
  requirePermission(PERMISSIONS.TEAM_VIEW),
  listTeamMembers
);

router.get(
  '/roles',
  requirePermission(PERMISSIONS.TEAM_VIEW),
  listDefaultJobRoles
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.TEAM_VIEW),
  getTeamMember
);

router.post(
  '/invite',
  requirePermission(PERMISSIONS.TEAM_INVITE),
  inviteTeamMember
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.TEAM_EDIT),
  updateTeamMember
);

router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.TEAM_DEACTIVATE),
  setTeamMemberStatus
);

router.post(
  '/:id/resend-invitation',
  requirePermission(PERMISSIONS.TEAM_INVITE),
  resendInvitation
);

router.post(
  '/:id/refresh-invitation',
  requirePermission(PERMISSIONS.TEAM_VIEW),
  refreshInvitationStatus
);

export default router;