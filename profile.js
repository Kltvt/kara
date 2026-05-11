// ══════════════════════════════════════════════════
//  KARA PERSONAL PROFILE SYSTEM
// ══════════════════════════════════════════════════

const DEFAULT_PROFILE = {
  name:      "",
  tone:      "casual",
  interests: [],
  habits:    [],
  setupDone: false,
};

let setupStep    = null;
let setupProfile = {};
let isSetupMode  = false;

// ── LOAD / SAVE ───────────────────────────────────

async function loadProfile() {
  try {
    const res  = await fetch(`${MEMORY_API}/history`);
    const data = await res.json();
    return data.profile || DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

async function saveProfile(profile) {
  try {
    await fetch(`${MEMORY_API}/profile/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
  } catch (err) {
    console.warn("Profile save failed:", err);
  }
}

// ── BUILD SYSTEM PROMPT ───────────────────────────

function buildSystemPrompt(profile) {
  const name      = profile.name      || "friend";
  const tone      = profile.tone      || "casual";
  const interests = (profile.interests || []).join(", ") || "not specified";
  const habits    = (profile.habits    || []).join(", ") || "not specified";

  const toneGuide = {
    casual: "Be friendly, warm and conversational. Use casual language. Call them by name sometimes.",
    formal: "Be professional, precise and respectful. Use formal language.",
    savage: "Be brutally honest, sarcastic and funny. Roast them lightly but still help them. Use their name.",
  };

  return `
You are Kara, a personal AI assistant like Jarvis.

USER PROFILE:
- Name: ${name}
- Tone: ${tone}
- Interests: ${interests}
- Habits: ${habits}

RULES:
- Address user as ${name}
- ${toneGuide[tone] || toneGuide.casual}
- Be short — max 2-3 sentences unless asked for more
- Never suggest opening websites or managing tasks
  `.trim();
}

// ── TONE PICKER ───────────────────────────────────

const btnStyle = `
  margin: 4px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #00e5ff;
  color: #00e5ff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
`;

window.pickTone = function(tone) {
  setupProfile.tone = tone;
  addLog("YOU", tone);
  addLog("KARA", `${tone} mode activated ✅`);

  setTimeout(() => {
    addLog("KARA", "What are your interests? (e.g. coding, music, fitness)<br>Separate with commas:");
    setupStep = "interests";
    isSetupMode = true;
  }, 600);
};

// ── SETUP HANDLER ─────────────────────────────────
// Called from sendMessage when isSetupMode is true

async function handleSetupInput(message) {
  if (setupStep === "name") {
    setupProfile.name = message;
    addLog("KARA", `Nice to meet you ${message}! 👋`);

    setTimeout(() => {
      addLog("KARA", `What tone do you prefer?<br>
        <button onclick="pickTone('casual')" style="${btnStyle}">😎 Casual</button>
        <button onclick="pickTone('formal')" style="${btnStyle}">🎩 Formal</button>
        <button onclick="pickTone('savage')" style="${btnStyle}">💀 Savage</button>
      `);
      setupStep = "tone";
    }, 600);
    return;
  }

  if (setupStep === "tone") {
    // waiting for button click — ignore typed input
    addLog("KARA", `Please pick a tone using the buttons above 👆`);
    return;
  }

  if (setupStep === "interests") {
    setupProfile.interests = message.split(",").map(s => s.trim()).filter(Boolean);
    addLog("KARA", `Got it! I'll remember that.`);

    setTimeout(() => {
      addLog("KARA", `Any habits you want me to track?<br>(e.g. drink water, exercise, sleep early)<br>Or type <strong>skip</strong>`);
      setupStep = "habits";
    }, 600);
    return;
  }

  if (setupStep === "habits") {
    if (message.toLowerCase() !== "skip") {
      setupProfile.habits = message.split(",").map(s => s.trim()).filter(Boolean);
    } else {
      setupProfile.habits = [];
    }

    // Setup complete
    setupProfile.setupDone = true;
    isSetupMode = false;
    setupStep   = null;

    await saveProfile(setupProfile);
    window.karaProfile = setupProfile;

    addLog("KARA", `All set ${setupProfile.name}! I know you now. Let's get to work. 🚀`);
    if (typeof speak === "function") speak(`All set ${setupProfile.name}! I am ready.`);
    setState("READY", "#00e5ff");
    return;
  }
}

// ── INIT PROFILE ──────────────────────────────────

async function initProfile() {
  const profile = await loadProfile();
  window.karaProfile = profile;

  if (!profile.setupDone) {
    // Start setup wizard
    isSetupMode  = true;
    setupStep    = "name";
    setupProfile = { ...DEFAULT_PROFILE };

    setState("SETUP", "#a855f7");
    setTimeout(() => {
      addLog("KARA", "Hey! I'm Kara. I don't know you yet. Let's fix that! 👋");
      setTimeout(() => addLog("KARA", "What's your name?"), 800);
    }, 500);

  } else {
    addLog("SYSTEM", `Welcome back ${profile.name}! 👋`);
    if (typeof speak === "function") speak(`Welcome back ${profile.name}`);
  }
}
