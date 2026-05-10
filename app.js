const input    = document.getElementById("userInput");
const sendBtn  = document.getElementById("sendBtn");
const log      = document.getElementById("log");
const statusEl = document.getElementById("status");
const orb      = document.getElementById("orb");

const API_URL = "https://budy-ai.klt770586.workers.dev";
const MODEL   = "nvidia/nemotron-3-super-120b-a12b:free";

const history = [];

// ── CLOCK ──────────────────────────────────────────
function updateTime() {
  const el = document.getElementById("time");
  if (el) el.textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

// ── STATE ─────────────────────────────────────────
function setState(text, color) {
  statusEl.textContent = text;
  orb.style.borderColor = color;
  orb.style.boxShadow   = `0 0 40px ${color}, inset 0 0 40px ${color}33`;
}

// ── LOG ───────────────────────────────────────────
function addLog(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// ══════════════════════════════════════════════════
//  MEMORY
// ══════════════════════════════════════════════════

function saveHistory() {
  localStorage.setItem("kara_history", JSON.stringify(history));
}

function loadHistory() {
  const saved = localStorage.getItem("kara_history");
  if (!saved) return;

  const messages = JSON.parse(saved);
  history.push(...messages);

  const recent = messages.slice(-20);
  recent.forEach(msg => {
    addLog(msg.role === "user" ? "YOU" : "KARA", msg.content);
  });

  addLog("SYSTEM", `Memory restored — ${messages.length} messages loaded.`);
}

function clearMemory() {
  history.length = 0;
  localStorage.removeItem("kara_history");
  localStorage.removeItem("kara_tasks");
  localStorage.removeItem("kara_reminders");
  log.innerHTML = "";
  addLog("SYSTEM", "Memory cleared.");
  if (typeof speak === "function") speak("Memory cleared.");
}

// ══════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════

function bootSequence() {
  addLog("SYSTEM", "Initializing Kara...");
  setTimeout(() => addLog("SYSTEM", "Voice systems loading..."), 800);
  setTimeout(() => addLog("SYSTEM", "Neural core active..."),   1600);
  setTimeout(() => addLog("SYSTEM", "Restoring memory..."),     2000);
  setTimeout(() => {
    loadHistory();
    restoreReminders();
    addLog("SYSTEM", "Kara ready.");
    setState("READY", "#00e5ff");
    if (typeof speak === "function") speak("Kara online.");
  }, 2400);
}

// ══════════════════════════════════════════════════
//  TASKS
// ══════════════════════════════════════════════════

function getTasks() {
  return JSON.parse(localStorage.getItem("kara_tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("kara_tasks", JSON.stringify(tasks));
}

function addTask(task) {
  const tasks = getTasks();
  tasks.push({ task, done: false });
  saveTasks(tasks);
  addLog("KARA", `Task added ✅ — ${task}`);
  if (typeof speak === "function") speak(`Task added: ${task}`);
}

function showTasks() {
  const tasks = getTasks();
  if (tasks.length === 0) {
    addLog("KARA", "No tasks found.");
    return;
  }
  addLog("KARA", `You have ${tasks.length} task(s):`);
  tasks.forEach((t, i) => {
    addLog("TASK", `${i + 1}. ${t.task}`);
  });
}

function clearTasks() {
  localStorage.removeItem("kara_tasks");
  addLog("KARA", "All tasks cleared.");
  if (typeof speak === "function") speak("All tasks cleared.");
}

// ══════════════════════════════════════════════════
//  REMINDERS
// ══════════════════════════════════════════════════

function setReminder(task, delay) {
  const reminders = JSON.parse(localStorage.getItem("kara_reminders")) || [];
  reminders.push({ task, fireAt: Date.now() + delay });
  localStorage.setItem("kara_reminders", JSON.stringify(reminders));

  scheduleReminder(task, delay);
  addLog("KARA", `Reminder set ⏰ — "${task}"`);
  if (typeof speak === "function") speak(`Reminder set for ${task}`);
}

function scheduleReminder(task, delay) {
  setTimeout(() => {
    setState("REMINDER", "#ff4d6d");
    addLog("⏰ REMINDER", `Time to ${task}!`);

    if (typeof speak === "function") {
      speak(`Reminder! Time to ${task}!`);
      setTimeout(() => speak(`Hey! Time to ${task}!`), 3000);
      setTimeout(() => speak(`Don't forget! ${task}!`), 6000);
    }

    setTimeout(() => setState("READY", "#00e5ff"), 5000);
  }, delay);
}

function restoreReminders() {
  const reminders = JSON.parse(localStorage.getItem("kara_reminders")) || [];
  const now = Date.now();
  const active = [];

  reminders.forEach(r => {
    const delay = r.fireAt - now;
    if (delay > 0) {
      scheduleReminder(r.task, delay);
      active.push(r);
      addLog("SYSTEM", `Reminder restored — "${r.task}"`);
    }
  });

  localStorage.setItem("kara_reminders", JSON.stringify(active));
}

// ══════════════════════════════════════════════════
//  COMMAND SYSTEM
// ══════════════════════════════════════════════════

function runCommand(message) {
  const cmd = message.toLowerCase().trim();

  if (cmd === "time") {
    const now = new Date().toLocaleTimeString();
    addLog("KARA", `Current time is ${now}`);
    if (typeof speak === "function") speak(`The time is ${now}`);
    return true;
  }

  if (cmd === "date") {
    const today = new Date().toDateString();
    addLog("KARA", `Today is ${today}`);
    if (typeof speak === "function") speak(`Today is ${today}`);
    return true;
  }

  if (cmd === "clear") {
    clearMemory();
    return true;
  }

  if (cmd === "shutdown") {
    addLog("SYSTEM", "Kara shutting down...");
    setState("OFFLINE", "#ff4d6d");
    if (typeof speak === "function") speak("Shutting down. Goodbye.");
    return true;
  }

  if (cmd.startsWith("open ")) {
    let site = message.replace(/open /i, "").trim().toLowerCase();
    site = site.replace(/\.com$/, "");
    window.open(`https://${site}.com`, "_blank");
    addLog("KARA", `Opening ${site}.com`);
    if (typeof speak === "function") speak(`Opening ${site}`);
    return true;
  }

  if (cmd.startsWith("add task ")) {
    const task = message.replace(/add task /i, "").trim();
    addTask(task);
    return true;
  }

  if (cmd === "show tasks" || cmd === "tasks") {
    showTasks();
    return true;
  }

  if (cmd === "clear tasks") {
    clearTasks();
    return true;
  }

  const reminderMatch = cmd.match(
    /^remind me (.+) in (\d+)\s*(second|seconds|minute|minutes|hour|hours)$/
  );
  if (reminderMatch) {
    const task  = reminderMatch[1].trim();
    const value = parseInt(reminderMatch[2]);
    const unit  = reminderMatch[3];

    let delay = 0;
    if (unit.startsWith("second")) delay = value * 1000;
    if (unit.startsWith("minute")) delay = value * 60 * 1000;
    if (unit.startsWith("hour"))   delay = value * 60 * 60 * 1000;

    setReminder(task, delay);
    return true;
  }

  if (cmd === "help") {
    addLog("KARA", `
      Commands:<br>
      ⏰ time / date<br>
      🌐 open [site]<br>
      📋 add task [task]<br>
      📋 show tasks / clear tasks<br>
      ⏰ remind me [task] in [N] seconds/minutes/hours<br>
      🧹 clear / shutdown
    `);
    return true;
  }

  return false;
}

// ══════════════════════════════════════════════════
//  SEND MESSAGE
// ══════════════════════════════════════════════════

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  input.value = "";

  // Commands run FIRST — AI never sees them
  if (runCommand(message)) return;

  // Send to AI
  addLog("YOU", message);
  history.push({ role: "user", content: message });
  saveHistory();

  setState("THINKING", "#ffd166");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are Kara, a Jarvis-like AI assistant. Be short, useful, and direct. Never suggest opening websites or managing tasks — the system handles that."
          },
          ...history
        ]
      })
    });

    const data  = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    history.push({ role: "assistant", content: reply });
    saveHistory();

    addLog("KARA", reply);
    if (typeof speak === "function") speak(reply);

    setState("READY", "#00e5ff");

  } catch (err) {
    addLog("ERROR", "Could not reach AI.");
    setState("ERROR", "#ff4d6d");
  }
}

// ── EVENTS ────────────────────────────────────────
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

window.addEventListener("load", bootSequence);
