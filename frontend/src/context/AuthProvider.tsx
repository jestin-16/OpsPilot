import React, { useEffect, useState } from 'react';
import { api, type AuthResponse } from '../services/api';
import { AuthContext, getStoredUser } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('opspilot_token'));
  const [user, setUser] = useState<{ id: number; name: string; email: string; roles: string[] } | null>(getStoredUser);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('opspilot_token');
    localStorage.removeItem('opspilot_user');
    localStorage.removeItem('opspilot_has_session');

    setToken(null);
    setUser(null);
  };

  const login = (data: AuthResponse) => {
    localStorage.setItem('opspilot_token', data.token);
    const userInfo = {
      id: data.id,
      name: data.name,
      email: data.email,
      roles: data.roles,
    };
    localStorage.setItem('opspilot_user', JSON.stringify(userInfo));
    localStorage.setItem('opspilot_has_session', 'true');
    setToken(data.token);
    setUser(userInfo);
  };

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const hasSession = localStorage.getItem('opspilot_has_session') === 'true';
      if (!hasSession) {
        if (active) setIsSessionLoading(false);
        return;
      }

      try {
        const data = await api.refreshSession();
        if (active) login(data);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setIsSessionLoading(false);
      }
    };

    void restoreSession();
    return () => { active = false; };
  }, []);

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token && !!user, isSessionLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
