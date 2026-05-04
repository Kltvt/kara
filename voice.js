console.log("voice.js loaded");

const micBtn = document.getElementById("micBtn");

function speak(text) {
  if (!("speechSynthesis" in window)) {
    console.log("Speech not supported");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
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
    if (typeof setState === "function") {
      setState("LISTENING", "#ff4d6d");
    }
  };

  recognition.onresult = function (event) {
    const text = event.results[0][0].transcript;

    if (typeof input !== "undefined") {
      input.value = text;
    }

    if (typeof sendMessage === "function") {
      sendMessage();
    }
  };

  recognition.onend = function () {
    if (typeof setState === "function") {
      setState("READY", "#00e5ff");
    }
  };
}

if (micBtn) {
  micBtn.addEventListener("click", function () {
    if (recognition) {
      recognition.start();
    } else {
      speak("Speech recognition is not supported.");
    }
  });
}
