import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../utils/logger';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleOneTap() {
  const { state, loginWithGoogleCredential } = useAuth();
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || __GOOGLE_CLIENT_ID__ || '').trim();
  const initialized = useRef(false);

  useEffect(() => {
    if (state.status !== 'anon' || !clientId || initialized.current) return;

    const handleCredentialResponse = async (response: any) => {
      try {
        logger.log('[OneTap] Received credential');
        await loginWithGoogleCredential(response.credential);
        logger.log('[OneTap] Login successful');
      } catch (e) {
        logger.error('[OneTap] Auth failed', e);
      }
    };

    const initializeOneTap = () => {
      if (!window.google || initialized.current) return;
      
      try {
        initialized.current = true;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
        });
        
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            logger.warn('[OneTap] Prompt not displayed:', reason);
            // Only allow retry for specific temporary reasons
            if (reason === 'suppressed_by_user' || reason === 'opt_out_or_no_session') {
               // Keep initialized=true to prevent spamming
            } else {
               initialized.current = false; 
            }
          } else if (notification.isSkippedMoment()) {
            logger.warn('[OneTap] Skipped moment:', notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
            logger.warn('[OneTap] Dismissed moment:', notification.getDismissedReason());
          }
        });
      } catch (err) {
        logger.error('[OneTap] Initialization error:', err);
        initialized.current = false;
      }
    };

    // Increase delay to ensure DOM and other auth checks are stable
    const timer = setTimeout(initializeOneTap, 3500);
    return () => {
      clearTimeout(timer);
      // We don't reset initialized.current on unmount to prevent re-prompting 
      // if component re-renders but still in anon status
    };
  }, [state.status, clientId]);

  return null;
}
