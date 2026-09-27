import { api } from './api.js';

export const listProducts = (params = {}) => api.get('/products', { params }).then((r) => r.data);
export const getProduct = (slug, sessionId) =>
  api.get(`/products/${slug}`, { params: sessionId ? { sessionId } : {} }).then((r) => r.data);

// --- Admin ---
export const listProductsAdmin = (params = {}) => api.get('/products/admin/list', { params }).then((r) => r.data);
export const getLowStockProducts = (threshold) =>
  api.get('/products/admin/low-stock', { params: { threshold } }).then((r) => r.data);
export const getProductAdmin = (id) => api.get(`/products/admin/${id}`).then((r) => r.data);
export const createProduct = (payload) => api.post('/products', payload).then((r) => r.data);
export const updateProduct = (id, payload) => api.patch(`/products/${id}`, payload).then((r) => r.data);
export const archiveProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);
