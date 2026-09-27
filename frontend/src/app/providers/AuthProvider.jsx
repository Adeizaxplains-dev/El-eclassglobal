import React, { useCallback, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.js';
import * as authService from '../../services/authService.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('uf_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('uf_admin_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('uf_admin_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('uf_admin_token');
    setUser(null);
  }, []);

  const value = { user, loading, isAuthenticated: Boolean(user), login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
