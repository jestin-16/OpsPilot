import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, type AuthResponse } from '../services/api';

interface AuthContextType {
  user: { id: number; name: string; email: string; roles: string[] } | null;
  token: string | null;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUser = () => {
  try {
    const savedUser = localStorage.getItem('opspilot_user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem('opspilot_user');
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('opspilot_token'));
  const [user, setUser] = useState<{ id: number; name: string; email: string; roles: string[] } | null>(getStoredUser);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('opspilot_token');
    localStorage.removeItem('opspilot_user');
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
    setToken(data.token);
    setUser(userInfo);
  };

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
