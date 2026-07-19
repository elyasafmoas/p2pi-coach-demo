/* ============================================================
   Tab 2 — Simulate: a historical "time machine" over any index.

   Pure JS math over the asset modules in data/ (each self-registers
   into window.P2PI_ASSETS), plus a small hand-rolled SVG line chart
   (no chart library, no dependencies).

   The student picks ONE asset per run in this stage; the code is
   structured so splitting across several assets can be added cleanly
   (see runSimulationMath and the picker note in initSimulator).

   Teaching model (kept simple for students, not traders):
   - exposure  = amount × leverage           (how much you control)
   - borrowed  = amount × (leverage − 1)      (the lender's money)
   - each month the whole exposure moves with the chosen index's return
   - the borrowed part accrues a simple financing cost
   - MARGIN CALL: if your own money (equity) becomes too thin a slice of
     the position, the lender closes you out — a teaching moment.

   Note on the margin threshold: a literal "equity < 25% of exposure"
   is impossible above 4x, because at Lx your starting equity is only
   1/L of the exposure (just 20% at 5x). So we use a 15% maintenance
   level, which keeps the intended behaviour: 1x never gets called, and
   high leverage gets called during real crashes (e.g. 5x from 2007).
   ============================================================ */

const FINANCING_ANNUAL = 0.05;   // annual cost of the borrowed money (5%)
const MAINTENANCE_MARGIN = 0.15; // lender closes you out below this equity slice
const COINS_PER_RUN = 3;         // reward for exploring

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Format a number as shekels, e.g. 2872 -> "₪2,872"
const shekels = (n) => "₪" + Math.round(n).toLocaleString("en-US");
// "2008-02" -> "February 2008"
function prettyMonth(ym) {
  const [y, m] = ym.split("-");
  const names = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  return names[+m - 1] + " " + y;
}

/* ------------------------------------------------------------
   The core simulation for ONE asset. Returns the month-by-month
   equity journey plus the summary numbers the UI needs.

   Structured for the next stage (splitting across assets): a split
   simulation would call this per asset leg with each leg's share of
   the amount, then combine the per-month equities. Keeping this a
   pure function of (amount, year, leverage, asset) makes that clean.
   ------------------------------------------------------------ */
function runSimulationMath(amount, startYear, leverage, asset) {
  const data = asset.monthlyData;
  const startPoint = data.find((p) => p.date === startYear + "-01") || data[0];
  const slice = data.slice(data.indexOf(startPoint));

  let position = amount * leverage;        // current market value we control
  let debt = amount * (leverage - 1);      // what we owe the lender

  const points = [{ date: slice[0].date, equity: amount }];
  let marginCall = null;

  // Track the biggest peak-to-trough drop in YOUR money (in shekels).
  let peak = amount, worstDrop = 0, worstIndex = 0, worstYear = startYear;

  for (let i = 1; i < slice.length; i++) {
    const monthReturn = slice[i].value / slice[i - 1].value - 1;
    position *= 1 + monthReturn;
    if (leverage > 1) debt *= 1 + FINANCING_ANNUAL / 12; // financing accrues

    let equity = position - debt;

    // Margin call: equity has become too thin a slice of the position.
    if (leverage > 1 && position > 0 && equity / position < MAINTENANCE_MARGIN) {
      equity = Math.max(0, equity);
      points.push({ date: slice[i].date, equity });
      marginCall = { date: slice[i].date, equity };
      break;
    }

    points.push({ date: slice[i].date, equity });

    if (equity > peak) peak = equity;
    const drop = peak - equity;
    if (drop > worstDrop) {
      worstDrop = drop;
      worstIndex = i;
      worstYear = slice[i].date.slice(0, 4);
    }
  }

  const finalValue = points[points.length - 1].equity;
  return {
    points,
    amount,
    startYear,
    leverage,
    asset,
    finalValue,
    profit: finalValue - amount,
    pct: (finalValue / amount - 1) * 100,
    marginCall,
    worst: { drop: worstDrop, index: worstIndex, year: worstYear },
  };
}

/* ------------------------------------------------------------
   Hand-rolled SVG line chart of the equity journey.
   Magenta line; the scariest dip is marked in the warning colour.
   ------------------------------------------------------------ */
