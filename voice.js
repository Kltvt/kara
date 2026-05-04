const micBtn = document.getElementById("micBtn");

let voices = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  console.log("Loaded voices:", voices);
}

loadVoices();
window.speechSynthesis.onvoiceschanged = loadVoices;

function speak(text) {
  if (!("speechSynthesis" in window)) {
    console.log("Speech not supported");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  let selectedVoice =
    voices.find(v => v.name === "Google UK English Female") ||
    voices.find(v => v.name === "Microsoft Zira - English (United States)") ||
    voices.find(v => v.name === "Google US English");

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log("Using voice:", selectedVoice.name);
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => console.log("Speaking...");
  utterance.onend = () => console.log("Done speaking");

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
  if (recognition) {
    recognition.start();
  } else {
    speak("Voice recognition not supported.");
  }
});
