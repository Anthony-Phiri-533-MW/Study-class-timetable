const CACHE_NAME = 'studyapp-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── Notification scheduler ──
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleAll(e.data.schedule);
  }
});

function scheduleAll(schedule) {
  // Clear all existing timers (stored in indexedDB approach not needed;
  // we use periodic background sync or simple setTimeout per session)
  schedule.forEach(item => {
    const now = new Date();
    const target = new Date();
    const [h, m] = item.time.split(':').map(Number);
    target.setHours(h, m, 0, 0);

    // If time already passed today, skip
    if (target <= now) return;

    const delay = target - now;
    setTimeout(() => {
      self.registration.showNotification(item.title, {
        body: item.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: item.tag,
        data: { url: '/' },
        actions: [
          { action: 'open', title: '📖 Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });
    }, delay);
  });
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'open' || !e.action) {
    e.waitUntil(clients.openWindow('/'));
  }
});
