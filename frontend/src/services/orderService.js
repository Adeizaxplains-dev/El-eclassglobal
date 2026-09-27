import { api } from './api.js';

export const createOrder = (payload) => api.post('/orders', payload).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);

// --- Admin ---
export const listOrdersAdmin = (params = {}) => api.get('/orders/admin', { params }).then((r) => r.data);
export const updateOrderStatus = (id, payload) => api.patch(`/orders/${id}/status`, payload).then((r) => r.data);
