const CACHE_NAME = "kara-v10";

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

// ✅ ONLY cache github.io files
// NEVER touch API requests — let them go directly
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip ALL external requests — APIs, workers, etc
  if (url.hostname !== "kltvt.github.io") {
    return; // ✅ do nothing — browser handles it directly
  }

  // Only cache local github pages files
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request);
    })
  );
});

// Notifications
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
