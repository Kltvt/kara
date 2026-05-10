const input   = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const log     = document.getElementById("log");

const API_URL = "https://budy-ai.klt770586.workers.dev";
const MODEL   = "nvidia/nemotron-3-super-120b-a12b:free";

const history = [];

function addLog(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addLog("YOU", message);
  input.value = "";

  history.push({ role: "user", content: message });

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are Kara, a helpful AI assistant. Be short and direct." },
          ...history
        ]
      })
    });

    const data  = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    history.push({ role: "assistant", content: reply });
    addLog("KARA", reply);

  } catch (err) {
    addLog("ERROR", "Could not reach AI.");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
