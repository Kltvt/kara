const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("chatContainer");

const history = [];

// Render messages
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = "message " + role;

  if (role === "assistant") {
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Main send function
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

  // loading message
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
        model: "z-ai/glm-4.5-air:free",
        messages: [
          {
            role: "system",
            content:
              "You are Kara, a modern all-in-one personal assistant. Be smart, friendly, concise, and helpful."
          },
          ...history
        ]
      })
    });

    const data = await res.json();

    loading.remove();

    let reply = "Kara could not generate a response.";

    // backend/provider error
    if (data?.error?.message) {
      reply = "⚠️ " + data.error.message;
    }

    // success
    else if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    addMessage("assistant", reply);
    speak(reply);

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

// Button click
sendBtn.addEventListener("click", sendMessage);

// Enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Load saved messages
loadChat();

document.getElementById("clearChat").addEventListener("click", () => {
  localStorage.removeItem("kara_history");
  location.reload();
});
