export type AppUser = {
  uid: string;
  provider: 'google' | 'guest' | 'local';
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  sysRole?: 'admin' | 'moderator' | 'user';
  inventory?: {
    coins: number;
    ring: number;
    bear: number;
    candy: number;
    [key: string]: number;
  };
  learningProgress?: Record<string, any>;
  lastDailyRewardAt?: number;
  loginStreak?: number;
  dailyGiftsSent?: number;
  lastGiftResetAt?: number;
};

export type AuthState = {
  token: string | null;
  user: AppUser | null;
  status: 'anon' | 'auth' | 'loading';
};

// Use centralized API for all subdomains to simplify logic
export const API_URL =
    import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : "https://api.cotuong.xyz/api");

// Use centralized WebSocket hub for all subdomains
export const SOCKET_URL =
  // @ts-ignore
    import.meta.env.VITE_SOCKET_URL || 
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : "https://ws.cotuong.xyz");

export const AUTH_TOKEN_KEY = 'xq:token';

import { logger } from '../utils/logger';

export function loadToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    logger.debug('[AUTH] loadToken failed', e);
    return null;
  }
}

export function saveToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(AUTH_TOKEN_KEY);
    else localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (e) {
    logger.debug('[AUTH] saveToken failed', e);
  }
}

export async function exchangeGoogleCredential(credential: string) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  return res.json();
}

export async function registerLocal(email: string, password: string, name?: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  return res.json();
}

export async function loginLocal(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function fetchMe(token?: string | null) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/auth/me`, {
    headers,
    credentials: 'include',
  });
  return res.json();
}

export async function guestToken() {
  const res = await fetch(`${API_URL}/auth/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
  });
  return res.json();
}

export async function logoutApi(token?: string | null) {
  try {
    const headers: Record<string, string> = {};
    if (token) headers.authorization = `Bearer ${token}`;
    await fetch(`${API_URL}/auth/logout`, { 
      method: 'POST', 
      headers,
      credentials: 'include' 
    });
  } catch (e) {
    logger.debug('[AUTH] logoutApi failed', e);
  }
}

export async function fetchUserSummary(uid: string) {
  const res = await fetch(`${API_URL}/users/${uid}/summary`, { credentials: 'include' });
  return res.json();
}
