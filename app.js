const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("chatContainer");

const history = [];

// add message to UI
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = "message " + role;
  msg.textContent = text;

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// send message
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  // user message
  addMessage("user", text);

  history.push({
    role: "user",
    content: text
  });

  saveChat();

  input.value = "";

  // loading
  const loading = document.createElement("div");
  loading.className = "message assistant";
  loading.textContent = "Kara is thinking...";
  chatContainer.appendChild(loading);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const res = await fetch("https://budy-ai.klt770586.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content:
              "You are Kara, a modern all-in-one personal assistant. Be friendly, smart, concise, and helpful."
          },
          ...history
        ]
      })
    });

    const data = await res.json();

    loading.remove();

    let reply = "Kara could not generate a response.";

    if (data?.error?.message) {
      reply = "⚠️ " + data.error.message;
    } else if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    addMessage("assistant", reply);

    history.push({
      role: "assistant",
      content: reply
    });

    saveChat();

  } catch (error) {
    loading.remove();
    console.error(error);

    addMessage(
      "assistant",
      "Error: Could not connect to Kara backend."
    );
  }
}

// button send
sendBtn.addEventListener("click", sendMessage);

// enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// load saved chat on startup
loadChat();
