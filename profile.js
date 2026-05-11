// ══════════════════════════════════════════════════
//  KARA PERSONAL PROFILE SYSTEM
//  Stores who you are so Kara knows you
// ══════════════════════════════════════════════════

const DEFAULT_PROFILE = {
  name:        "",
  tone:        "casual",    // casual | formal | savage
  interests:   [],
  habits:      [],
  setupDone:   false,
};

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

// ── BUILD SYSTEM PROMPT FROM PROFILE ─────────────
// This makes Kara feel personal
function buildSystemPrompt(profile) {
  const name     = profile.name     || "friend";
  const tone     = profile.tone     || "casual";
  const interests = (profile.interests || []).join(", ") || "not specified yet";
  const habits    = (profile.habits    || []).join(", ") || "not specified yet";

  const toneGuide = {
    casual: "Be friendly, warm and conversational. Use casual language.",
    formal: "Be professional, precise and respectful. Use formal language.",
    savage: "Be brutally honest, sarcastic and funny. Roast them lightly but help them.",
  };

  return `
You are Kara, a personal AI assistant — like Jarvis but smarter and more personal.

USER PROFILE:
- Name: ${name}
- Preferred tone: ${tone}
- Interests: ${interests}
- Known habits: ${habits}

PERSONALITY RULES:
- Always address the user as ${name}
- ${toneGuide[tone] || toneGuide.casual}
- Remember details they tell you about themselves
- Be short and direct — max 2-3 sentences unless they ask for more
- Never suggest opening websites or managing tasks — the system handles that
- You are not just a chatbot — you are their personal assistant who knows them
`.trim();
}

// ── SETUP WIZARD ──────────────────────────────────
// Runs on first boot to learn about the user
async function runSetupWizard() {
  return new Promise((resolve) => {
    addLog("KARA", "Hey! I'm Kara. I don't know you yet. Let's fix that.");
    setTimeout(() => addLog("KARA", "What's your name?"), 1000);

    // Temporarily hijack sendMessage for setup flow
    let step = "name";
    const profile = { ...DEFAULT_PROFILE };

    const originalSend = window.sendMessage;

    window.sendMessage = async function () {
      const val = input.value.trim();
      if (!val) return;
      input.value = "";
      addLog("YOU", val);

      if (step === "name") {
        profile.name = val;
        addLog("KARA", `Nice to meet you ${val}! 👋`);
        setTimeout(() => {
          addLog("KARA", `What tone do you prefer?<br>
            <button onclick="pickTone('casual')" style="${btnStyle}">😎 Casual</button>
            <button onclick="pickTone('formal')" style="${btnStyle}">🎩 Formal</button>
            <button onclick="pickTone('savage')" style="${btnStyle}">💀 Savage</button>
          `);
        }, 800);
        step = "tone";
        return;
      }

      if (step === "interests") {
        profile.interests = val.split(",").map(s => s.trim());
        addLog("KARA", `Got it! I'll keep that in mind.`);
        setTimeout(() => {
          addLog("KARA", `Last one — any habits you want me to track? (e.g. drink water, exercise, sleep early) or type 'skip'`);
        }, 800);
        step = "habits";
        return;
      }

      if (step === "habits") {
        if (val.toLowerCase() !== "skip") {
          profile.habits = val.split(",").map(s => s.trim());
        }
        profile.setupDone = true;
        await saveProfile(profile);
        window.karaProfile = profile;

        addLog("KARA", `All set ${profile.name}! I know you now. Let's get to work. 🚀`);
        if (typeof speak === "function") speak(`All set ${profile.name}! I'm ready.`);

        // Restore original sendMessage
        window.sendMessage = originalSend;
        setState("READY", "#00e5ff");
        resolve(profile);
      }
    };
  });
}

// Tone picker buttons
const btnStyle = `
  margin: 4px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #00e5ff;
  color: #00e5ff;
  border-radius: 6px;
  cursor: pointer;
`;

window.pickTone = async function(tone) {
  window.karaProfile = window.karaProfile || {};
  window.karaProfile.tone = tone;
  addLog("YOU", tone);
  addLog("KARA", `${tone} mode activated ✅`);
  setTimeout(() => {
    addLog("KARA", "What are your interests? (e.g. coding, music, fitness) — separate with commas");
  }, 600);

  // Continue setup
  input.value = "";
  input.focus();
};

// ── INIT PROFILE ──────────────────────────────────
async function initProfile() {
  const profile = await loadProfile();
  window.karaProfile = profile;

  if (!profile.setupDone) {
    setState("SETUP", "#a855f7");
    await runSetupWizard();
  } else {
    addLog("SYSTEM", `Welcome back ${profile.name}! 👋`);
    if (typeof speak === "function") speak(`Welcome back ${profile.name}`);
  }

  return profile;
}
