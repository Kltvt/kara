const input    = document.getElementById("userInput");
const sendBtn  = document.getElementById("sendBtn");
const log      = document.getElementById("log");
const statusEl = document.getElementById("status");
const orb      = document.getElementById("orb");

// ⚠️ CHANGE THIS to your Worker URL
const MEMORY_API = "https://kara-memory-api.aklt770586.workers.dev";
const AI_API     = "https://api-key.aklt770586.workers.dev";
const MODEL      = "nvidia/nemotron-super-49b-v1:free";

const history = [];

// ══════════════════════════════════════════════════
//  CLOCK
// ══════════════════════════════════════════════════

function updateTime() {
  const el = document.getElementById("time");
  if (el) el.textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

// ══════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════

function setState(text, color) {
  statusEl.textContent = text;
  orb.style.borderColor = color;
  orb.style.boxShadow   = `0 0 40px ${color}, inset 0 0 40px ${color}33`;
}

// ══════════════════════════════════════════════════
//  LOG
// ══════════════════════════════════════════════════

function addLog(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// ══════════════════════════════════════════════════
//  SERVER MEMORY
// ══════════════════════════════════════════════════

async function saveMessage(role, content) {
  try {
    await fetch(`${MEMORY_API}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, content }),
    });
  } catch (err) {
    console.warn("Save failed:", err);
  }
}

async function loadHistory() {
  try {
    const res  = await fetch(`${MEMORY_API}/history`);
    const data = await res.json();

    if (data.messages && data.messages.length > 0) {
      history.push(...data.messages);
      const recent = data.messages.slice(-20);
      recent.forEach(msg => {
        addLog(msg.role === "user" ? "YOU" : "KARA", msg.content);
      });
      addLog("SYSTEM", `Memory restored — ${data.messages.length} messages loaded.`);
    }

    return data;
  } catch (err) {
    addLog("SYSTEM", "Could not load memory. Running offline.");
    return { messages: [], tasks: [], reminders: [], profile: {} };
  }
}

async function clearMemory() {
  try {
    await fetch(`${MEMORY_API}/clear`, { method: "DELETE" });
  } catch (err) {
    console.warn("Clear failed:", err);
  }
  history.length     = 0;
  log.innerHTML      = "";
  window.karaProfile = null;
  addLog("SYSTEM", "Memory cleared.");
  if (typeof speak === "function") speak("Memory cleared.");
}

// ══════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════

async function bootSequence() {
  addLog("SYSTEM", "Initializing Kara...");
  setTimeout(() => addLog("SYSTEM", "Voice systems loading..."),        800);
  setTimeout(() => addLog("SYSTEM", "Neural core active..."),          1600);
  setTimeout(() => addLog("SYSTEM", "Connecting to memory server..."), 2000);
  setTimeout(() => addLog("SYSTEM", "Starting background agent..."),   2200);

  setTimeout(async () => {
    if (typeof initNotifications === "function") await initNotifications();
    if (typeof initProfile === "function") await initProfile();
    const data = await loadHistory();
    await restoreReminders(data.reminders || []);
    setState("READY", "#00e5ff");
  }, 2400);
}

// ══════════════════════════════════════════════════
//  TASKS
// ══════════════════════════════════════════════════

async function addTask(task) {
  try {
    await fetch(`${MEMORY_API}/task/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
    });
  } catch (err) {
    console.warn("Add task failed:", err);
  }
  addLog("KARA", `Task added ✅ — ${task}`);
  if (typeof speak === "function") speak(`Task added: ${task}`);
}

async function showTasks() {
  try {
    const res   = await fetch(`${MEMORY_API}/history`);
    const data  = await res.json();
    const tasks = data.tasks || [];
    if (tasks.length === 0) {
      addLog("KARA", "No tasks found.");
      if (typeof speak === "function") speak("You have no tasks.");
      return;
    }
    addLog("KARA", `You have ${tasks.length} task(s):`);
    tasks.forEach((t, i) => addLog("TASK", `${i + 1}. ${t.task}`));
  } catch (err) {
    addLog("KARA", "Could not load tasks.");
  }
}

async function clearTasks() {
  try {
    await fetch(`${MEMORY_API}/task/clear`, { method: "DELETE" });
  } catch (err) {
    console.warn("Clear tasks failed:", err);
  }
  addLog("KARA", "All tasks cleared.");
  if (typeof speak === "function") speak("All tasks cleared.");
}

// ══════════════════════════════════════════════════
//  REMINDERS
// ══════════════════════════════════════════════════

async function setReminder(task, delay) {
  const fireAt = new Date(Date.now() + delay).toISOString();
  try {
    await fetch(`${MEMORY_API}/reminder/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, fireAt }),
    });
  } catch (err) {
    console.warn("Reminder save failed:", err);
  }
  scheduleReminder(task, delay);
  addLog("KARA", `Reminder set ⏰ — "${task}"`);
  if (typeof speak === "function") speak(`Reminder set for ${task}`);
}

function scheduleReminder(task, delay) {
  if (typeof scheduleBackgroundReminder === "function") {
    scheduleBackgroundReminder(task, delay);
  }

  setTimeout(() => {
    setState("REMINDER", "#ff4d6d");

    const div = document.createElement("div");
    div.innerHTML = `
      <strong>⏰ REMINDER:</strong> Time to ${task}!
      <button onclick="stopAlarm(); this.parentElement.remove();"
        style="margin-left:10px; padding:4px 12px; background:#ff4d6d;
               border:none; border-radius:6px; color:white; cursor:pointer;">
        Stop Alarm
      </button>
    `;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;

    if (typeof fireMobileReminder === "function") {
      fireMobileReminder(task);
    } else {
      if (typeof speak === "function") {
        speak(`Reminder! Time to ${task}!`);
        setTimeout(() => speak(`Hey! Time to ${task}!`), 3000);
      }
    }

    setTimeout(() => setState("READY", "#00e5ff"), 5000);
  }, delay);
}

async function restoreReminders(reminders) {
  const now = Date.now();
  reminders.forEach(r => {
    if (r.done) return;
    const delay = new Date(r.fireAt).getTime() - now;
    if (delay > 0) {
      scheduleReminder(r.task, delay);
      addLog("SYSTEM", `Reminder restored — "${r.task}"`);
    } else {
      addLog("⏰ MISSED REMINDER", `${r.task}`);
    }
  });
}

// ══════════════════════════════════════════════════
//  LOCAL COMMAND CHECK (Phase 3 — instant, no AI)
//  Runs FIRST before anything else
// ══════════════════════════════════════════════════

async function checkLocalCommand(message) {
  const cmd = message.toLowerCase().trim();

  // TIME
  if (cmd === "time" || cmd === "what time is it" || cmd === "what's the time") {
    const now = new Date().toLocaleTimeString();
    addLog("KARA", `Current time is ${now}`);
    if (typeof speak === "function") speak(`The time is ${now}`);
    return true;
  }

  // DATE
  if (cmd === "date" || cmd === "what day is it" || cmd === "what's today" || cmd === "what is today") {
    const today = new Date().toDateString();
    addLog("KARA", `Today is ${today}`);
    if (typeof speak === "function") speak(`Today is ${today}`);
    return true;
  }

  // CLEAR
  if (cmd === "clear" || cmd === "clear memory" || cmd === "wipe everything" || cmd === "reset") {
    await clearMemory();
    return true;
  }

  // SHUTDOWN
  if (cmd === "shutdown" || cmd === "turn off" || cmd === "goodbye" || cmd === "bye") {
    addLog("SYSTEM", "Kara shutting down...");
    setState("OFFLINE", "#ff4d6d");
    if (typeof speak === "function") speak("Shutting down. Goodbye.");
    return true;
  }

  // OPEN SITE
  if (cmd.startsWith("open ") || cmd.startsWith("take me to ") || cmd.startsWith("go to ")) {
    let site = message
      .replace(/open /i, "")
      .replace(/take me to /i, "")
      .replace(/go to /i, "")
      .trim()
      .toLowerCase()
      .replace(/\.com$/, "");
    window.open(`https://${site}.com`, "_blank");
    addLog("KARA", `Opening ${site}.com ✅`);
    if (typeof speak === "function") speak(`Opening ${site}`);
    return true;
  }

  // ADD TASK
  if (cmd.startsWith("add task ") || cmd.startsWith("add a task ")) {
    const task = message.replace(/add a? task /i, "").trim();
    await addTask(task);
    return true;
  }

  // SHOW TASKS
  if (cmd === "show tasks" || cmd === "tasks" || cmd === "my tasks" || cmd === "show my tasks") {
    await showTasks();
    return true;
  }

  // CLEAR TASKS
  if (cmd === "clear tasks" || cmd === "delete tasks" || cmd === "remove tasks") {
    await clearTasks();
    return true;
  }

  // REMIND ME — exact pattern
  const exactReminder = cmd.match(
    /^remind me (.+) in (\d+)\s*(second|seconds|minute|minutes|hour|hours)$/
  );
  if (exactReminder) {
    const task  = exactReminder[1].trim();
    const value = parseInt(exactReminder[2]);
    const unit  = exactReminder[3];
    let delay   = 0;
    if (unit.startsWith("second")) delay = value * 1000;
    if (unit.startsWith("minute")) delay = value * 60 * 1000;
    if (unit.startsWith("hour"))   delay = value * 60 * 60 * 1000;
    await setReminder(task, delay);
    return true;
  }

  // HELP
  if (cmd === "help" || cmd === "commands" || cmd === "what can you do") {
    addLog("KARA", `
      Say anything naturally!<br>
      ⏰ "what time is it" / "what day is today"<br>
      🌐 "open youtube" / "take me to github"<br>
      📋 "add task buy milk" / "show my tasks"<br>
      ⏰ "remind me drink water in 5 minutes"<br>
      🧹 "clear" / "shutdown"
    `);
    return true;
  }

  // Not a local command
  return false;
}

// ══════════════════════════════════════════════════
//  AI INTENT ENGINE (Phase 7)
//  Only runs if local command check fails
// ══════════════════════════════════════════════════

async function detectIntent(message) {
  const prompt = `You are an intent detection engine. Reply ONLY with a JSON object, nothing else. No markdown, no explanation, no code fences.

Intents:
- open_site    → { "intent": "open_site", "site": "youtube" }
- add_task     → { "intent": "add_task", "task": "buy milk" }
- show_tasks   → { "intent": "show_tasks" }
- clear_tasks  → { "intent": "clear_tasks" }
- set_reminder → { "intent": "set_reminder", "task": "drink water", "delay_ms": 300000 }
- chat         → { "intent": "chat" }

Message: "${message}"

JSON only:`;

  try {
    const res = await fetch(AI_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!res.ok) {
      console.warn("Intent API error:", res.status);
      return { intent: "chat" };
    }

    const data  = await res.json();
    const text  = data?.choices?.[0]?.message?.content || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);

  } catch (err) {
    console.warn("Intent detection failed — defaulting to chat:", err);
    return { intent: "chat" };
  }
}

// ══════════════════════════════════════════════════
//  EXECUTE AI INTENT
// ══════════════════════════════════════════════════

async function executeIntent(intent) {
  switch (intent.intent) {

    case "open_site": {
      let site = (intent.site || "").toLowerCase().replace(/\.com$/, "");
      if (!site) return false;
      window.open(`https://${site}.com`, "_blank");
      addLog("KARA", `Opening ${site}.com ✅`);
      if (typeof speak === "function") speak(`Opening ${site}`);
      return true;
    }

    case "add_task": {
      if (!intent.task) return false;
      await addTask(intent.task);
      return true;
    }

    case "show_tasks": {
      await showTasks();
      return true;
    }

    case "clear_tasks": {
      await clearTasks();
      return true;
    }

    case "set_reminder": {
      if (!intent.task || !intent.delay_ms) return false;
      await setReminder(intent.task, intent.delay_ms);
      return true;
    }

    case "chat":
    default:
      return false;
  }
}

// ══════════════════════════════════════════════════
//  SEND MESSAGE
// ══════════════════════════════════════════════════

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  addLog("YOU", message);

  // ✅ If setup is running — send to setup handler
  if (typeof isSetupMode !== "undefined" && isSetupMode) {
    await handleSetupInput(message);
    return;
  }

  setState("THINKING", "#ffd166");
  // ✅ STEP 1 — Check local commands first (instant, no AI)
  const localHandled = await checkLocalCommand(message);
  if (localHandled) {
    setState("READY", "#00e5ff");
    return;
  }

  // ✅ STEP 2 — Ask AI to detect intent for natural language
  const intent  = await detectIntent(message);
  const handled = await executeIntent(intent);
  if (handled) {
    setState("READY", "#00e5ff");
    return;
  }

  // ✅ STEP 3 — Normal AI chat
  history.push({ role: "user", content: message });
  await saveMessage("user", message);

  try {
    const res = await fetch(AI_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
  model: MODEL,
  messages: [
    {
      role: "system",
      content: typeof buildSystemPrompt === "function"
        ? buildSystemPrompt(window.karaProfile || {})
        : "You are Kara, a Jarvis-like AI assistant. Be short, useful, and direct."
    },
    ...history.slice(-20)
  ].filter(m => m.role && m.content)
})
    });

    const data  = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    history.push({ role: "assistant", content: reply });
    await saveMessage("assistant", reply);

    addLog("KARA", reply);
    if (typeof speak === "function") speak(reply);
    setState("READY", "#00e5ff");

  } catch (err) {
    addLog("ERROR", "Could not reach AI.");
    setState("ERROR", "#ff4d6d");
  }
}

// ══════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

window.addEventListener("load", bootSequence);
