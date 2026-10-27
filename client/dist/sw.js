// Service Worker for Wappy PWA Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'Notificación de Wappy', body: 'Tienes una actualización en el sistema.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notificación de Wappy', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'assets/icon-192x192.png',
    badge: data.badge || 'assets/favicon-32x32.png',
    data: {
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si hay una pestaña abierta con la app, redirigirla y enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      // Si no, abrir una ventana nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
