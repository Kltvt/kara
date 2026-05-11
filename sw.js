const CACHE_NAME = "kara-v9";

const FILES = [
  "/kara/",
  "/kara/index.html",
  "/kara/style.css",
  "/kara/app.js",
  "/kara/voice.js",
  "/kara/notifications.js",
  "/kara/profile.js",
  "/kara/sw.js"
];

// ── INSTALL ───────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES).catch(err => {
        console.warn("Cache failed:", err);
      });
    })
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
// Only cache local files — never API calls
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip all API/external requests — let them go direct
  if (!url.origin.includes("github.io")) {
    return;
  }

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

// Click notification → focus Kara tab
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/kara/");
    })
  );
});
