import axios from 'axios';
import { getSessionId } from '../utils/session.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL });

// Every request carries the guest session id (cart/event attribution) and,
// once logged in, the admin bearer token — one interceptor instead of
// repeating this in every service function.
api.interceptors.request.use((config) => {
  config.headers['X-Session-Id'] = getSessionId();

  const token = localStorage.getItem('uf_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Unwraps the backend's { success, data, message } envelope so callers
// just get `data` back, and turns error responses into a normal thrown
// Error with the backend's message attached.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const errors = error.response?.data?.errors || [];
    const status = error.response?.status;

    if (status === 401 && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      localStorage.removeItem('uf_admin_token');
      window.location.href = '/admin/login';
    }

    const err = new Error(message);
    err.errors = errors;
    err.status = status;
    return Promise.reject(err);
  }
);
