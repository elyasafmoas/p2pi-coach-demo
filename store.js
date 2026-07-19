/* ============================================================
   P2Pi shared state — a tiny store so all three tabs share data.
   Holds the coin balance plus one-time "flags" (e.g. whether the
   student has already earned the first-leverage bonus). Persists to
   localStorage so everything survives a refresh during a demo.
   ============================================================ */
window.P2Pi = (function () {
  const COINS_KEY = "p2pi_coins";
  const FLAGS_KEY = "p2pi_flags";
  const PERSONA_KEY = "p2pi_persona";

  // Load saved balance + flags (safe if storage is blocked, e.g. file://).
  let coins = 0;
  let flags = {};
  let persona = null; // { persona: "zero"|..., course: "finance101"|null }
  try {
    coins = parseInt(localStorage.getItem(COINS_KEY) || "0", 10) || 0;
    flags = JSON.parse(localStorage.getItem(FLAGS_KEY) || "{}") || {};
    persona = JSON.parse(localStorage.getItem(PERSONA_KEY) || "null");
  } catch (e) {
    /* keep in-memory defaults */
  }

  function save() {
    try {
      localStorage.setItem(COINS_KEY, String(coins));
      localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
      if (persona) localStorage.setItem(PERSONA_KEY, JSON.stringify(persona));
      else localStorage.removeItem(PERSONA_KEY);
    } catch (e) {
      /* ignore storage errors */
    }
  }

  const listeners = [];
  // Notify with the new balance and how much it just changed by (delta),
  // so views can play an animation only when coins actually increase.
  function notify(delta) {
    listeners.forEach((fn) => fn(coins, delta));
  }

  return {
    getCoins() {
      return coins;
    },

    // Add coins (e.g. +1 per question, +3 per simulation).
    addCoins(n) {
      coins += n;
      save();
      notify(n);
      return coins;
    },

    // Award a bonus only the first time (guarded by a named flag).
    // Returns the amount awarded (0 if it was already earned).
    awardOnce(flagName, amount) {
      if (flags[flagName]) return 0;
      flags[flagName] = true;
      coins += amount;
      save();
      notify(amount);
      return amount;
    },

    hasFlag(name) {
      return !!flags[name];
    },
    setFlag(name) {
      flags[name] = true;
      save();
    },

    // Onboarding persona + which course to badge as "Recommended for you".
    setPersona(personaId, courseId) {
      persona = { persona: personaId, course: courseId || null };
      save();
    },
    getPersona() {
      return persona;
    },
    getRecommendedCourse() {
      return persona ? persona.course : null;
    },

    // Subscribe to balance changes; called immediately with (coins, 0).
    onChange(fn) {
      listeners.push(fn);
      fn(coins, 0);
    },

    // Wipe everything for a clean demo with the next student.
    reset() {
      coins = 0;
      flags = {};
      persona = null;
      save();
      notify(0);
    },
  };
})();
