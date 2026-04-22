import { useEffect } from 'react';
import { subscribeToPush } from '../net/push';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../utils/logger';

/**
 * PushInitializer passively attempts to re-subscribe if permissions
 * are already granted, ensuring the backend always has the latest endpoint.
 */
export function PushInitializer() {
  const { state: authState } = useAuth();

  useEffect(() => {
    // Only attempt if authenticated (not guest) and permission is already granted
    if (authState.user?.uid && authState.status === 'auth' && authState.user.provider !== 'guest') {
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeout = setTimeout(async () => {
          try {
            // Re-subscribe silently to update backend if needed
            await subscribeToPush(authState.token || undefined);
          } catch (e) {
            logger.error('[PushInitializer] Passive re-subscribe failed', e);
          }
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [authState.user?.uid, authState.status]);

  return null;
}
