import { api } from './api.js';

/**
 * Analytics API service
 *
 * All values are fetched from the backend/database.
 * No dashboard statistics are calculated or hardcoded here.
 */

export const getOverview = () =>
  api.get('/analytics/overview').then((response) => response.data);

export const getSalesOverTime = (days = 30) =>
  api
    .get('/analytics/sales', {
      params: { days },
    })
    .then((response) => response.data);

export const getTopProducts = (limit = 10) =>
  api
    .get('/analytics/top-products', {
      params: { limit },
    })
    .then((response) => response.data);

export const getAcquisitionSources = () =>
  api
    .get('/analytics/acquisition-sources')
    .then((response) => response.data);

export const getConversionFunnel = (days = 30) =>
  api
    .get('/analytics/funnel', {
      params: { days },
    })
    .then((response) => response.data);