// CSS custom properties don't resolve inside SVG presentation attributes,
// so we read the real colours from :root and inject the hex values.
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildChart(result) {
  const { points, amount, worst, asset } = result;
  // The line takes the asset's own colour so each index reads distinctly.
  const C_PRIMARY = (asset && asset.color) || cssVar("--color-primary") || "#FF0083";
  const C_WARNING = cssVar("--color-warning") || "#E5484D";
  const C_MUTED = cssVar("--color-text-muted") || "#6B6B6B";
  const W = 340, H = 160, padX = 8, padTop = 14, padBot = 22;
  const eqs = points.map((p) => p.equity);
  const min = Math.min(...eqs, amount);
  const max = Math.max(...eqs, amount);
  const range = max - min || 1;

  const x = (i) => padX + (i * (W - 2 * padX)) / Math.max(1, points.length - 1);
  const y = (v) => padTop + (H - padTop - padBot) * (1 - (v - min) / range);

  const linePts = points.map((p, i) => `${x(i).toFixed(1)},${y(p.equity).toFixed(1)}`);
  const areaPath =
    `M ${x(0).toFixed(1)},${(H - padBot).toFixed(1)} ` +
    `L ${linePts.join(" L ")} ` +
    `L ${x(points.length - 1).toFixed(1)},${(H - padBot).toFixed(1)} Z`;

  const baseY = y(amount).toFixed(1); // "you put in" reference line
  const endX = x(points.length - 1), endY = y(points[points.length - 1].equity);

  // Worst-dip marker (only if there was a meaningful dip).
  let worstMarker = "";
  if (worst.drop > 0 && worst.index > 0) {
    const wx = x(worst.index), wy = y(points[worst.index].equity);
    const labelLeft = wx > W * 0.6;
    worstMarker = `
      <circle cx="${wx.toFixed(1)}" cy="${wy.toFixed(1)}" r="3.5" fill="${C_WARNING}"/>
      <text x="${(labelLeft ? wx - 5 : wx + 5).toFixed(1)}" y="${(wy - 6).toFixed(1)}"
            text-anchor="${labelLeft ? "end" : "start"}"
            fill="${C_WARNING}" font-size="9" font-weight="700">▼ ${worst.year}</text>`;
  }

  const startYr = points[0].date.slice(0, 4);
  const endYr = points[points.length - 1].date.slice(0, 4);

  return `
    <svg viewBox="0 0 ${W} ${H}" class="sim-chart" role="img"
         aria-label="Line chart of your investment value over time">
      <defs>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C_PRIMARY}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${C_PRIMARY}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#fillGrad)"/>
      <line x1="${padX}" y1="${baseY}" x2="${W - padX}" y2="${baseY}"
            stroke="${C_MUTED}" stroke-width="1"
            stroke-dasharray="3 3" opacity="0.6"/>
      <text x="${padX}" y="${(+baseY - 4).toFixed(1)}" fill="${C_MUTED}"
            font-size="8">you put in ${shekels(amount)}</text>
      <polyline points="${linePts.join(" ")}" fill="none"
                stroke="${C_PRIMARY}" stroke-width="2.5"
                stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="3.5"
              fill="${C_PRIMARY}"/>
      ${worstMarker}
      <text x="${padX}" y="${H - 6}" fill="${C_MUTED}" font-size="9">${startYr}</text>
      <text x="${W - padX}" y="${H - 6}" text-anchor="end"
            fill="${C_MUTED}" font-size="9">${endYr}</text>
    </svg>`;
}

/* ------------------------------------------------------------
   Animated count-up from 0 to the final value.
   ------------------------------------------------------------ */
