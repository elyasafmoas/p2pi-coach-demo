/* ============================================================
   Conversational onboarding — the product's first impression.

   Scripted branching, but streamed word-by-word with thinking dots so it
   feels like talking to an agent. Fires on a true first visit or after
   "Start over" (no "onboarded" flag). The Coach profiles the user through
   at most two questions, then visibly ACTS: it badges a recommended course
   and/or pre-loads a simulation, and releases the user to that destination.
   ============================================================ */
(function initOnboarding() {
  const overlay = document.getElementById("onboarding-overlay");
  const chat = document.getElementById("ob-chat");
  const chips = document.getElementById("ob-chips");
  const skipLink = document.getElementById("ob-skip");
  if (!overlay || !chat) return;

  const DEFAULT_PRESET = { assets: ["sp500"], amount: 1000, startYear: 2015, leverage: 1 };
  const CRASH_PRESET = { assets: ["nasdaq"], amount: 1000, startYear: 2007, leverage: 5 };
  const courseTitle = (id) => {
    const c = (window.P2PI_COURSES || []).find((x) => x.id === id);
    return c ? c.title : id;
  };

  /* ---------- tiny streaming helpers (agent feel) ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const scrollDown = () => { chat.scrollTop = chat.scrollHeight; };

  function showTyping() {
    const row = document.createElement("div");
    row.className = "msg-row coach";
    row.innerHTML = `<div class="avatar">π</div><div class="bubble coach"><div class="typing"><span></span><span></span><span></span></div></div>`;
    chat.appendChild(row);
    scrollDown();
    return row;
  }
  function stream(text) {
    return new Promise((resolve) => {
      const row = document.createElement("div");
      row.className = "msg-row coach";
      row.innerHTML = `<div class="avatar">π</div><div class="bubble coach"><span class="stream"></span><span class="caret">▌</span></div>`;
      chat.appendChild(row);
      const streamEl = row.querySelector(".stream");
      const caret = row.querySelector(".caret");
      const words = text.split(" ");
      let i = 0;
      const timer = setInterval(() => {
        streamEl.textContent += (i === 0 ? "" : " ") + words[i];
        i++;
        scrollDown();
        if (i >= words.length) { clearInterval(timer); caret.remove(); resolve(); }
      }, 26);
    });
  }
  function addUser(text) {
    const row = document.createElement("div");
    row.className = "msg-row user";
    const b = document.createElement("div");
    b.className = "bubble user";
    b.textContent = text;
    row.appendChild(b);
    chat.appendChild(row);
    scrollDown();
  }
  // Render choice chips: each { label, on }.
  function renderChips(list) {
    chips.innerHTML = "";
    list.forEach((item) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.textContent = item.label;
      chip.addEventListener("click", () => item.on());
      chips.appendChild(chip);
    });
    scrollDown();
  }
  async function coachSay(text, thinkMs) {
    const t = showTyping();
    await wait(thinkMs || 420);
    t.remove();
    await stream(text);
  }

  /* ---------- conversation ---------- */
  function open() {
    overlay.hidden = false;
    document.body.classList.add("ob-open");
    chat.innerHTML = "";
    chips.innerHTML = "";
    step1();
  }
  function close() {
    overlay.hidden = true;
    document.body.classList.remove("ob-open");
  }

  async function step1() {
    await coachSay("Hi! I'm your P2π Coach 👋 I'll help you learn investing and try it out — safely, with pretend money. What sounds most like you?", 520);
    renderChips([
      { label: "I know nothing — start me from zero", on: () => followBasics("zero", "I know nothing — start me from zero") },
      { label: "I get the basics — show me investing", on: () => followBasics("basics", "I get the basics — show me investing") },
      { label: "I'm curious about the bold stuff — leverage", on: () => followLeverage() },
      { label: "Just let me play 🎮", on: () => act(OUTCOMES.play) },
    ]);
  }

  // Branches a & b share the read/try follow-up.
  async function followBasics(persona, echo) {
    addUser(echo);
    chips.innerHTML = "";
    await coachSay("Got it! And are you more of a “read first” or “try first” person?");
    renderChips([
      { label: "Read first", on: () => act(persona === "zero" ? OUTCOMES.zeroRead : OUTCOMES.basicsRead) },
      { label: "Try first", on: () => act(persona === "zero" ? OUTCOMES.zeroTry : OUTCOMES.basicsTry) },
    ]);
  }

  async function followLeverage() {
    addUser("I'm curious about the bold stuff — leverage");
    chips.innerHTML = "";
    await coachSay("Respect. Leverage is powerful and bumpy — want the 5-minute theory first, or crash a simulation on purpose to see it live?");
    renderChips([
      { label: "Theory first", on: () => act(OUTCOMES.leverageTheory) },
      { label: "Crash one 💥", on: () => act(OUTCOMES.leverageCrash) },
    ]);
  }

  // The Coach ACTS: store persona, badge the course, then release.
  async function act(outcome) {
    chips.innerHTML = "";
    P2Pi.setPersona(outcome.persona, outcome.recommendedCourse);
    if (window.P2PILearn) window.P2PILearn.refresh(); // badge appears on Learn

    await coachSay(outcome.recMessage, 520);
    if (outcome.altSimText) await coachSay(outcome.altSimText, 360);
    await coachSay("You can redo this anytime from Settings ⚙️", 320);

    renderChips(outcome.actions.map((a) => ({
      label: a.label,
      on: () => finishAndGo(a.dest, a.preset),
    })));
  }

  function finishAndGo(dest, preset) {
    P2Pi.setFlag("onboarded");
    close();
    if (dest === "sim" && preset && window.P2PI_loadSimulatorPreset) {
      window.P2PI_loadSimulatorPreset(preset, "your welcome");
    } else {
      const learnTab = document.querySelector('.tab[data-tab="learn"]');
      if (learnTab) learnTab.click();
      if (window.P2PILearn) window.P2PILearn.refresh();
    }
  }

  function skip() {
    P2Pi.setFlag("onboarded");
    close();
    const learnTab = document.querySelector('.tab[data-tab="learn"]');
    if (learnTab) learnTab.click();
  }
  if (skipLink) skipLink.addEventListener("click", skip);

  /* ---------- branch outcomes ---------- */
  const courseActions = (courseId, altPreset) => [
    { label: `Start ${courseTitle(courseId)} →`, dest: "learn" },
    { label: "Or let me play →", dest: "sim", preset: altPreset },
  ];
  const simActions = (courseId, preset) => [
    { label: "Let's go →", dest: "sim", preset },
    { label: courseId ? `Show me ${courseTitle(courseId)} →` : "Show me the courses →", dest: "learn" },
  ];

  const OUTCOMES = {
    zeroRead: {
      persona: "zero", recommendedCourse: "finance101",
      recMessage: "Here's your path: I'm putting Finance 101 on top for you — 4 short lessons, about 10 minutes. Then we'll play.",
      altSimText: "Or skip ahead — I've set up a ₪1,000 simulation, just press go →",
      actions: courseActions("finance101", DEFAULT_PRESET),
    },
    zeroTry: {
      persona: "zero", recommendedCourse: "finance101",
      recMessage: "Love a hands-on learner 🙌 I've badged Finance 101 for whenever you want the theory — but let's start by DOING.",
      altSimText: "I've set up a ₪1,000 simulation for you — just press go →",
      actions: simActions("finance101", DEFAULT_PRESET),
    },
    basicsRead: {
      persona: "basics", recommendedCourse: "investments101",
      recMessage: "Nice — you've got the basics. I'm putting Investments 101 on top: stocks, indexes, and diversification. Then we'll try it for real.",
      altSimText: "Or skip ahead — I've set up a ₪1,000 simulation, just press go →",
      actions: courseActions("investments101", DEFAULT_PRESET),
    },
    basicsTry: {
      persona: "basics", recommendedCourse: "investments101",
      recMessage: "Then let's play. I've badged Investments 101 for later — first, let's get our hands dirty.",
      altSimText: "Here's a ₪1,000 simulation, ready to run — just press go →",
      actions: simActions("investments101", DEFAULT_PRESET),
    },
    leverageTheory: {
      persona: "leverage", recommendedCourse: "leverage101",
      recMessage: "Smart to learn the theory first. I'm putting Leverage 101 on top — how borrowing amplifies both directions, and the dreaded margin call. Then you can crash one for real.",
      altSimText: "Or jump to the deep end — I've queued a bold 5x simulation, just press go →",
      actions: courseActions("leverage101", CRASH_PRESET),
    },
    leverageCrash: {
      persona: "leverage", recommendedCourse: "leverage101",
      recMessage: "Let's do it 💥 I've set up a bold one: NASDAQ at 5x leverage from 2007. Press go and watch what happens — then I'll break down exactly what went down.",
      altSimText: null,
      actions: simActions("leverage101", CRASH_PRESET),
    },
    play: {
      persona: "play", recommendedCourse: null,
      recMessage: "Say no more 🎮 I've set up a friendly ₪1,000 simulation to start you off. Press go — and I'll explain whatever happens.",
      altSimText: null,
      actions: simActions(null, DEFAULT_PRESET),
    },
  };

  /* ---------- public API + auto-fire ---------- */
  // "Redo my welcome" (from Settings) re-runs WITHOUT wiping progress.
  window.P2PIOnboarding = { start: open };

  // Fire on a true first visit / after Start over (no onboarded flag).
  if (!P2Pi.hasFlag("onboarded")) open();
})();
