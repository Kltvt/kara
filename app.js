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

  // show user message
  addMessage("user", text);
  history.push({
    role: "user",
    content: text
  });

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
        model: "nvidia/nemotron-nano-9b-v2:free",
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
    console.log(data);

    // remove loading
    loading.remove();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Kara could not generate a response.";

    addMessage("assistant", reply);

    history.push({
      role: "assistant",
      content: reply
    });

  } catch (error) {
    loading.remove();
    console.error(error);

    addMessage(
      "assistant",
      "Error: Could not connect to Kara backend."
    );
  }
}

// button click
sendBtn.addEventListener("click", sendMessage);

// enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
