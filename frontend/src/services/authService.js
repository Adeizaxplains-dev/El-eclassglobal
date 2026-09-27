import { api } from './api.js';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
  api
    .patch('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    .then((r) => r.data);