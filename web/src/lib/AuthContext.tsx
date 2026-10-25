'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthResponse } from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/v1`
  : 'http://127.0.0.1:8000/api/v1';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role?: string,
    wardId?: string,
    agreedToTerms?: boolean
  ) => Promise<{ success: boolean; error?: string; verificationToken?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; demoToken?: string }>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Initialize and validate stored session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('nirvana_auth_token');
        const storedUser = localStorage.getItem('nirvana_auth_user');

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          // Validate token with backend /auth/me
          try {
            const res = await fetch(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              localStorage.setItem('nirvana_auth_user', JSON.stringify(data.user));
            } else if (res.status === 401) {
              // Expired or invalid token
              localStorage.removeItem('nirvana_auth_token');
              localStorage.removeItem('nirvana_auth_user');
              setUser(null);
              setToken(null);
            }
          } catch {
            // Backend offline: keep local session
          }
        }
      } catch (e) {
        console.error('Failed to parse auth from storage:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me: rememberMe })
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.detail || 'Sign-in failed. Please verify your credentials.';
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('nirvana_auth_token', data.token);
      localStorage.setItem('nirvana_auth_user', JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = 'Unable to connect to authentication server. Please check your network connection.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: string = 'citizen',
    wardId: string = 'ward-72',
    agreedToTerms: boolean = true
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          confirm_password: confirmPassword,
          role,
          ward_id: wardId,
          agreed_to_terms: agreedToTerms
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = Array.isArray(data.detail) ? data.detail[0]?.msg : (data.detail || 'Registration failed.');
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('nirvana_auth_token', data.token);
      localStorage.setItem('nirvana_auth_user', JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true, verificationToken: data.verification_token };
    } catch (err: any) {
      const msg = 'Unable to connect to authentication server. Please check your network connection.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
    localStorage.removeItem('nirvana_auth_token');
    localStorage.removeItem('nirvana_auth_user');
    setUser(null);
    setToken(null);
    setError(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Could not process password recovery.' };
      }
      return { success: true, message: data.message, demoToken: data.demo_reset_token };
    } catch {
      return { success: false, message: 'Network error contacting password recovery service.' };
    }
  };

  const resetPassword = async (tokenStr: string, newPassword: string, confirmPassword: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenStr,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Password reset failed.' };
      }
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Network error contacting password reset service.' };
    }
  };

  const verifyEmail = async (tokenStr: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Email verification failed.' };
      }
      if (user) {
        setUser({ ...user, is_verified: true });
      }
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Network error verifying email.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        clearError,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail
      }}
    >
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
