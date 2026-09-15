// Service Worker Web Push Extension
// Listens for background push notifications even when the PWA/browser is completely closed.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'Andrés Cordero • Recordatorio',
      body: event.data.text(),
    };
  }

  const title = payload.title || 'Andrés Cordero • Notificación';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/assets/ac-website-icon-192.png',
    data: payload.data || { url: '/admin/panel' },
    tag: payload.tag || `ac-push-${Date.now()}`,
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch(() => {
      // Fallback a notificación mínima garantizada para compatibilidad estricta de iOS WebKit
      return self.registration.showNotification(title, {
        body: payload.body || '',
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/admin/panel/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
