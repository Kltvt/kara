const CACHE_NAME = "kara-v1";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./voice.js",
  "./notifications.js",
  "./sw.js"
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

// ── FETCH ─────────────────────────────────────────
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
        vibrate: [200, 100, 200],
        requireInteraction: true,
      });
    }, delay);
  }
});

// Click notification → open Kara tab
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});
