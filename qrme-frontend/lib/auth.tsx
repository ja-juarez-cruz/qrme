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
  confirmSignUp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USE_MOCK = !process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
const COGNITO_URL = 'https://cognito-idp.us-east-1.amazonaws.com/';

async function cognitoPost(action: string, body: object) {
  const res = await fetch(COGNITO_URL, {
    method: 'POST',
    headers: {
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      'Content-Type': 'application/x-amz-json-1.1',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || 'Error de autenticación');
  return data;
}

function decodeJwt(token: string): Record<string, string> {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('qrme_auth');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('qrme_auth'); }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (USE_MOCK) {
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

    const data = await cognitoPost('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: email, PASSWORD: password },
      ClientId: CLIENT_ID,
    });

    const { AccessToken, IdToken } = data.AuthenticationResult;
    const claims = decodeJwt(IdToken);
    const authUser: AuthUser = { userId: claims.sub, email: claims.email, token: AccessToken };

    setUser(authUser);
    localStorage.setItem('qrme_auth', JSON.stringify(authUser));
    localStorage.setItem('qrme_token', AccessToken);
  };

  const register = async (email: string, password: string) => {
    if (USE_MOCK) {
      return login(email, password);
    }

    await cognitoPost('SignUp', {
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    });

    // Señal para que el UI muestre el paso de confirmación
    throw new Error('CONFIRMATION_REQUIRED');
  };

  const confirmSignUp = async (email: string, code: string) => {
    await cognitoPost('ConfirmSignUp', {
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('qrme_auth');
    localStorage.removeItem('qrme_token');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, confirmSignUp, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
