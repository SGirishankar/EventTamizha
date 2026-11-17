/* Event Tamizha service worker: makes the app installable and opens it fast, even on a weak connection.
   Pages are always fetched fresh when online (so a new upload shows up at once); the file-named assets
   and photos are kept on the phone. Calls to the Google Script are never touched. */
const CACHE = 'event-tamizha-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fonts, Google Script etc. go straight to the network

  // The page itself: network first, last good copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Only the app page itself is the offline fallback (not terms.html, privacy.html ...).
          if (/\/(index\.html)?$/.test(url.pathname)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); }
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Built files (their names change with every build) and photos: cache first, fill the cache on first use.
  if (/\/(assets|photos|icons)\//.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});

// Tapping a notification (booking update, new job...) opens the app on the right screen.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const hash = (event.notification.data && event.notification.data.url) || '#/';
  const target = new URL(self.registration.scope + hash).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.startsWith(self.registration.scope) && 'focus' in w) {
          if ('navigate' in w) w.navigate(target).catch(() => undefined);
          return w.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
