let swRegistration = null;

// ── REGISTER SERVICE WORKER ───────────────────────
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return;
  }

  try {
    swRegistration = await navigator.serviceWorker.register("/kara/sw.js");
    console.log("Service Worker registered ✅", swRegistration.scope);
  } catch (err) {
    console.warn("Service Worker failed:", err);
    addLog("SYSTEM", "Background agent unavailable.");
  }
}

// ── NOTIFICATION PERMISSION ───────────────────────
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    addLog("SYSTEM", "Notifications not supported.");
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

// ── BACKGROUND REMINDER ───────────────────────────
function scheduleBackgroundReminder(task, delay) {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({ type: "REMINDER", task, delay });
    console.log(`Background reminder scheduled: "${task}" in ${delay}ms`);
  } else {
    console.warn("Service Worker not ready yet.");
  }
}

// ── SHOW NOTIFICATION ─────────────────────────────
function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      requireInteraction: true,
    });
  }
}

// ── PLAY ALERT SOUND (works on mobile) ───────────
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Beep 3 times
    [0, 0.4, 0.8].forEach(startTime => {
      const oscillator = ctx.createOscillator();
      const gainNode   = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type      = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.value  = 1;

      oscillator.start(ctx.currentTime + startTime);
      oscillator.stop(ctx.currentTime + startTime + 0.3);
    });
  } catch (err) {
    console.warn("Audio failed:", err);
  }
}

// ── SPEAK WHEN TAB BECOMES ACTIVE AGAIN ──────────
// Mobile blocks speech in background — so we queue it
// and fire when user comes back to the tab
let pendingSpeak = [];

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && pendingSpeak.length > 0) {
    const task = pendingSpeak.shift();
    setTimeout(() => {
      if (typeof speak === "function") {
        speak(`Reminder! Time to ${task}!`);
        setTimeout(() => speak(`Hey! Time to ${task}!`), 3000);
      }
    }, 500);
  }
});

// ── MOBILE SAFE REMINDER ──────────────────────────
// Call this instead of directly calling speak() for reminders
function fireMobileReminder(task) {
  // 1. Play beep sound (works even on mobile background)
  playAlertSound();

  // 2. Show notification
  showNotification("⏰ Kara Reminder", `Time to ${task}!`);

  // 3. If tab is visible — speak now
  if (document.visibilityState === "visible") {
    if (typeof speak === "function") {
      speak(`Reminder! Time to ${task}!`);
      setTimeout(() => speak(`Hey! Time to ${task}!`), 3000);
    }
  } else {
    // Tab is in background — queue speech for when they return
    pendingSpeak.push(task);
  }
}

// ── INIT ──────────────────────────────────────────
async function initNotifications() {
  await registerServiceWorker();
  await requestNotificationPermission();
}
