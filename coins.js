/* ============================================================
   Tab 3 — My Coins.
   Shows the coin balance from the shared store, and plays a playful
   coin animation whenever the balance goes up. The earning rules and
   the "coming soon" teaser are static markup in index.html.
   ============================================================ */
(function initCoinsTab() {
  const balanceEl = document.getElementById("coins-balance");
  const hero = document.getElementById("coins-hero");
  if (!balanceEl) return; // My Coins panel not on the page

  P2Pi.onChange((total, delta) => {
    balanceEl.textContent = total;

    if (delta > 0) {
      // Bounce the number...
      balanceEl.classList.remove("bump");
      void balanceEl.offsetWidth; // restart the CSS animation
      balanceEl.classList.add("bump");
      // ...and toss a few coins up out of the counter.
      coinBurst(hero, Math.min(6, delta + 2));
    }
  });

  // Spawn a handful of 🪙 that float up and fade — pure CSS animation,
  // just positioned/timed with a little randomness here.
  function coinBurst(container, count) {
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const coin = document.createElement("span");
      coin.className = "coin-fly";
      coin.textContent = "🪙";
      coin.style.left = 30 + Math.random() * 40 + "%";
      coin.style.animationDelay = Math.random() * 0.2 + "s";
      container.appendChild(coin);
      // Clean up after the animation finishes.
      setTimeout(() => coin.remove(), 1200);
    }
  }
})();
