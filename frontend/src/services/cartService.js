import { api } from './api.js';

export const getCart = () => api.get('/cart').then((r) => r.data);
export const addCartItem = (payload, attribution = {}) =>
  api.post('/cart/items', payload, { params: attribution }).then((r) => r.data);
export const updateCartItem = (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }).then((r) => r.data);
export const removeCartItem = (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data);
