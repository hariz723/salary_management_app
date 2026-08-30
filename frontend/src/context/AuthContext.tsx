import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getMe, login as apiLogin, signup as apiSignup } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { email: string; password: string; full_name: string; role?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('acme_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('acme_auth_token');
      if (savedToken) {
        try {
          const userData = await getMe();
          setUser(userData);
          setToken(savedToken);
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('acme_auth_token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem('acme_auth_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const signup = async (payload: { email: string; password: string; full_name: string; role?: string }) => {
    const res = await apiSignup(payload);
    localStorage.setItem('acme_auth_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('acme_auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
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
