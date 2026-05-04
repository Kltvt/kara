const karaMemory = JSON.parse(localStorage.getItem('kara_memory')) || [];

function saveMemory() {
  localStorage.setItem('kara_memory', JSON.stringify(karaMemory));
}
