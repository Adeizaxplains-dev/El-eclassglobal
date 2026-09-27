import { api } from './api.js';

/**
 * Campaign service
 *
 * All campaign API communication lives here.
 * Components should not call axios directly.
 */

export const listCampaigns = (params = {}) =>
  api.get('/campaigns', { params });

export const getCampaign = (campaignId) => {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  return api.get(`/campaigns/${campaignId}`);
};

/**
 * Preview audience for an unsaved campaign.
 *
 * @param {Object} audience
 * @returns {Promise<Object>}
 */
export async function previewAudience(audience = {}) {
  return api.post('/campaigns/audience/preview', {
    audience,
  });
}

export const createCampaign = (payload) =>
  api.post('/campaigns', payload);

export const updateCampaign = (campaignId, payload) => {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  return api.patch(`/campaigns/${campaignId}`, payload);
};

export const previewCampaignAudience = (campaignId) => {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  return api.get(
    `/campaigns/${campaignId}/audience/preview`
  );
};

export const launchCampaign = (campaignId) => {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  return api.post(
    `/campaigns/${campaignId}/launch`
  );
};

export const cancelCampaign = (campaignId) => {
  if (!campaignId) {
    throw new Error('Campaign ID is required');
  }

  return api.post(
    `/campaigns/${campaignId}/cancel`
  );
};
