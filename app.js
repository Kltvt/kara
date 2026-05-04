const input = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const statusEl = document.getElementById('status');
const orb = document.getElementById('orb');
const log = document.getElementById('log');

function updateTime() {
  document.getElementById('time').textContent = new Date().toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

function setState(state, color) {
  statusEl.textContent = state;
  orb.style.borderColor = color;
  orb.style.boxShadow = `0 0 30px ${color}, inset 0 0 30px ${color}`;
}

function addLog(text) {
  log.innerHTML += `<div>> ${text}</div>`;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addLog(text);
  setState('PROCESSING', '#ffd166');

  setTimeout(() => {
    setState('READY', '#00e5ff');
  }, 1500);

  input.value = '';
}

sendBtn.onclick = sendMessage;

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

micBtn.onclick = () => {
  setState('LISTENING', '#ff4d6d');
  setTimeout(() => setState('IDLE', '#00e5ff'), 2000);
};
