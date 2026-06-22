import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { authApi } from '../api/endpoints';
import type { AcceptInviteRequest, LoginRequest, RegisterRequest } from '../types';

interface AuthCtx {
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  acceptInvite: (data: AcceptInviteRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ff_token'));

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    localStorage.setItem('ff_token', res.token);
    setToken(res.token);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    localStorage.setItem('ff_token', res.token);
    setToken(res.token);
  }, []);

  const acceptInvite = useCallback(async (data: AcceptInviteRequest) => {
    const res = await authApi.acceptInvite(data);
    localStorage.setItem('ff_token', res.token);
    setToken(res.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ff_token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, register, acceptInvite, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
