const micBtn = document.getElementById("micBtn");

// ── TEXT TO SPEECH (Kara talks) ───────────────────
function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance    = new SpeechSynthesisUtterance(text);
  utterance.lang     = "en-US";
  utterance.rate     = 1;
  utterance.pitch    = 1;
  utterance.volume   = 1;

  window.speechSynthesis.speak(utterance);
}

// ── VOICE INPUT (you talk to Kara) ───────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition      = new SpeechRecognition();
  recognition.lang = "en-US";

  recognition.onstart = () => setState("LISTENING", "#ff4d6d");
  recognition.onend   = () => setState("READY",     "#00e5ff");

  recognition.onresult = (event) => {
    const text    = event.results[0][0].transcript;
    input.value   = text;
    sendMessage();
  };
}

micBtn.addEventListener("click", () => {
  if (recognition) {
    recognition.start();
  } else {
    speak("Voice recognition not supported in this browser.");
  }
});
