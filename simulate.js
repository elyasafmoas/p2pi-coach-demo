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
   The core simulation for a PORTFOLIO of one or more assets.

   allocations: [{ asset, weight }] with weights summing to 1.
   - Each asset is a "leg": your money × weight, invested at the shared
     leverage. Legs move with their own index each month.
   - The borrowed money accrues financing per leg.
   - Total equity = sum of leg equities; total position = sum of leg
     positions. The MARGIN CALL is judged on the TOTAL — so a diversified
     mix can survive a dip that would have wiped out a single asset.

   Because total = Σ legs at every step, "total = sum of the parts" holds
   exactly, which is what the per-asset breakdown table relies on.
   ------------------------------------------------------------ */
function runPortfolioSimulation(amount, startYear, leverage, allocations) {
  const L = leverage;
  const legs = allocations.map(({ asset, weight }) => {
    const data = asset.monthlyData;
    const startPoint = data.find((p) => p.date === startYear + "-01") || data[0];
    const slice = data.slice(data.indexOf(startPoint));
    const allocated = amount * weight;
    return {
      asset, weight, allocated, slice,
      position: allocated * L,       // market value this leg controls
      debt: allocated * (L - 1),     // this leg's share of the loan
      equity: [allocated],           // per-month equity for this leg
    };
  });

  // All legs share the same timeline; length = shortest available slice.
  const n = Math.min(...legs.map((l) => l.slice.length));
  const points = [{ date: legs[0].slice[0].date, equity: amount }];
  let marginCall = null;
  let peak = amount, worstDrop = 0, worstIndex = 0, worstYear = startYear;

  for (let i = 1; i < n; i++) {
    let totalPos = 0, totalDebt = 0;
    legs.forEach((l) => {
      const r = l.slice[i].value / l.slice[i - 1].value - 1;
      l.position *= 1 + r;
      if (L > 1) l.debt *= 1 + FINANCING_ANNUAL / 12;
      totalPos += l.position;
      totalDebt += l.debt;
    });
    let totalEquity = totalPos - totalDebt;

    // Margin call on the whole portfolio's equity.
    if (L > 1 && totalPos > 0 && totalEquity / totalPos < MAINTENANCE_MARGIN) {
      totalEquity = Math.max(0, totalEquity);
      legs.forEach((l) => l.equity.push(Math.max(0, l.position - l.debt)));
      points.push({ date: legs[0].slice[i].date, equity: totalEquity });
      marginCall = { date: legs[0].slice[i].date, equity: totalEquity };
      break;
    }

    legs.forEach((l) => l.equity.push(l.position - l.debt));
    points.push({ date: legs[0].slice[i].date, equity: totalEquity });

    if (totalEquity > peak) peak = totalEquity;
    const drop = peak - totalEquity;
    if (drop > worstDrop) {
      worstDrop = drop;
      worstIndex = i;
      worstYear = points[i].date.slice(0, 4);
    }
  }

  const finalValue = points[points.length - 1].equity;
  return {
    points,
    amount,
    startYear,
    leverage,
    allocations,
    legs: legs.map((l) => {
      const fin = l.equity[l.equity.length - 1];
      return {
        asset: l.asset, weight: l.weight, allocated: l.allocated,
        equity: l.equity, final: fin, profit: fin - l.allocated,
        pct: (fin / l.allocated - 1) * 100,
      };
    }),
    finalValue,
    profit: finalValue - amount,
    pct: (finalValue / amount - 1) * 100,
    marginCall,
    worst: { drop: worstDrop, index: worstIndex, year: worstYear },
  };
}