let countUpRAF = null;
function countUp(el, target) {
  if (countUpRAF) cancelAnimationFrame(countUpRAF);
  const duration = 1100;
  let startTime = null;
  function frame(ts) {
    if (startTime === null) startTime = ts;
    const t = Math.min(1, (ts - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out
    el.textContent = shekels(target * eased);
    if (t < 1) countUpRAF = requestAnimationFrame(frame);
  }
  countUpRAF = requestAnimationFrame(frame);
}

/* ------------------------------------------------------------
   Wire up the controls, run button, and results rendering.
   ------------------------------------------------------------ */
(function initSimulator() {
  const amt = document.getElementById("amt");
  const year = document.getElementById("year");
  const lev = document.getElementById("lev");
  const amtVal = document.getElementById("amt-val");
  const yearVal = document.getElementById("year-val");
  const levVal = document.getElementById("lev-val");
  const levHint = document.getElementById("lev-hint");
  const yearNote = document.getElementById("year-note");
  const picker = document.getElementById("asset-picker");
  const runBtn = document.getElementById("run-btn");
  const results = document.getElementById("sim-results");
  if (!amt) return; // Simulate panel not on the page

  const ASSETS = window.P2PI_ASSETS || [];
  // In this stage the student picks ONE asset. (Next stage: an array of
  // {asset, weight} allocations — the picker + run loop would iterate that.)
  let selectedAsset = ASSETS[0];

  // Build the horizontal asset cards.
  function renderPicker() {
    picker.innerHTML = "";
    ASSETS.forEach((asset) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "asset-card" + (asset === selectedAsset ? " selected" : "");
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", asset === selectedAsset ? "true" : "false");
      card.innerHTML =
        `<span class="asset-name"><span class="asset-dot" style="background:${asset.color}"></span>${asset.shortName}</span>` +
        `<span class="asset-desc">${asset.description}</span>`;
      card.addEventListener("click", () => selectAsset(asset));
      picker.appendChild(card);
    });
  }

  function selectAsset(asset) {
    selectedAsset = asset;
    renderPicker();
    adaptYearRange();
  }

  // Clamp the year slider's minimum to the asset's earliest reliable year.
  function adaptYearRange() {
    const minYear = +selectedAsset.earliestReliableDate.slice(0, 4);
    year.min = minYear;
    if (+year.value < minYear) year.value = minYear;
    yearNote.textContent = `📅 Data available from ${minYear} for ${selectedAsset.shortName}.`;
    refreshLabels();
  }

  // Live labels for the sliders.
  function refreshLabels() {
    amtVal.textContent = shekels(+amt.value);
    yearVal.textContent = year.value;
    levVal.textContent = lev.value + "x";
    levHint.hidden = +lev.value <= 1; // hint only appears above 1x
  }
  [amt, year, lev].forEach((s) => s.addEventListener("input", refreshLabels));

  renderPicker();
  adaptYearRange(); // sets note + clamps for the default asset
  refreshLabels();

  runBtn.addEventListener("click", () => {
    const leverage = +lev.value;
    const result = runSimulationMath(+amt.value, +year.value, leverage, selectedAsset);
    renderResults(result);

    // Reward exploration with coins (shared state; My Coins reads it too).
    P2Pi.addCoins(COINS_PER_RUN);
    // One-time +5 bonus the first time a student tries leverage above 1x.
    const bonus = leverage > 1 ? P2Pi.awardOnce("leverage_tried", 5) : 0;
    showCoinToast(COINS_PER_RUN + bonus, bonus > 0);
  });

  function renderResults(r) {
    results.hidden = false;

    document.getElementById("r-amount").textContent = shekels(r.amount);
    document.getElementById("r-year").textContent = r.startYear;
    document.getElementById("r-asset").textContent = r.asset.shortName;

    // Chart legend: colour dot + full asset name.
    document.getElementById("chart-legend").innerHTML =
      `<span class="asset-dot" style="background:${r.asset.color}"></span>` +
      `<span>${r.asset.name}</span>`;

    // Profit / loss line, coloured green up / red down.
    const profitEl = document.getElementById("r-profit");
    const pctEl = document.getElementById("r-pct");
    const up = r.profit >= 0;
    profitEl.textContent = (up ? "+" : "−") + shekels(Math.abs(r.profit));
    profitEl.className = up ? "num-positive" : "num-negative";
    pctEl.textContent = `(${up ? "+" : "−"}${Math.abs(r.pct).toFixed(1)}%)`;
    pctEl.className = up ? "num-positive" : "num-negative";

    // Chart.
    document.getElementById("chart-wrap").innerHTML = buildChart(r);

    // Honest "worst dip" storytelling — always in shekels.
    const worstNote = document.getElementById("worst-note");
    if (r.worst.drop > 0) {
      worstNote.hidden = false;
      worstNote.innerHTML =
        `😬 On the way, around <strong>${r.worst.year}</strong> you'd have been down ` +
        `<strong>${shekels(r.worst.drop)}</strong> from your high point — investing has ` +
        `bumps, and that's completely normal.`;
    } else {
      worstNote.hidden = true;
    }

    // Margin-call teaching card (only when leverage wiped out the cushion).
    const marginCard = document.getElementById("margin-card");
    if (r.marginCall) {
      marginCard.hidden = false;
      marginCard.innerHTML = `
        <div class="mc-head"><span class="mc-icon">⚠️</span>
          <span class="mc-title">Margin call — the big lesson about leverage</span></div>
        <p>Because you used <strong>${r.leverage}x leverage</strong>, you were investing with
        borrowed money. When the market fell in <strong>${prettyMonth(r.marginCall.date)}</strong>,
        your losses grew about ${r.leverage}× as fast. Once your own money shrank to a thin
        cushion, the lender automatically sold your position to protect their loan — that's a
        <strong>margin call</strong>. You walked away with roughly ${shekels(r.marginCall.equity)}.</p>
        <p class="mc-lesson">The lesson: leverage can multiply gains, but a big enough dip can
        wipe you out <em>before</em> the market ever recovers. At <strong>1x</strong> you'd have
        stayed invested and could have ridden it back up.</p>`;
    } else {
      marginCard.hidden = true;
    }

    // Animate the headline number last so it's the thing the eye lands on.
    countUp(document.getElementById("r-final"), r.finalValue);
    results.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
})();

/* ------------------------------------------------------------
   Coin counter in the header (pulses when the balance grows) + a
   small "+N coins" toast. Shared globally so app.js can toast too.
   ------------------------------------------------------------ */
(function initHeaderCoins() {
  const countEl = document.getElementById("coin-count");
  if (!countEl) return;
  P2Pi.onChange((n, delta) => {
    countEl.textContent = n;
    if (delta > 0) {
      countEl.parentElement.classList.remove("bump");
      void countEl.parentElement.offsetWidth; // restart the CSS animation
      countEl.parentElement.classList.add("bump");
    }
  });
})();

let toastTimer = null;
function showCoinToast(n, isBonus) {
  const toast = document.getElementById("toast");
  if (!toast || n <= 0) return;
  toast.textContent = isBonus
    ? `🪙 +${n} coins! (first-leverage bonus)`
    : `🪙 +${n} P2Pi coin${n === 1 ? "" : "s"}!`;
  toast.hidden = false;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 300);
  }, 1800);
}
