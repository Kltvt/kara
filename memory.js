let karaMemory = JSON.parse(localStorage.getItem("kara_memory")) || {
  chats: [],
  notes: [],
  preferences: {}
};

function saveMemory() {
  localStorage.setItem("kara_memory", JSON.stringify(karaMemory));
}

function rememberChat(role, content) {
  karaMemory.chats.push({
    role,
    content,
    time: new Date().toISOString()
  });

  if (karaMemory.chats.length > 50) {
    karaMemory.chats.shift();
  }

  saveMemory();
}

function clearMemory() {
  karaMemory = {
    chats: [],
    notes: [],
    preferences: {}
  };

  saveMemory();
}
