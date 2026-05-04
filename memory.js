let chats = JSON.parse(localStorage.getItem("kara_chats")) || [];
let currentChatId = null;

function saveChats() {
  localStorage.setItem("kara_chats", JSON.stringify(chats));
  renderChatList();
}

function createNewChat() {
  currentChatId = Date.now();

  const newChat = {
    id: currentChatId,
    title: "New Chat",
    messages: []
  };

  chats.unshift(newChat);
  history.length = 0;

  saveChats();
  renderMessages();
}

function getCurrentChat() {
  return chats.find(chat => chat.id === currentChatId);
}

function saveCurrentChat() {
  const chat = getCurrentChat();
  if (!chat) return;

  chat.messages = [...history];

  if (history.length > 0) {
    chat.title = history[0].content.slice(0, 20);
  }

  saveChats();
}

function loadChat(chatId) {
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;

  currentChatId = chatId;
  history.length = 0;
  history.push(...chat.messages);

  renderMessages();
}

function renderMessages() {
  chatContainer.innerHTML = "";

  history.forEach(msg => {
    addMessage(
      msg.role === "assistant" ? "assistant" : "user",
      msg.content
    );
  });
}

function renderChatList() {
  const chatList = document.getElementById("chatList");
  chatList.innerHTML = "";

  chats.forEach(chat => {
    const item = document.createElement("div");
    item.className = "chat-item";
    item.textContent = chat.title;

    item.onclick = () => loadChat(chat.id);

    chatList.appendChild(item);
  });
}

// initialize
if (chats.length > 0) {
  currentChatId = chats[0].id;
  history.push(...chats[0].messages);
} else {
  createNewChat();
}

renderMessages();
renderChatList();
