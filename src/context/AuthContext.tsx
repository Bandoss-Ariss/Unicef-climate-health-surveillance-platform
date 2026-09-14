import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Authentification du prototype.
 * Un seul compte de démonstration (coordination UNICEF BF). En production :
 * SSO UNICEF (Azure AD / OIDC) + rôles MSPS / DRS / district.
 */
const DEMO_ACCOUNTS: Record<string, { password: string; name: string; role: { fr: string; en: string } }> = {
  'rnakoiri@unicef.org': { password: '12345678', name: 'Roger Nakoiri', role: { fr: 'Coordination · Bureau pays UNICEF BF', en: 'Coordination · UNICEF BF Country Office' } },
};

export interface AuthUser { email: string; name: string; initials: string; role: { fr: string; en: string }; loginAt: string }

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const KEY = 'unicef-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { const raw = sessionStorage.getItem(KEY); return raw ? (JSON.parse(raw) as AuthUser) : null; } catch { return null; }
  });

  const login = (email: string, password: string) => {
    const key = email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS[key];
    if (!account || account.password !== password) return false;
    const u: AuthUser = {
      email: key, name: account.name, role: account.role, loginAt: new Date().toISOString(),
      initials: account.name.split(/[\s.]+/).filter(Boolean).map(s => s[0]).join('').slice(0, 2).toUpperCase(),
    };
    setUser(u);
    try { sessionStorage.setItem(KEY, JSON.stringify(u)); } catch { /* stockage indisponible */ }
    return true;
  };

  const logout = () => {
    setUser(null);
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
