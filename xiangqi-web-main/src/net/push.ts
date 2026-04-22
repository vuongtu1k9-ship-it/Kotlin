import { API_URL, AUTH_TOKEN_KEY } from '../auth/auth';
import { logger } from '../utils/logger';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Fetches the VAPID public key from the server (never hardcoded in client). */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/push/vapid-key`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? data.key : null;
  } catch {
    return null;
  }
}

export async function subscribeToPush(token?: string): Promise<{ ok: boolean; error?: string }> {
  if (!('serviceWorker' in navigator)) return { ok: false, error: 'NO_SW' };
  if (!('PushManager' in window)) return { ok: false, error: 'NO_PUSH_MANAGER' };

  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) {
    logger.debug('[Push] VAPID public key not available from server.');
    return { ok: false, error: 'NO_VAPID_KEY' };
  }

  const registration = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    try {
      const existingKey = subscription.options?.applicationServerKey;
      const existingKeyBase64 = existingKey
        ? btoa(String.fromCharCode(...new Uint8Array(existingKey as ArrayBuffer)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        : null;
      if (existingKeyBase64 !== vapidPublicKey.replace(/=/g, '')) {
        await subscription.unsubscribe();
        subscription = null;
      }
    } catch (e) {
      if (subscription) await subscription.unsubscribe().catch(() => {});
      subscription = null;
    }
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  if (!subscription) return { ok: false, error: 'SUBSCRIPTION_FAILED' };

  const authToken = token || localStorage.getItem(AUTH_TOKEN_KEY);
  if (!authToken) return { ok: false, error: 'NO_TOKEN' };

  const response = await fetch(`${API_URL}/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ subscription }),
  });

  const result = await response.json().catch(() => ({ ok: false }));
  if (result.ok) {
    logger.info('[Push] ✅ Subscription saved successfully.');
  }
  return result;
}
