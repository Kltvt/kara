const micBtn = document.getElementById("micBtn");

let voices = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  console.log("Voices loaded:", voices);
}

loadVoices();
window.speechSynthesis.onvoiceschanged = loadVoices;

function speak(text) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const selectedVoice =
    voices.find(v => v.name === "Google UK English Female") ||
    voices.find(v => v.name === "Microsoft Zira - English (United States)") ||
    voices.find(v => v.lang.startsWith("en"));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function () {
    setState("LISTENING", "#ff4d6d");
  };

  recognition.onresult = function (event) {
    const text = event.results[0][0].transcript;
    input.value = text;
    sendMessage();
  };

  recognition.onend = function () {
    setState("READY", "#00e5ff");
  };
}

if (micBtn) {
  micBtn.addEventListener("click", function () {
    if (recognition) {
      recognition.start();
    } else {
      speak("Speech recognition is not supported in this browser.");
    }
  });
}

console.log("voice.js loaded");
