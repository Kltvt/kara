const API_URL = "https://budy-ai.klt770586.workers.dev";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const log = document.getElementById("log");
const statusEl = document.getElementById("status");
const orb = document.getElementById("orb");

const history = [];

function setState(text, color) {
  statusEl.textContent = text;
  orb.style.borderColor = color;
  orb.style.boxShadow = `0 0 30px ${color}, inset 0 0 30px ${color}`;
}

function addLog(sender, text) {
  log.innerHTML += `<div><strong>${sender}:</strong> ${text}</div>`;
  log.scrollTop = log.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addLog("YOU", message);
  history.push({ role: "user", content: message });

  input.value = "";
  setState("PROCESSING", "#ffd166");

  try {
    const res = await fetch(API_URL, {
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
              "You are Kara, a futuristic Jarvis-like personal AI assistant. Be concise, smart, helpful, and slightly futuristic."
          },
          ...history
        ]
      })
    });

    const data = await res.json();
    console.log(data);

    let reply = "No response.";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
      history.push({
        role: "assistant",
        content: reply
      });
    } else if (data?.error?.message) {
      reply = "Error: " + data.error.message;
    }

    addLog("KARA", reply);
    speak(reply);
    setState("READY", "#00e5ff");
  } catch (err) {
    console.error(err);
    addLog("SYSTEM", "Connection failed");
    setState("ERROR", "#ff4d6d");
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
