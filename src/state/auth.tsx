import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ORDERS } from '../data/config';
import { callApi } from './api';
import { forgetDevice } from '../native/push';

export type Role = 'Customer' | 'Provider' | 'Admin';
export type User = {
  name: string;
  mobile: string;
  role?: Role; // missing on sessions saved by older versions of the site = Customer
  business?: string;
  services?: string[];
  tier?: string;
  lat?: number | null;
  lng?: number | null;
  /** saved location: a customer's default venue / a provider's base */
  address?: string;
  mapLink?: string;
};

/** What the profile page can change. Only a customer can change the mobile number (needs the current password). */
export type ProfilePatch = {
  name?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  mapLink?: string;
  newMobile?: string;
  password?: string;
};

export const roleOf = (u: User | null): Role | null => (u ? u.role ?? 'Customer' : null);
/** Admins and service providers only use their own dashboard; they never see the customer booking pages. */
export const isStaff = (u: User | null): boolean => roleOf(u) === 'Admin' || roleOf(u) === 'Provider';
/** Where each kind of user lands after logging in. */
export const homeFor = (u: User | null): string => (roleOf(u) === 'Admin' ? '/admin' : roleOf(u) === 'Provider' ? '/provider' : '/orders');
type Saved = { token: string; user: User };
export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

type Ctx = {
  /** false when no backend URL is configured (demo mode) */
  enabled: boolean;
  user: User | null;
  token: string | null;
  login: (mobile: string, password: string) => Promise<AuthResult>;
  /** e-mails a 6-digit code (OTP) to the customer; the account is created by register() once the code is entered */
  sendOtp: (name: string, mobile: string, email: string) => Promise<{ ok: true; sentTo: string } | { ok: false; error: string }>;
  register: (name: string, mobile: string, password: string, email: string, otp: string) => Promise<AuthResult>;
  /** forgot password: e-mails a code to the address saved on the account, then resetPassword() saves the new password and signs in */
  sendResetOtp: (mobile: string) => Promise<{ ok: true; sentTo: string } | { ok: false; error: string }>;
  resetPassword: (mobile: string, otp: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  /** save changes to the signed-in user's profile; the signed-in user is updated on success */
  updateProfile: (patch: ProfilePatch) => Promise<AuthResult>;
  /** permanently delete the signed-in customer's account (password required) and sign out */
  deleteAccount: (password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** call when the server says the session is no longer valid */
  expire: () => void;
};

const KEY = 'event360-auth-v1';

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    return s?.token && s?.user?.mobile ? s : null;
  } catch {
    return null;
  }
}

function save(s: Saved | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the session just lasts until the tab closes */
  }
}

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = Boolean(ORDERS.url);
  const [saved, setSaved] = useState<Saved | null>(() => (enabled ? load() : null));

  const set = useCallback((s: Saved | null) => {
    setSaved(s);
    save(s);
  }, []);

  // Quietly confirm a remembered session is still valid (it expires after 30 days or when logged out elsewhere).
  useEffect(() => {
    if (!saved) return;
    let live = true;
    callApi<{ user: User }>({ action: 'me', token: saved.token }).then((r) => {
      if (!live) return;
      if (r.ok) set({ token: saved.token, user: r.user });
      else if (r.error === 'INVALID_SESSION') set(null);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(async (body: Record<string, unknown>): Promise<AuthResult> => {
    const r = await callApi<{ token: string; user: User }>(body);
    if (!r.ok) return { ok: false, error: r.error };
    set({ token: r.token, user: r.user });
    return { ok: true, user: r.user };
  }, [set]);

  const value = useMemo<Ctx>(() => ({
    enabled,
    user: saved?.user ?? null,
    token: saved?.token ?? null,
    login: (mobile, password) => finish({ action: 'login', mobile, password }),
    sendOtp: async (name, mobile, email) => {
      const r = await callApi<{ sentTo?: string }>({ action: 'sendOtp', name, mobile, email });
      return r.ok ? { ok: true, sentTo: r.sentTo || email } : { ok: false, error: r.error };
    },
    register: (name, mobile, password, email, otp) => finish({ action: 'register', name, mobile, password, email, otp }),
    sendResetOtp: async (mobile) => {
      const r = await callApi<{ sentTo?: string }>({ action: 'sendResetOtp', mobile });
      return r.ok ? { ok: true, sentTo: r.sentTo || '' } : { ok: false, error: r.error };
    },
    resetPassword: (mobile, otp, password) => finish({ action: 'resetPassword', mobile, otp, password }),
    logout: () => {
      if (saved) void forgetDevice(saved.token).catch(() => undefined).then(() => callApi({ action: 'logout', token: saved.token }));
      set(null);
    },
    deleteAccount: async (password) => {
      if (!saved) return { ok: false, error: 'INVALID_SESSION' };
      const r = await callApi({ action: 'deleteAccount', token: saved.token, password });
      if (!r.ok) return { ok: false, error: r.error };
      set(null);
      return { ok: true };
    },
    updateProfile: async (patch) => {
      if (!saved) return { ok: false, error: 'INVALID_SESSION' };
      const r = await callApi<{ user: User }>({ action: 'updateProfile', token: saved.token, ...patch });
      if (!r.ok) return { ok: false, error: r.error };
      set({ token: saved.token, user: r.user });
      return { ok: true, user: r.user };
    },
    expire: () => set(null),
  }), [enabled, saved, finish, set]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
