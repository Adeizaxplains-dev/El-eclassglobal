import { api } from './api.js';

export const listTeamMembers = (params = {}) =>
  api.get('/team', {
    params,
  });

export const getTeamMember = (memberId) => {
  if (!memberId) {
    throw new Error('Team member ID is required');
  }

  return api.get(`/team/${memberId}`);
};

export const listDefaultJobRoles = () =>
  api.get('/team/roles');

export const inviteTeamMember = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Team member invitation data is required');
  }

  return api.post('/team/invite', payload);
};

export const updateTeamMember = (memberId, payload = {}) => {
  if (!memberId) {
    throw new Error('Team member ID is required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Team member update data is required');
  }

  return api.patch(`/team/${memberId}`, payload);
};

export const setTeamMemberStatus = (memberId, payload = {}) => {
  if (!memberId) {
    throw new Error('Team member ID is required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Team member status data is required');
  }

  return api.patch(`/team/${memberId}/status`, payload);
};

export const resendInvitation = (memberId) => {
  if (!memberId) {
    throw new Error('Team member ID is required');
  }

  return api.post(`/team/${memberId}/resend-invitation`);
};

export const refreshInvitationStatus = (memberId) => {
  if (!memberId) {
    throw new Error('Team member ID is required');
  }

  return api.post(`/team/${memberId}/refresh-invitation`);
};