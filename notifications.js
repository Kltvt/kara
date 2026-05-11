let swRegistration = null;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return;
  }

  try {
    // ✅ Use relative path — works on GitHub Pages
    swRegistration = await navigator.serviceWorker.register("./sw.js");
    console.log("Service Worker registered ✅", swRegistration.scope);
  } catch (err) {
    console.warn("Service Worker failed:", err);
    addLog("SYSTEM", "Background agent unavailable.");
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    addLog("SYSTEM", "Notifications not supported.");
    return false;
  }

  if (Notification.permission === "granted") return true;

  if (Notification.permission === "denied") {
    addLog("SYSTEM", "Notifications blocked. Please enable in browser settings.");
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

function scheduleBackgroundReminder(task, delay) {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({ type: "REMINDER", task, delay });
    console.log(`Background reminder scheduled: "${task}" in ${delay}ms`);
  } else {
    console.warn("Service Worker not ready yet.");
  }
}

function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      requireInteraction: true,
    });
  }
}

async function initNotifications() {
  await registerServiceWorker();
  await requestNotificationPermission();
}
