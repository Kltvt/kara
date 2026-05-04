const voiceBtn = document.getElementById("voiceBtn");

let recognition;
let listening = false;
let availableVoices = [];

// Load voices properly
function loadVoices() {
  availableVoices = speechSynthesis.getVoices();
  console.log("Voices loaded:", availableVoices);
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Text to speech
function speak(text) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 1;
  utterance.pitch = 1;

  let selectedVoice = availableVoices.find(
    voice => voice.name === "Google UK English Female"
  );

  // fallback
  if (!selectedVoice) {
    selectedVoice = availableVoices.find(
      voice => voice.name === "Microsoft Zira - English (United States)"
    );
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log("Using voice:", selectedVoice.name);
  } else {
    console.log("No preferred voice found");
  }

  speechSynthesis.speak(utterance);
}

// Speech recognition
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    sendMessage();
  };

  recognition.onend = function () {
    listening = false;
    voiceBtn.textContent = "🎤";
  };
}

// Mic button
voiceBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Speech recognition not supported");
    return;
  }

  if (!listening) {
    recognition.start();
    listening = true;
    voiceBtn.textContent = "🔴";
  } else {
    recognition.stop();
    listening = false;
    voiceBtn.textContent = "🎤";
  }
});
