self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    try {
      const parsed = event.data ? event.data.json() : {};
      const pushTitle = parsed.title || 'Cờ tướng Online';
      const options = {
        body: parsed.body || parsed.message || 'Bạn có thông báo mới!',
        icon: parsed.icon || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
          url: (parsed.data && parsed.data.url) || parsed.url || parsed.link || '/'
        },
        actions: [
          { action: 'open', title: 'Xem ngay' },
          { action: 'close', title: 'Đóng' }
        ]
      };

      // Try to show notification explicitly
      await self.registration.showNotification(pushTitle, options);

      // Report success back to our audit endpoint
      await fetch('/api/push/received-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SHOW_SUCCESS', timestamp: Date.now(), url: options.data.url })
      }).catch(() => {});

    } catch (error) {
      // If showNotification or JSON parse fails, report the exact error!
      await fetch('/api/push/received-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: `SHOW_ERROR: ${error.message}`, timestamp: Date.now(), url: '/' })
      }).catch(() => {});
      console.error('Push error:', error);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // data is now { url: '/path' }
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          if (client.navigate) client.navigate(fullUrl);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
