const voiceBtn = document.getElementById("voiceBtn");

let recognition;
let listening = false;

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
