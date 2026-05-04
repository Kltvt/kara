console.log('Voice system loaded');
const micBtn = document.getElementById("micBtn");

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();

  const femaleVoice =
    voices.find(v => v.name.includes("Google UK English Female")) ||
    voices.find(v => v.name.includes("Microsoft Zira")) ||
    voices.find(v => v.name.includes("Google US English"));

  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setState("LISTENING", "#ff4d6d");
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    input.value = text;
    sendMessage();
  };

  recognition.onend = () => {
    setState("IDLE", "#00e5ff");
  };
}

micBtn.addEventListener("click", () => {
  if (recognition) recognition.start();
});
