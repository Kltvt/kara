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

// ── STATE (orb color changes) ─────────────────────
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

// ── SEND MESSAGE ──────────────────────────────────
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addLog("YOU", message);
  input.value = "";

  history.push({ role: "user", content: message });

  setState("THINKING", "#ffd166");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are Kara, a Jarvis-like AI assistant. Be short, useful, and direct." },
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
