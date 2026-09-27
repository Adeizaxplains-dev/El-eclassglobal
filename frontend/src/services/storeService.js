import { api } from './api.js';

export const getStoreInfo = () =>
  api.get('/store');

export const getStoreSettings = () =>
  api.get('/store/admin');

export const updateStoreSettings = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Store settings data is required');
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('At least one store setting is required');
  }

  return api.patch('/store/admin', payload);
};
