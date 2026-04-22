import React, { useEffect } from 'react';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../utils/logger';

function OneTapInner() {
  const { state, loginWithGoogleCredential } = useAuth();
  
  useGoogleOneTapLogin({
    onSuccess: (cred) => {
      const token = (cred as any)?.credential;
      if (token) void loginWithGoogleCredential(token);
    },
    onError: () => logger.debug("Google One Tap prompt inhibited or failed (likely authorized origin check)"),
    disabled: state.status !== 'anon',
  });

  useEffect(() => {
    if (state.status !== 'anon' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.cancel();
      } catch(e) {
        // ignore
      }
    }
  }, [state.status]);

  return null;
}

export function GlobalOneTap() {
  const [ready, setReady] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => setReady(true));
      } else {
        setReady(true);
      }
    }, 10000); // Wait 10s for absolute stability
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <OneTapInner />;
}
