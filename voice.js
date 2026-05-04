const voiceBtn = document.getElementById("voiceBtn");

let recognition;
let listening = false;

// text to speech
function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 1;
  utterance.pitch = 1;

  const voices = speechSynthesis.getVoices();

  let selectedVoice = voices.find(
    voice => voice.name === "Google UK English Female"
  );

  // fallback to Zira
  if (!selectedVoice) {
    selectedVoice = voices.find(
      voice => voice.name === "Microsoft Zira - English (United States)"
    );
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  speechSynthesis.speak(utterance);
}
// speech recognition
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

// mic button
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
