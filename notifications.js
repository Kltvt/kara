let swRegistration = null;

// ── REGISTER SERVICE WORKER ───────────────────────
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register("/kara/sw.js");
    console.log("Service Worker registered ✅", swRegistration.scope);
  } catch (err) {
    console.warn("Service Worker failed:", err);
  }
}

// ── NOTIFICATION PERMISSION ───────────────────────
async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// ── BACKGROUND REMINDER ───────────────────────────
function scheduleBackgroundReminder(task, delay) {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({ type: "REMINDER", task, delay });
  }
}

// ── SHOW NOTIFICATION ─────────────────────────────
function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body, requireInteraction: true });
  }
}

// ══════════════════════════════════════════════════
//  ALARM SOUND SYSTEM
//  Works on mobile even in background
// ══════════════════════════════════════════════════

let alarmInterval  = null;
let audioCtx       = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (mobile requires this)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Single beep
function playBeep(frequency = 880, duration = 0.3, volume = 1) {
  try {
    const ctx        = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode   = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type            = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Beep failed:", err);
  }
}

// Alarm — keeps beeping every second until stopped
function startAlarm() {
  stopAlarm(); // clear any existing alarm

  // Beep immediately
  playBeep(880, 0.3, 1);

  // Keep beeping every 1.5 seconds
  alarmInterval = setInterval(() => {
    playBeep(880, 0.3, 1);
    setTimeout(() => playBeep(660, 0.2, 0.8), 400);
  }, 1500);

  // Auto stop after 30 seconds
  setTimeout(stopAlarm, 30000);
}

function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

// ══════════════════════════════════════════════════
//  MOBILE SAFE REMINDER FIRE
// ══════════════════════════════════════════════════

function fireMobileReminder(task) {
  // 1. Start beeping alarm (works on mobile)
  startAlarm();

  // 2. Show notification
  showNotification("⏰ Kara Reminder", `Time to ${task}!`);

  // 3. Speak if tab visible
  if (document.visibilityState === "visible") {
    if (typeof speak === "function") {
      speak(`Reminder! Time to ${task}!`);
      setTimeout(() => speak(`Hey! Time to ${task}!`), 3000);
    }
  }

  // 4. When user comes back to tab — speak
  const onVisible = () => {
    if (document.visibilityState === "visible") {
      if (typeof speak === "function") {
        setTimeout(() => speak(`You have a reminder! ${task}!`), 300);
      }
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
  document.addEventListener("visibilitychange", onVisible);
}

// ── INIT ──────────────────────────────────────────
async function initNotifications() {
  await registerServiceWorker();
  const granted = await requestNotificationPermission();
  if (granted) {
    addLog("SYSTEM", "Notifications enabled ✅");
  }
}
