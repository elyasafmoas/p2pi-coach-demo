/* ============================================================
   P2Pi shared state — a tiny store so tabs can share data.
   Right now it holds the coin balance. Tab 3 ("My Coins") will read
   from the same store later. Persists to localStorage so the balance
   survives a refresh during a demo.
   ============================================================ */
window.P2Pi = (function () {
  const KEY = "p2pi_coins";

  // Read the saved balance (0 if none / storage unavailable, e.g. file://).
  let coins = 0;
  try {
    coins = parseInt(localStorage.getItem(KEY) || "0", 10) || 0;
  } catch (e) {
    /* localStorage may be blocked — just keep an in-memory balance. */
  }

  const listeners = [];
  function notify() {
    listeners.forEach((fn) => fn(coins));
  }

  return {
    getCoins() {
      return coins;
    },
    // Add coins (e.g. +3 for running a simulation) and let listeners react.
    addCoins(n) {
      coins += n;
      try {
        localStorage.setItem(KEY, String(coins));
      } catch (e) {
        /* ignore storage errors */
      }
      notify();
      return coins;
    },
    // Subscribe to balance changes; called immediately with the current value.
    onChange(fn) {
      listeners.push(fn);
      fn(coins);
    },
  };
})();
