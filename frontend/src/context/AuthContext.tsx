import React, { createContext, useContext, useState } from 'react';
import type { AuthResponse } from '../services/api';

interface AuthContextType {
  user: { id: number; name: string; email: string; roles: string[] } | null;
  token: string | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('opspilot_token'));
  const [user, setUser] = useState<{ id: number; name: string; email: string; roles: string[] } | null>(() => {
    const savedUser = localStorage.getItem('opspilot_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

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

  const logout = () => {
    localStorage.removeItem('opspilot_token');
    localStorage.removeItem('opspilot_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
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
