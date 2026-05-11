const input    = document.getElementById("userInput");
const sendBtn  = document.getElementById("sendBtn");
const log      = document.getElementById("log");
const statusEl = document.getElementById("status");
const orb      = document.getElementById("orb");

// ⚠️ CHANGE THIS to your Worker URL
const MEMORY_API = "https://kara-memory-api.aklt770586.workers.dev/";
const AI_API     = "https://budy-ai.klt770586.workers.dev";
const MODEL      = "nvidia/nemotron-3-super-120b-a12b:free";

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
//  STATE (orb color)
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
  history.length = 0;
  log.innerHTML  = "";
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

    // Start notifications + service worker
    if (typeof initNotifications === "function") {
      await initNotifications();
    }

    // Load user profile (Phase 9)
    if (typeof initProfile === "function") {
      await initProfile();
    }

    // Load chat history + reminders
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
  // Send to service worker for background
  if (typeof scheduleBackgroundReminder === "function") {
    scheduleBackgroundReminder(task, delay);
  }

  setTimeout(() => {
    setState("REMINDER", "#ff4d6d");

    // Show in chat with stop button
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

    // Fire alarm — beeps + notification + voice
    if (typeof fireMobileReminder === "function") {
      fireMobileReminder(task);
    } else {
      // Fallback if notifications.js not loaded
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
//  INTENT ENGINE (Phase 7)
// ══════════════════════════════════════════════════

async function detectIntent(message) {
  const prompt = `
You are an intent detection engine for an AI assistant called Kara.
Analyze the user message and return ONLY a JSON object — no explanation, no extra text.

Possible intents:
- get_time
- get_date
- open_site    → needs: { site: "youtube" }
- add_task     → needs: { task: "buy milk" }
- show_tasks
- clear_tasks
- set_reminder → needs: { task: "drink water", delay_ms: 300000 }
- clear_memory
- shutdown
- show_help
- chat

User message: "${message}"

Reply ONLY with JSON like:
{ "intent": "set_reminder", "task": "drink water", "delay_ms": 300000 }
or
{ "intent": "chat" }
`;

  try {
    const res = await fetch(AI_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data  = await res.json();
    const text  = data?.choices?.[0]?.message?.content || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);

  } catch (err) {
    console.warn("Intent detection failed:", err);
    return { intent: "chat" };
  }
}

// ══════════════════════════════════════════════════
//  EXECUTE INTENT
// ══════════════════════════════════════════════════

async function executeIntent(intent) {
  switch (intent.intent) {

    case "get_time": {
      const now = new Date().toLocaleTimeString();
      addLog("KARA", `Current time is ${now}`);
      if (typeof speak === "function") speak(`The time is ${now}`);
      return true;
    }

    case "get_date": {
      const today = new Date().toDateString();
      addLog("KARA", `Today is ${today}`);
      if (typeof speak === "function") speak(`Today is ${today}`);
      return true;
    }

    case "open_site": {
      let site = (intent.site || "").toLowerCase().replace(/\.com$/, "");
      if (!site) return false;
      window.open(`https://${site}.com`, "_blank");
      addLog("KARA", `Opening ${site}.com`);
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

    case "clear_memory": {
      await clearMemory();
      return true;
    }

    case "shutdown": {
      addLog("SYSTEM", "Kara shutting down...");
      setState("OFFLINE", "#ff4d6d");
      if (typeof speak === "function") speak("Shutting down. Goodbye.");
      return true;
    }

    case "show_help": {
      addLog("KARA", `
        Say anything naturally!<br>
        ⏰ "what time is it" / "what day is today"<br>
        🌐 "take me to youtube" / "open github"<br>
        📋 "i need to buy milk" / "add task call mom"<br>
        📋 "show my tasks" / "clear tasks"<br>
        ⏰ "remind me to drink water in 5 minutes"<br>
        🧹 "clear everything" / "shutdown"<br>
        👤 "change my tone" / "update my name"
      `);
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

  setState("THINKING", "#ffd166");

  // Step 1 — detect intent
  const intent  = await detectIntent(message);
  console.log("Intent:", intent);

  // Step 2 — execute if command
  const handled = await executeIntent(intent);
  if (handled) {
    setState("READY", "#00e5ff");
    return;
  }

  // Step 3 — normal AI chat
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
          ...history
        ]
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
