console.log("Kara initialized");
console.log(data);
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("chatContainer");

const history = [];

function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = "message " + role;
  msg.textContent = text;

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  history.push({ role: "user", content: text });

  input.value = "";

  try {
    const res = await fetch("https://budy-ai.klt770586.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          {
            role: "system",
            content: "You are Kara, a modern personal AI assistant."
          },
          ...history
        ]
      })
    });

 const data = await res.json();
alert(JSON.stringify(data, null, 2));
console.log(data);

if (!data.choices || !data.choices.length) {
  addMessage("assistant", "Kara backend error.");
  return;
}

const reply = data.choices[0].message.content;   
    addMessage("assistant", reply);
    history.push({ role: "assistant", content: reply });

  } catch (err) {
    addMessage("assistant", "Error connecting to Kara.");
    console.error(err);
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
