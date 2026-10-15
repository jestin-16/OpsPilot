import { createContext, useContext } from 'react';
import type { AuthResponse } from '../services/api';

interface AuthContextType {
  user: { id: number; name: string; email: string; roles: string[] } | null;
  token: string | null;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getStoredUser = () => {
  try {
    const savedUser = localStorage.getItem('opspilot_user');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem('opspilot_user');
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