// Convenience wrapper: simulate a single asset (used for the standalone
// "worst year" comparison behind the diversification callout).
function runSimulationMath(amount, startYear, leverage, asset) {
  return runPortfolioSimulation(amount, startYear, leverage, [{ asset, weight: 1 }]);
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
  const { points, amount, worst, legs } = result;
  const multi = legs.length > 1;
  // Total line is always the bold brand magenta.
  const C_TOTAL = cssVar("--color-primary") || "#FF0083";
  const C_WARNING = cssVar("--color-warning") || "#E5484D";
  const C_MUTED = cssVar("--color-text-muted") || "#6B6B6B";
  const W = 340, H = 160, padX = 8, padTop = 14, padBot = 22;

  // Scale to fit the total AND every per-asset leg (so toggled lines fit).
  let allVals = points.map((p) => p.equity).concat([amount]);
  legs.forEach((l) => { allVals = allVals.concat(l.equity.slice(0, points.length)); });
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  const x = (i) => padX + (i * (W - 2 * padX)) / Math.max(1, points.length - 1);
  const y = (v) => padTop + (H - padTop - padBot) * (1 - (v - min) / range);
  const toLine = (arr) => arr.slice(0, points.length).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const totalPts = points.map((p) => p.equity);
  const areaPath =
    `M ${x(0).toFixed(1)},${(H - padBot).toFixed(1)} ` +
    `L ${toLine(totalPts).split(" ").join(" L ")} ` +
    `L ${x(points.length - 1).toFixed(1)},${(H - padBot).toFixed(1)} Z`;

  const baseY = y(amount).toFixed(1);
  const endX = x(points.length - 1), endY = y(points[points.length - 1].equity);

  // Per-asset lines (thin, in each asset's colour). Hidden until toggled —
  // EXCEPT a defensive asset (the Bond ETF), which shows by default so the
  // flat-vs-bumpy contrast is visible at a glance.
  const legLines = multi ? legs.map((l) =>
    `<polyline class="leg-line" data-leg="${l.asset.id}" points="${toLine(l.equity)}"
       fill="none" stroke="${l.asset.color}" stroke-width="1.4"
       stroke-linejoin="round" stroke-linecap="round" style="display:${l.asset.defensive ? "" : "none"}"/>`).join("") : "";

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
         aria-label="Line chart of your portfolio value over time">
      <defs>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C_TOTAL}" stop-opacity="0.20"/>
          <stop offset="100%" stop-color="${C_TOTAL}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#fillGrad)"/>
      <line x1="${padX}" y1="${baseY}" x2="${W - padX}" y2="${baseY}"
            stroke="${C_MUTED}" stroke-width="1"
            stroke-dasharray="3 3" opacity="0.6"/>
      <text x="${padX}" y="${(+baseY - 4).toFixed(1)}" fill="${C_MUTED}"
            font-size="8">you put in ${shekels(amount)}</text>
      ${legLines}
      <polyline points="${toLine(totalPts)}" fill="none"
                stroke="${C_TOTAL}" stroke-width="2.8"
                stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="3.5" fill="${C_TOTAL}"/>
      ${worstMarker}
      <text x="${padX}" y="${H - 6}" fill="${C_MUTED}" font-size="9">${startYr}</text>
      <text x="${W - padX}" y="${H - 6}" text-anchor="end"
            fill="${C_MUTED}" font-size="9">${endYr}</text>
    </svg>`;
}

/* Small donut chart of the allocation, one arc per asset in its colour. */
function buildDonut(entries) {
  // entries: [{ color, pct }] pct in 0..100
  const size = 96, r = 38, cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const rings = entries.map((e) => {
    const len = (e.pct / 100) * C;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${e.color}" stroke-width="14"
        stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}"
        stroke-dashoffset="${(-offset).toFixed(2)}"
        transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
    return seg;
  }).join("");
  return `<svg viewBox="0 0 ${size} ${size}" class="donut" aria-hidden="true">${rings}</svg>`;
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

  // Validate each registered asset against the expected module shape, so a
  // single broken data file can't blank out the whole picker.
  const REQUIRED_FIELDS = ["id", "name", "shortName", "description", "color",
    "earliestReliableDate", "monthlyData"];
  function isValidAsset(a) {
    if (!a || typeof a !== "object") return false;
    for (const f of REQUIRED_FIELDS) if (a[f] == null) return false;
    return Array.isArray(a.monthlyData) && a.monthlyData.length > 0;
  }

  const REGISTERED = window.P2PI_ASSETS || [];
  const ASSETS = REGISTERED.filter((a) => {
    const ok = isValidAsset(a);
    if (!ok) console.warn("[P2Pi] Skipping malformed asset module:", a && a.id, a);
    return ok;
  });

  // Self-check on load — makes an empty/partial registry obvious in the console.
  console.log(
    `[P2Pi] ${ASSETS.length} of ${REGISTERED.length} asset module(s) loaded:`,
    ASSETS.map((a) => a.id).join(", ") || "(none)"
  );

  // --- Portfolio state: which assets are in, and their % weights ---
  const alloc = document.getElementById("alloc-panel");
  const allocSliders = document.getElementById("alloc-sliders");
  const donutWrap = document.getElementById("donut-wrap");
  const chartWrap = document.getElementById("chart-wrap");
  const chartLegend = document.getElementById("chart-legend");

  let selected = ASSETS.length ? [ASSETS[0]] : []; // start with one index
  let weights = equalWeightsFor(selected.length); // percentages, sum 100

  // Even split that always sums to exactly 100 (remainder spread to the first).
  function equalWeightsFor(k) {
    if (k === 0) return [];
    const base = Math.floor(100 / k);
    const w = Array(k).fill(base);
    for (let i = 0; i < 100 - base * k; i++) w[i]++;
    return w;
  }

  // Build the asset cards (multi-select). A red card if none loaded.
  function renderPicker() {
    picker.innerHTML = "";
    if (ASSETS.length === 0) {
      picker.innerHTML =
        `<div class="asset-error">⚠️ Asset data failed to load. Please refresh the page.</div>`;
      runBtn.disabled = true;
      return;
    }
    ASSETS.forEach((asset) => {
      const on = selected.includes(asset);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "asset-card" + (on ? " selected" : "");
      card.setAttribute("role", "checkbox");
      card.setAttribute("aria-checked", on ? "true" : "false");
      card.innerHTML =
        `<span class="asset-name"><span class="asset-dot" style="background:${asset.color}"></span>${asset.shortName}${on ? " ✓" : ""}</span>` +
        `<span class="asset-desc">${asset.description}</span>`;
      card.addEventListener("click", () => toggleAsset(asset));
      picker.appendChild(card);
    });
  }

  // Toggle an asset in/out of the portfolio (keep 1–4). Resets to equal split.
  function toggleAsset(asset) {
    const at = selected.indexOf(asset);
    if (at >= 0) {
      if (selected.length === 1) return; // keep at least one
      selected.splice(at, 1);
    } else {
      if (selected.length >= 4) return; // cap at four
      selected.push(asset);
    }
    weights = equalWeightsFor(selected.length);
    renderPicker();
    renderAllocPanel();
    adaptYearRange();
  }

  // Show/build the allocation panel when 2+ assets are selected.
  function renderAllocPanel() {
    if (selected.length < 2) { alloc.hidden = true; return; }
    alloc.hidden = false;
    allocSliders.innerHTML = selected.map((a, i) =>
      `<div class="alloc-row">
         <span class="alloc-dot" style="background:${a.color}"></span>
         <span class="alloc-name">${a.shortName}</span>
         <input type="range" class="alloc-slider" min="0" max="100" step="1" value="${weights[i]}" data-i="${i}"
                aria-label="${a.shortName} percentage" />
         <span class="alloc-pct" data-i="${i}">${weights[i]}%</span>
       </div>`).join("");
    allocSliders.querySelectorAll(".alloc-slider").forEach((s) => {
      s.addEventListener("input", () => {
        rebalance(+s.dataset.i, +s.value);
        updateAllocUI();
      });
    });
    updateAllocUI();
  }

  // Proportionally rebalance the OTHER weights so everything still sums to 100.
  function rebalance(idx, newVal) {
    newVal = Math.max(0, Math.min(100, Math.round(newVal)));
    const others = weights.map((_, j) => j).filter((j) => j !== idx);
    const othersSum = others.reduce((s, j) => s + weights[j], 0);
    const remaining = 100 - newVal;
    const nw = weights.slice();
    nw[idx] = newVal;
    others.forEach((j) => {
      nw[j] = othersSum > 0 ? (remaining * weights[j]) / othersSum : remaining / others.length;
    });
    others.forEach((j) => (nw[j] = Math.round(nw[j])));
    // Absorb any rounding drift into the largest "other" so the sum is exactly 100.
    const drift = 100 - nw.reduce((a, b) => a + b, 0);
    if (drift !== 0 && others.length) {
      let big = others[0];
      others.forEach((j) => { if (nw[j] > nw[big]) big = j; });
      nw[big] = Math.max(0, nw[big] + drift);
    }
    weights = nw;
  }

  // Push current weights into the sliders, % labels, and the donut.
  function updateAllocUI() {
    allocSliders.querySelectorAll(".alloc-slider").forEach((s) => {
      s.value = weights[+s.dataset.i];
    });
    allocSliders.querySelectorAll(".alloc-pct").forEach((el) => {
      el.textContent = weights[+el.dataset.i] + "%";
    });
    donutWrap.innerHTML = buildDonut(selected.map((a, i) => ({ color: a.color, pct: weights[i] })));
  }

  // Preset chips set the mix for the student (no math on their part).
  function setPreset(name) {
    // "Mostly safe" is a concrete defensive portfolio: 70% Bond ETF / 30% S&P
    // 500. Clicking it builds exactly that mix (adding those two indexes).
    if (name === "safe") {
      const bond = ASSETS.find((a) => a.id === "agg");
      const sp = ASSETS.find((a) => a.id === "sp500");
      if (bond && sp) {
        selected = [bond, sp];
        weights = [70, 30];
        renderPicker();
        renderAllocPanel();
        adaptYearRange();
        return;
      }
      // Fallback (bond data missing): just tilt toward the calmest picks below.
    }

    const k = selected.length;
    if (name === "equal") {
      weights = equalWeightsFor(k);
    } else {
      // Adventurousness rank: Bond (calmest) → NASDAQ (boldest).
      const rank = { agg: 0, dow: 1, sp500: 2, ta35: 3, nasdaq: 4 };
      const raw = selected.map((a) => {
        const rk = rank[a.id] != null ? rank[a.id] : 2;
        return name === "safe" ? 5 - rk : rk + 1; // safe favours calm, adventurous favours bold
      });
      const sum = raw.reduce((a, b) => a + b, 0);
      weights = raw.map((x) => Math.round((100 * x) / sum));
      const drift = 100 - weights.reduce((a, b) => a + b, 0);
      if (drift !== 0) {
        let big = 0;
        weights.forEach((w, i) => { if (w > weights[big]) big = i; });
        weights[big] += drift;
      }
    }
    updateAllocUI();
  }
  document.querySelectorAll(".preset-chip").forEach((chip) => {
    chip.addEventListener("click", () => setPreset(chip.dataset.preset));
  });

  // Clamp the year slider to the LATEST earliest-date among selected assets.
  function adaptYearRange() {
    if (!selected.length) return;
    const years = selected.map((a) => +a.earliestReliableDate.slice(0, 4));
    const minYear = Math.max(...years);
    year.min = minYear;
    if (+year.value < minYear) year.value = minYear;
    if (selected.length === 1) {
      yearNote.textContent = `📅 Data available from ${minYear} for ${selected[0].shortName}.`;
    } else {
      const limiter = selected.find((a) => +a.earliestReliableDate.slice(0, 4) === minYear);
      yearNote.textContent = `📅 Your picks share data from ${minYear} (limited by ${limiter.shortName}).`;
    }
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
  renderAllocPanel();
  adaptYearRange();
  refreshLabels();

  // --- Preset banner (learn→do bridge) ---
  const presetBanner = document.getElementById("preset-banner");
  const presetBannerText = document.getElementById("preset-banner-text");
  const presetBannerClose = document.getElementById("preset-banner-close");
  if (presetBannerClose) presetBannerClose.addEventListener("click", () => (presetBanner.hidden = true));

  runBtn.addEventListener("click", () => {
    if (!selected.length) return; // nothing to simulate if data failed to load
    if (presetBanner) presetBanner.hidden = true; // banner's job is done once they run
    const leverage = +lev.value;
    const allocations = selected.map((a, i) => ({ asset: a, weight: weights[i] / 100 }));
    const result = runPortfolioSimulation(+amt.value, +year.value, leverage, allocations);
    renderResults(result);

    // Reward exploration with coins (shared state; My Coins reads it too).
    P2Pi.addCoins(COINS_PER_RUN);
    const bonus = leverage > 1 ? P2Pi.awardOnce("leverage_tried", 5) : 0;
    showCoinToast(COINS_PER_RUN + bonus, bonus > 0);

    // Hand a results-aware context to the Coach (lives in this tab now).
    const diversificationShown = !document.getElementById("diversify-note").hidden;
    // 1x counterfactual (same picks/allocation/amount/year) for the Coach's math.
    let oneX = result;
    if (leverage !== 1) oneX = runPortfolioSimulation(+amt.value, +year.value, 1, allocations);
    const context = {
      assets: selected.map((a, i) => ({ id: a.id, shortName: a.shortName, weight: weights[i] })),
      amount: +amt.value,
      startYear: result.points[0].date.slice(0, 4),
      endYear: result.points[result.points.length - 1].date.slice(0, 4),
      leverage,
      finalValue: result.finalValue,
      totalProfit: result.profit,
      totalPct: result.pct,
      worstYear: { year: result.worst.year, drop: result.worst.drop },
      marginCall: { happened: !!result.marginCall, date: result.marginCall ? result.marginCall.date : null },
      diversificationShown,
      oneXFinal: oneX.finalValue,
      oneXProfit: oneX.profit,
    };
    if (window.P2PICoach) window.P2PICoach.onSimulation(context);
  });

  /* ------------------------------------------------------------
     Learn→do bridge: a lesson can pre-load the simulator and jump here.
     Exposed globally so learn.js can call it. It sets the controls but
     does NOT run — the student presses the button themselves.
     ------------------------------------------------------------ */
  window.P2PI_loadSimulatorPreset = function (preset, sourceLabel) {
    if (!ASSETS.length || !preset) return;
    // Assets → selection (cap at 4).
    const picks = (preset.assets || [])
      .map((id) => ASSETS.find((a) => a.id === id))
      .filter(Boolean);
    if (picks.length) selected = picks.slice(0, 4);
    // Allocation → weights (only if it matches the selection count).
    if (preset.allocation && preset.allocation.length === selected.length) {
      weights = preset.allocation.slice();
    } else {
      weights = equalWeightsFor(selected.length);
    }
    renderPicker();
    renderAllocPanel();
    // Amount + leverage (clamped to the sliders' ranges).
    if (preset.amount != null) amt.value = Math.min(10000, Math.max(100, preset.amount));
    if (preset.leverage != null) lev.value = Math.min(5, Math.max(1, preset.leverage));
    // Year: clamp to the selection's allowed range AFTER adaptYearRange sets the min.
    adaptYearRange();
    if (preset.startYear != null) {
      year.value = Math.max(+year.min, Math.min(+year.max, preset.startYear));
    }
    refreshLabels();

    // Banner + switch to the Simulate tab, scrolled to the top.
    if (presetBanner) {
      presetBannerText.textContent = `Loaded from ${sourceLabel || "a lesson"} — press the button to run it 👇`;
      presetBanner.hidden = false;
    }
    const simTab = document.querySelector('.tab[data-tab="simulate"]');
    if (simTab) simTab.click();
    const panel = document.getElementById("panel-simulate");
    if (panel) panel.scrollTop = 0;
  };

  function renderResults(r) {
    results.hidden = false;
    const multi = r.legs.length > 1;

    document.getElementById("r-amount").textContent = shekels(r.amount);
    document.getElementById("r-year").textContent = r.startYear;
    document.getElementById("r-asset").textContent = multi ? "your portfolio" : r.legs[0].asset.shortName;

    // Profit / loss line, coloured green up / red down.
    const profitEl = document.getElementById("r-profit");
    const pctEl = document.getElementById("r-pct");
    const up = r.profit >= 0;
    profitEl.textContent = (up ? "+" : "−") + shekels(Math.abs(r.profit));
    profitEl.className = up ? "num-positive" : "num-negative";
    pctEl.textContent = `(${up ? "+" : "−"}${Math.abs(r.pct).toFixed(1)}%)`;
    pctEl.className = up ? "num-positive" : "num-negative";

    // Chart + legend.
    chartWrap.innerHTML = buildChart(r);
    renderChartLegend(r, multi);

    // Per-asset breakdown table (only meaningful for a split).
    renderBreakdown(r, multi);

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

    // Diversification teaching callout — only when it's actually true.
    renderDiversifyNote(r, multi);

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

  // Chart legend: a magenta "Total" swatch, plus a tappable chip per asset
  // (multi only) that toggles that asset's thin line on the chart.
  function renderChartLegend(r, multi) {
    let html = `<span class="legend-item legend-total"><span class="legend-swatch" style="background:var(--color-primary)"></span>Total${multi ? " portfolio" : ""}</span>`;
    if (multi) {
      html += r.legs.map((l) =>
        // Defensive legs start "active" because their line shows by default.
        `<button type="button" class="legend-item leg-toggle${l.asset.defensive ? " active" : ""}" data-leg="${l.asset.id}">
           <span class="legend-swatch" style="background:${l.asset.color}"></span>${l.asset.shortName}</button>`).join("");
      html += `<span class="legend-hint">tap to compare</span>`;
    }
    chartLegend.innerHTML = html;
    chartLegend.querySelectorAll(".leg-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const line = chartWrap.querySelector(`.leg-line[data-leg="${btn.dataset.leg}"]`);
        if (!line) return;
        const show = line.style.display === "none";
        line.style.display = show ? "" : "none";
        btn.classList.toggle("active", show);
      });
    });
  }

  // Per-asset breakdown table: allocated ₪, final ₪, profit ₪ and %.
  function renderBreakdown(r, multi) {
    const bd = document.getElementById("breakdown");
    if (!multi) { bd.hidden = true; return; }
    const row = (name, color, allocated, fin, profit, pct, cls) => {
      const up = profit >= 0;
      return `<tr class="${cls || ""}">
        <td><span class="asset-dot" style="background:${color}"></span>${name}</td>
        <td>${shekels(allocated)}</td>
        <td>${shekels(fin)}</td>
        <td class="${up ? "num-positive" : "num-negative"}">${up ? "+" : "−"}${shekels(Math.abs(profit))}<span class="bd-pct">${up ? "+" : "−"}${Math.abs(pct).toFixed(0)}%</span></td>
      </tr>`;
    };
    bd.hidden = false;
    bd.innerHTML =
      `<table class="bd-table">
        <thead><tr><th>Index</th><th>Put in</th><th>Became</th><th>Profit</th></tr></thead>
        <tbody>
          ${r.legs.map((l) => row(l.asset.shortName, l.asset.color, l.allocated, l.final, l.profit, l.pct)).join("")}
          ${row("Total", "var(--color-primary)", r.amount, r.finalValue, r.profit, r.pct, "bd-total")}
        </tbody>
      </table>`;
  }

  // Show the diversification callout ONLY when the split's worst year is
  // genuinely milder than the worst single asset's worst year (both in ₪).
  function renderDiversifyNote(r, multi) {
    const note = document.getElementById("diversify-note");
    if (!multi) { note.hidden = true; return; }
    let worstSingle = 0, worstName = "";
    selected.forEach((a) => {
      const solo = runSimulationMath(+amt.value, +year.value, +lev.value, a);
      if (solo.worst.drop > worstSingle) { worstSingle = solo.worst.drop; worstName = a.shortName; }
    });
    if (worstSingle > 0 && r.worst.drop < worstSingle) {
      note.hidden = false;
      note.innerHTML =
        `🌱 <strong>Notice:</strong> spreading your money softened the worst year — your mix was ` +
        `only down <strong>${shekels(r.worst.drop)}</strong>, versus <strong>${shekels(worstSingle)}</strong> ` +
        `if you'd put it all in ${worstName}. That's <strong>diversification</strong> at work.`;
    } else {
      note.hidden = true;
    }
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
    : `🪙 +${n} P2π coin${n === 1 ? "" : "s"}!`;
  toast.hidden = false;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 300);
  }, 1800);
}
