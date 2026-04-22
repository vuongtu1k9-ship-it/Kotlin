/**
 * Shows a browser Notification if permission is granted and the tab is hidden.
 * Use this for events received via WebSocket so users are alerted even when not looking.
 */
export function showBrowserNotification(
  title: string,
  options: { body?: string; icon?: string; url?: string; force?: boolean } = {}
) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // Only show if tab is hidden, unless force=true
  if (!options.force && document.visibilityState === 'visible') return;

  const notif = new Notification(title, {
    body: options.body || '',
    icon: options.icon || '/favicon.ico',
    badge: '/favicon.ico',
  });

  if (options.url) {
    notif.onclick = () => {
      window.focus();
      notif.close();
      // Navigate within SPA if possible
      window.history.pushState(null, '', options.url!);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
  }

  // Auto-close after 8s
  setTimeout(() => notif.close(), 8000);
}
