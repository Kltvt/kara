function saveChat() {
  localStorage.setItem("kara_history", JSON.stringify(history));
}

function loadChat() {
  const saved = localStorage.getItem("kara_history");

  if (!saved) return;

  const parsed = JSON.parse(saved);

  parsed.forEach(msg => {
    addMessage(msg.role === "assistant" ? "assistant" : "user", msg.content);
    history.push(msg);
  });
}
