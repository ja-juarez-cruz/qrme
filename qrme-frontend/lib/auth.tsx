/**
 * QR.me — Auth helpers.
 * Wraps Cognito auth with a simple mock mode for local dev.
 */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  userId: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USE_MOCK = !process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('qrme_auth');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('qrme_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (USE_MOCK) {
      // Mock login
      const mockUser: AuthUser = {
        userId: 'mock-user-' + email.split('@')[0],
        email,
        token: 'mock-jwt-token-' + Date.now(),
      };
      setUser(mockUser);
      localStorage.setItem('qrme_auth', JSON.stringify(mockUser));
      localStorage.setItem('qrme_token', mockUser.token);
      return;
    }

    // Real Cognito auth would go here via AWS Amplify
    throw new Error('Configure NEXT_PUBLIC_COGNITO_USER_POOL_ID for real auth');
  };

  const register = async (email: string, password: string) => {
    if (USE_MOCK) {
      // Mock register = same as login
      return login(email, password);
    }
    throw new Error('Configure NEXT_PUBLIC_COGNITO_USER_POOL_ID for real auth');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('qrme_auth');
    localStorage.removeItem('qrme_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
