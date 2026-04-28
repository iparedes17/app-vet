self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', e => {
  const d = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(d.title || 'PetFlow', {
      body: d.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: d.tag || 'petflow',
      data: d,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(self.location.origin));
});
