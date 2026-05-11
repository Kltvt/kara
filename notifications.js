// ══════════════════════════════════════════════════
//  NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════

let swRegistration = null;

// ── REGISTER SERVICE WORKER ───────────────────────
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return;
  }

  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered ✅");
  } catch (err) {
    console.warn("Service Worker failed:", err);
  }
}

// ── ASK FOR NOTIFICATION PERMISSION ──────────────
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    addLog("SYSTEM", "Notifications not supported in this browser.");
    return false;
  }

  if (Notification.permission === "granted") return true;

  if (Notification.permission === "denied") {
    addLog("SYSTEM", "Notifications blocked. Enable in browser settings.");
    return false;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    addLog("SYSTEM", "Notifications enabled ✅");
    if (typeof speak === "function") speak("Notifications enabled.");
    return true;
  } else {
    addLog("SYSTEM", "Notifications denied.");
    return false;
  }
}

// ── SEND REMINDER TO SERVICE WORKER ──────────────
// This fires even when tab is minimized
function scheduleBackgroundReminder(task, delay) {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({
      type: "REMINDER",
      task,
      delay,
    });
    console.log(`Background reminder set: ${task} in ${delay}ms`);
  }
}

// ── SHOW INSTANT NOTIFICATION ─────────────────────
function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icon.png",
      requireInteraction: true,
    });
  }
}

// ── INIT ──────────────────────────────────────────
async function initNotifications() {
  await registerServiceWorker();
  await requestNotificationPermission();
}
