import { api } from './api.js';

export const listCustomers = (params = {}) => api.get('/customers', { params }).then((r) => r.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then((r) => r.data);
export const updateCustomer = (id, payload) => api.patch(`/customers/${id}`, payload).then((r) => r.data);
