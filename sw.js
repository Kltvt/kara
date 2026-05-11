const CACHE_NAME = "kara-v1";

// Files to cache so Kara works offline
const FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/voice.js",
  "/sw.js"
];

// ── INSTALL ───────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// ── ACTIVATE ──────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH (serve from cache) ──────────────────────
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── NOTIFICATIONS ─────────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "REMINDER") {
    const { task, delay } = e.data;

    setTimeout(() => {
      self.registration.showNotification("⏰ Kara Reminder", {
        body: `Time to ${task}!`,
        icon: "/icon.png",
        badge: "/icon.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
      });
    }, delay);
  }
});

// Click on notification → focus the Kara tab
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      for (const client of list) {
        if (client.url.includes("kara") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
