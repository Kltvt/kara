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

// ── CLEAR CHAT ────────────────────────────────────
function clearChat() {
  log.innerHTML = "";
  history.length = 0;
  addLog("SYSTEM", "Chat cleared.");
}

// ── BOOT ──────────────────────────────────────────
function bootSequence() {
  addLog("SYSTEM", "Initializing Kara...");
  setTimeout(() => addLog("SYSTEM", "Voice systems loading..."), 800);
  setTimeout(() => addLog("SYSTEM", "Neural core active..."),    1600);
  setTimeout(() => {
    addLog("SYSTEM", "Kara ready.");
    setState("READY", "#00e5ff");
    if (typeof speak === "function") speak("Kara online.");
  }, 2400);
}

// ── COMMAND SYSTEM ────────────────────────────────
function runCommand(message) {
  const cmd = message.toLowerCase().trim();

  // TIME
  if (cmd === "time") {
    const now = new Date().toLocaleTimeString();
    addLog("KARA", `Current time is ${now}`);
    if (typeof speak === "function") speak(`The time is ${now}`);
    return true;
  }

  // DATE
  if (cmd === "date") {
    const today = new Date().toDateString();
    addLog("KARA", `Today is ${today}`);
    if (typeof speak === "function") speak(`Today is ${today}`);
    return true;
  }

  // CLEAR
  if (cmd === "clear") {
    clearChat();
    return true;
  }

  // SHUTDOWN
  if (cmd === "shutdown") {
    addLog("SYSTEM", "Kara shutting down...");
    setState("OFFLINE", "#ff4d6d");
    if (typeof speak === "function") speak("Shutting down. Goodbye.");
    return true;
  }

  // OPEN WEBSITE
  if (cmd.startsWith("open ")) {
    let site = message.replace(/open /i, "").trim().toLowerCase();

    // Remove .com if they already typed it
    site = site.replace(/\.com$/, "");

    window.open(`https://${site}.com`, "_blank");
    addLog("KARA", `Opening ${site}.com`);
    if (typeof speak === "function") speak(`Opening ${site}`);
    return true;
  }

  // HELP
  if (cmd === "help") {
    addLog("KARA", "Commands: time | date | clear | shutdown | open [site] | help");
    if (typeof speak === "function") speak("Here are your available commands.");
    return true;
  }

  return false;
}

// ── SEND MESSAGE ──────────────────────────────────
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  input.value = "";

  // ✅ Commands run FIRST — AI never sees them
  if (runCommand(message)) return;

  // If not a command, go to AI
  addLog("YOU", message);
  history.push({ role: "user", content: message });

  setState("THINKING", "#ffd166");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are Kara, a Jarvis-like AI assistant. Be short, useful, and direct. Never suggest opening websites — the system handles that." },
          ...history
        ]
      })
    });

    const data  = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    history.push({ role: "assistant", content: reply });
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
