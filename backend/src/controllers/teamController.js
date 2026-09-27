import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as teamService from '../services/teamService.js';

export const listTeamMembers = catchAsync(async (req, res) => {
  const result = await teamService.listTeamMembers(
    req.user,
    req.query
  );

  sendSuccess(res, {
    data: result,
  });
});

export const listDefaultJobRoles = catchAsync(async (req, res) => {
  const roles = await teamService.listDefaultJobRoles();

  sendSuccess(res, {
    data: roles,
  });
});

export const getTeamMember = catchAsync(async (req, res) => {
  const member = await teamService.getTeamMember(
    req.user,
    req.params.id
  );

  sendSuccess(res, {
    data: member,
  });
});

export const inviteTeamMember = catchAsync(async (req, res) => {
  const result = await teamService.inviteTeamMember(
    req.user,
    req.body
  );

  sendSuccess(res, {
    data: result,
    message: 'Team member invitation created successfully',
  });
});

export const updateTeamMember = catchAsync(async (req, res) => {
  const member = await teamService.updateTeamMember(
    req.user,
    req.params.id,
    req.body
  );

  sendSuccess(res, {
    data: member,
    message: 'Team member updated successfully',
  });
});

export const setTeamMemberStatus = catchAsync(async (req, res) => {
  const member = await teamService.setTeamMemberStatus(
    req.user,
    req.params.id,
    req.body.isActive
  );

  sendSuccess(res, {
    data: member,
    message: 'Team member status updated successfully',
  });
});

export const resendInvitation = catchAsync(async (req, res) => {
  const result = await teamService.resendInvitation(
    req.user,
    req.params.id
  );

  sendSuccess(res, {
    data: result,
    message: 'Invitation resent successfully',
  });
});

export const refreshInvitationStatus = catchAsync(async (req, res) => {
  const member = await teamService.refreshInvitationStatus(
    req.user,
    req.params.id
  );

  sendSuccess(res, {
    data: member,
  });
});