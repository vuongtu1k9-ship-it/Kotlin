import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { logger } from '../utils/logger';
import type { AppUser, AuthState } from './auth';
import {
  exchangeGoogleCredential,
  loadToken,
  loginLocal,
  logoutApi,
  registerLocal,
  saveToken,
} from './auth';

import { reconnectSocket } from '../net/socket';

type AuthContextValue = {
  state: AuthState;
  setToken: (token: string | null) => void;
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailPassword: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: loadToken(),
    user: null,
    // Even without a local token, we may have an httpOnly cookie from OAuth redirect.
    status: 'loading',
  }));

  const setToken = useCallback((token: string | null) => {
    saveToken(token);
    reconnectSocket(token);
    setState({ token, user: null, status: token ? 'loading' : 'anon' });
  }, []);

  const logout = useCallback(() => {
    void logoutApi(state.token);
    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.disableAutoSelect();
      } catch (e) {
        logger.warn('Failed to disable Google One Tap auto-select', e);
      }
    }
    setToken(null);
  }, [setToken, state.token]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }));
  }, []);

  const loginWithGoogleCredential = useCallback(async (credential: string) => {
    setState((s) => ({ ...s, status: 'loading' }));
    const data = await exchangeGoogleCredential(credential);
    if (!data?.ok || !data?.token) throw new Error(data?.error || 'LOGIN_FAILED');
    const token = data.token as string;
    const user = (data.user || null) as AppUser | null;
    saveToken(token);
    reconnectSocket(token);
    setState({ token, user, status: 'auth' });
  }, []);

  const loginWithEmailPassword = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, status: 'loading' }));
    const data = await loginLocal(email, password);
    if (!data?.ok || !data?.token) throw new Error(data?.error || 'LOGIN_FAILED');
    const token = data.token as string;
    const user = (data.user || null) as AppUser | null;
    saveToken(token);
    reconnectSocket(token);
    setState({ token, user, status: 'auth' });
  }, []);

  const registerWithEmailPassword = useCallback(async (email: string, password: string, name?: string) => {
    setState((s) => ({ ...s, status: 'loading' }));
    const data = await registerLocal(email, password, name);
    if (!data?.ok || !data?.token) throw new Error(data?.error || 'REGISTER_FAILED');
    const token = data.token as string;
    const user = (data.user || null) as AppUser | null;
    saveToken(token);
    reconnectSocket(token);
    setState({ token, user, status: 'auth' });
  }, []);

  useEffect(() => {
    if (state.status !== 'loading') return;

    let cancelled = false;
    
    // Use standard HTTP for initial verification; it is much more robust for page refreshes
    // than waiting for a socket handshake which might time out.
    import('./auth').then(async ({ fetchMe }) => {
      try {
        const data = await fetchMe(state.token);
        if (cancelled) return;
        
        if (data?.ok && data.user) {
          logger.info('[AuthContext] Session verified via HTTP');
          const token = (data.token || state.token) as string | null;
          if (token && token !== state.token) {
             logger.info('[AuthContext] Picking up token from SSO cookie');
             saveToken(token);
          }
          setState(prev => ({ ...prev, token, user: data.user, status: 'auth' }));
          
          // Trigger push subscription once auth is confirmed and token is in state
          import('../net/push').then(({ subscribeToPush }) => {
            subscribeToPush(token || undefined).catch(() => {});
          });
          return;
        }

        if (data?.error === 'INVALID_TOKEN' || data?.error === 'UNAUTHORIZED') {
          logger.warn('[AuthContext] Session explicitly invalid. Clearing token.');
          saveToken(null);
          setState(prev => ({ ...prev, token: null, user: null, status: 'anon' }));
          return;
        }

        // If it's a generic error (NETWORK, TIMEOUT), we DON'T clear the token.
        // We just default to anonymous for this session to let the app load.
        logger.warn('[AuthContext] Verification failed, defaulting to anonymous. Error:', data?.error);
        setState(prev => ({ ...prev, status: 'anon' }));
      } catch (e) {
        if (cancelled) return;
        logger.error('[AuthContext] HTTP verification failed. Defaulting to anonymous.', e);
        setState(prev => ({ ...prev, status: 'anon' }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [state.status]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      setToken,
      loginWithGoogleCredential,
      loginWithEmailPassword,
      registerWithEmailPassword,
      logout,
      refresh,
    }),
    [
      state,
      setToken,
      loginWithGoogleCredential,
      loginWithEmailPassword,
      registerWithEmailPassword,
      logout,
      refresh,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
