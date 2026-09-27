import { api } from './api.js';

export const getAutomationOverview = () =>
  api.get('/automations/overview');

export const listAutomations = (params = {}) =>
  api.get('/automations', { params });

export const getAutomation = (automationId) => {
  if (!automationId) {
    throw new Error('Automation ID is required');
  }

  return api.get(`/automations/${automationId}`);
};

export const cancelAutomation = (automationId) => {
  if (!automationId) {
    throw new Error('Automation ID is required');
  }

  return api.patch(`/automations/${automationId}/cancel`);
};

export const retryAutomation = (automationId) => {
  if (!automationId) {
    throw new Error('Automation ID is required');
  }

  return api.patch(`/automations/${automationId}/retry`);
};