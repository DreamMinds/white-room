// Wird per workbox `importScripts` in den generierten Service Worker gezogen.
// Zeigt die Abend-Warnung auch bei GESCHLOSSENER App. Payload-los: der Server sendet nur dann,
// wenn heute Pflicht-Quests offen sind — deshalb reicht hier eine feste Meldung.
self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('⚠ [SYSTEM-WARNUNG]', {
      body: 'Pflicht-Quests noch offen — der Tag endet bald. Sanktion droht.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'wr-daily-warning',
      renotify: true,
      requireInteraction: true,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    }),
  )
})
