import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { DineIQApi } from '../api/DineIQApi';
import type { AuthSession, Role } from '../api/types';

interface AuthCtx {
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  role: Role | null;
  canExport: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

const SESSION_KEY = 'dineiq.session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await DineIQApi.getSession();
        if (alive) setSession(s);
      } catch {
        if (alive) setSession(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await DineIQApi.login(email, password);
    setSession(s);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const logout = useCallback(async () => {
    await DineIQApi.logout();
    setSession(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    session,
    loading,
    login,
    logout,
    role: session?.user.role ?? null,
    canExport: session ? ['administrator', 'regional_manager', 'analyst'].includes(session.user.role) : false,
  }), [session, loading, login, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
