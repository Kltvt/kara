const API_URL = "https://budy-ai.klt770586.workers.dev";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

const log = document.getElementById("log");
const statusEl = document.getElementById("status");
const orb = document.getElementById("orb");

const history = [];

// ===== BOOT =====
function bootSequence() {
  addLog("SYSTEM", "Initializing Kara...");
  setTimeout(() => addLog("SYSTEM", "Loading voice systems..."), 1000);
  setTimeout(() => addLog("SYSTEM", "Memory module online..."), 2000);
  setTimeout(() => addLog("SYSTEM", "Neural systems active..."), 3000);
  setTimeout(() => {
    addLog("SYSTEM", "Kara ready.");
    setState("READY", "#00e5ff");

    if (typeof speak === "function") {
      speak("Kara systems online.");
    }
  }, 4000);
}

// ===== CLOCK =====
function updateTime() {
  const timeEl = document.getElementById("time");

  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString();
  }
}

setInterval(updateTime, 1000);
updateTime();

// ===== UI =====
function setState(text, color) {
  statusEl.textContent = text;
  orb.style.borderColor = color;
  orb.style.boxShadow = `0 0 30px ${color}, inset 0 0 30px ${color}`;
}

function addLog(sender, text) {
  log.innerHTML += `<div><strong>${sender}:</strong> ${text}</div>`;
  log.scrollTop = log.scrollHeight;
}

// ===== MEMORY =====
function clearChat() {
  log.innerHTML = "";
  history.length = 0;

  if (typeof clearMemory === "function") {
    clearMemory();
  }

  addLog("SYSTEM", "Chat cleared.");
}

// ===== LOCAL COMMANDS =====
function runCommand(command) {
  const cmd = command.toLowerCase().trim();

  if (cmd === "time") {
    const now = new Date().toLocaleTimeString();
    addLog("KARA", `Current time is ${now}`);
    speak(`Current time is ${now}`);
    return true;
  }

  if (cmd === "date") {
    const today = new Date().toDateString();
    addLog("KARA", `Today is ${today}`);
    speak(`Today is ${today}`);
    return true;
  }

  if (cmd === "clear") {
    clearChat();
    return true;
  }

  if (cmd === "shutdown") {
    addLog("SYSTEM", "Kara shutting down...");
    setState("OFFLINE", "#ff4d6d");
    speak("Shutting down.");
    return true;
  }

  if (cmd.startsWith("open ")) {
    const site = cmd.replace("open ", "").trim();

    if (!site) return true;

    const url = `https://${site}.com`;

    window.location.assign(url);
    return true;
  }

  return false;
}
// ===== SEND =====
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addLog("YOU", message);

  if (typeof rememberChat === "function") {
    rememberChat("user", message);
  }

  input.value = "";

  if (runCommand(message)) return;

  history.push({
    role: "user",
    content: message
  });

  setState("PROCESSING", "#ffd166");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are Kara, a futuristic Jarvis-like personal AI assistant."
          },
          ...history
        ]
      })
    });

    const data = await response.json();
    console.log(data);

    let reply = "Sorry, I couldn't generate a reply.";

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      reply = data.choices[0].message.content;
    }

    history.push({
      role: "assistant",
      content: reply
    });

    addLog("KARA", reply);

    if (typeof rememberChat === "function") {
      rememberChat("assistant", reply);
    }

    if (typeof speak === "function") {
      speak(reply);
    }

    setState("READY", "#00e5ff");
  } catch (error) {
    console.error(error);
    addLog("SYSTEM", "Connection failed");
    setState("ERROR", "#ff4d6d");
  }
}

// ===== EVENTS =====
sendBtn.addEventListener("click", sendMessage);

if (clearBtn) {
  clearBtn.addEventListener("click", clearChat);
}

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

window.addEventListener("load", function () {
  bootSequence();
});

console.log("app.js loaded");
