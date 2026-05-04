const API_URL = "https://budy-ai.klt770586.workers.dev";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const clearBtn = document.getElementById("clearBtn");

const log = document.getElementById("log");
const statusEl = document.getElementById("status");
const orb = document.getElementById("orb");

const history = [];

// ===== TIME =====
function updateTime() {
  const timeEl = document.getElementById("time");
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString();
  }
}
setInterval(updateTime, 1000);
updateTime();

// ===== UI STATE =====
function setState(text, color) {
  statusEl.textContent = text;
  orb.style.borderColor = color;
  orb.style.boxShadow = `0 0 30px ${color}, inset 0 0 30px ${color}`;
}

// ===== LOGGING =====
function addLog(sender, text) {
  log.innerHTML += `<div><strong>${sender}:</strong> ${text}</div>`;
  log.scrollTop = log.scrollHeight;
}

// ===== CLEAR CHAT =====
function clearChat() {
  log.innerHTML = "";
  history.length = 0;

  if (typeof clearMemory === "function") {
    clearMemory();
  }

  addLog("SYSTEM", "Chat cleared.");
}

// ===== SEND MESSAGE =====
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addLog("YOU", message);
  rememberChat("user", message);

  history.push({
    role: "user",
    content: message
  });

  input.value = "";
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
              "You are Kara, a futuristic Jarvis-like personal AI assistant. Be concise, intelligent, and helpful."
          },
          ...history
        ]
      })
    });

    const data = await response.json();
    console.log("API response:", data);

    let reply = "";

    if (
      data &&
      data.choices &&
      data.choices.length > 0 &&
      data.choices[0].message
    ) {
      reply = data.choices[0].message.content || "";
    }

    if (!reply) {
      reply = "Sorry, I couldn't generate a reply.";
    }

    history.push({
      role: "assistant",
      content: reply
    });

    addLog("KARA", reply);
    rememberChat("assistant", reply);

    if (typeof speak === "function") {
      speak(reply);
    }

    setState("READY", "#00e5ff");

  } catch (error) {
    console.error("Fetch error:", error);
    addLog("SYSTEM", "Connection failed");
    setState("ERROR", "#ff4d6d");
  }
}

// ===== EVENTS =====
sendBtn.addEventListener("click", sendMessage);

clearBtn.addEventListener("click", clearChat);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

console.log("app.js loaded successfully");
