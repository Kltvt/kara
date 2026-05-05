const API_URL = "https://budy-ai.klt770586.workers.dev";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

const log = document.getElementById("log");
const statusEl = document.getElementById("status");
const orb = document.getElementById("orb");

const history = [];

// ================= BOOT =================
function bootSequence() {
  addLog("SYSTEM", "Initializing Kara...");
  setTimeout(() => addLog("SYSTEM", "Loading voice systems..."), 800);
  setTimeout(() => addLog("SYSTEM", "Memory module online..."), 1600);
  setTimeout(() => addLog("SYSTEM", "Neural systems active..."), 2400);

  setTimeout(() => {
    addLog("SYSTEM", "Kara ready.");
    setState("READY", "#00e5ff");

    loadHistory();
    restoreReminders();

    if (typeof speak === "function") {
      speak("Kara systems online.");
    }
  }, 3200);
}

// ================= CLOCK =================
function updateTime() {
  const timeEl = document.getElementById("time");
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

// ================= UI =================
function setState(text, color) {
  statusEl.textContent = text;
  orb.style.borderColor = color;
  orb.style.boxShadow = `0 0 30px ${color}, inset 0 0 30px ${color}`;
}

function addLog(sender, text) {
  log.innerHTML += `<div><strong>${sender}:</strong> ${text}</div>`;
  log.scrollTop = log.scrollHeight;
}

// ================= CHAT STORAGE =================
function saveHistory() {
  localStorage.setItem("kara_history", JSON.stringify(history));
}

function loadHistory() {
  const data = localStorage.getItem("kara_history");
  if (!data) return;

  const parsed = JSON.parse(data);
  history.push(...parsed);

  parsed.forEach(msg => {
    addLog(msg.role.toUpperCase(), msg.content);
  });
}

// ================= CHAT CLEAR =================
function clearChat() {
  log.innerHTML = "";
  history.length = 0;
  localStorage.removeItem("kara_history");

  addLog("SYSTEM", "Chat cleared.");
}

// ================= TASKS =================
function getTasks() {
  return JSON.parse(localStorage.getItem("kara_tasks")) || [];
}

function saveTasks(tasks) {
  localStorage.setItem("kara_tasks", JSON.stringify(tasks));
}

function addTask(task) {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);

  addLog("KARA", `Task added: ${task}`);
  if (typeof speak === "function") speak("Task added");
}

function showTasks() {
  const tasks = getTasks();

  if (tasks.length === 0) {
    addLog("KARA", "No tasks found.");
    return;
  }

  addLog("KARA", "Tasks:");
  tasks.forEach((t, i) => addLog("TASK", `${i + 1}. ${t}`));
}

function clearTasks() {
  localStorage.removeItem("kara_tasks");
  addLog("KARA", "All tasks cleared.");
  if (typeof speak === "function") speak("Tasks cleared");
}

// ================= REMINDERS =================
function saveReminder(task, delay) {
  const reminders = JSON.parse(localStorage.getItem("kara_reminders")) || [];

  reminders.push({
    task,
    time: Date.now() + delay
  });

  localStorage.setItem("kara_reminders", JSON.stringify(reminders));
}

function triggerReminder(task) {
  addLog("REMINDER", task);
  if (typeof speak === "function") {
    speak(`Reminder: ${task}`);
  }
}

function restoreReminders() {
  const reminders = JSON.parse(localStorage.getItem("kara_reminders")) || [];
  const now = Date.now();

  reminders.forEach(r => {
    const delay = r.time - now;

    if (delay > 0) {
      setTimeout(() => triggerReminder(r.task), delay);
    } else {
      triggerReminder(r.task);
    }
  });
}

function setReminder(task, delay) {
  addLog("KARA", `Reminder set: ${task}`);

  saveReminder(task, delay);

  setTimeout(() => {
    triggerReminder(task);
  }, delay);
}

// ================= COMMAND SYSTEM =================
function runCommand(command) {
  const cmd = command.toLowerCase().trim();

  if (cmd === "time") {
    const now = new Date().toLocaleTimeString();
    addLog("KARA", `Time: ${now}`);
    if (typeof speak === "function") speak(`Time is ${now}`);
    return true;
  }

  if (cmd === "date") {
    const today = new Date().toDateString();
    addLog("KARA", `Date: ${today}`);
    if (typeof speak === "function") speak(`Today is ${today}`);
    return true;
  }

  if (cmd === "clear") {
    clearChat();
    return true;
  }

  if (cmd === "shutdown") {
    addLog("SYSTEM", "Kara shutting down...");
    setState("OFFLINE", "#ff4d6d");
    if (typeof speak === "function") speak("Shutting down");
    return true;
  }

  // OPEN WEBSITE
  if (cmd.startsWith("open ")) {
    const site = command.replace(/open /i, "").trim();
    const url = `https://${site}.com`;

    window.open(url, "_blank");
    addLog("SYSTEM", `Opening ${site}`);
    return true;
  }

  // TASKS
  if (cmd.startsWith("add task ")) {
    const task = command.replace(/add task /i, "").trim();
    addTask(task);
    return true;
  }

  if (cmd === "show tasks") {
    showTasks();
    return true;
  }

  if (cmd === "clear tasks") {
    clearTasks();
    return true;
  }

  // REMINDERS
  const match = command.toLowerCase().match(
    /remind me (.+) in (\d+)\s*(second|seconds|minute|minutes|hour|hours)/
  );

  if (match) {
    const task = match[1].trim();
    const value = parseInt(match[2]);
    const unit = match[3];

    let delay = 0;

    if (unit.includes("second")) delay = value * 1000;
    if (unit.includes("minute")) delay = value * 60 * 1000;
    if (unit.includes("hour")) delay = value * 60 * 60 * 1000;

    setReminder(task, delay);
    return true;
  }

  return false;
}

// ================= SEND =================
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addLog("YOU", message);

  history.push({ role: "user", content: message });
  saveHistory();

  input.value = "";

  if (runCommand(message)) return;

  setState("PROCESSING", "#ffd166");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are Kara, a Jarvis-like AI assistant. Be short, useful, and direct."
          },
          ...history
        ]
      })
    });

    const data = await res.json();

    let reply = "No response.";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    history.push({ role: "assistant", content: reply });
    saveHistory();

    addLog("KARA", reply);

    if (typeof speak === "function") {
      speak(reply);
    }

    setState("READY", "#00e5ff");
  } catch (err) {
    console.error(err);
    addLog("SYSTEM", "Connection failed");
    setState("ERROR", "#ff4d6d");
  }
}

// ================= EVENTS =================
sendBtn.addEventListener("click", sendMessage);

if (clearBtn) clearBtn.addEventListener("click", clearChat);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

window.addEventListener("load", bootSequence);

console.log("app.js loaded");
