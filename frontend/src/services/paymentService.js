import { api } from './api.js';

export const initializePayment = (orderId, sessionId) =>
  api.post('/payments/initialize', { orderId, sessionId }).then((r) => r.data);
export const verifyPayment = (reference) => api.get(`/payments/${reference}/verify`).then((r) => r.data);
