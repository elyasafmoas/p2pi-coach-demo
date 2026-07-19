/* ============================================================
   My Portfolio — a static "as of today" demo account (2026).

   Stage 1: headline KPIs + total-value chart with period chips.
   Stage 2: per-asset breakdown (donut + holdings rows + sparklines + row-tap
   highlights), a computed best/worst insight, and a demo newsletter card.

   "Today" and all dates are derived from the data (last row), never hardcoded.
   ============================================================ */
(function initPortfolio() {
  const inner = document.getElementById("pf-inner");
  const data = window.P2PI_PORTFOLIO_2026;
  if (!inner || !data) return;

  const series = data.series;
  const allocations = data.allocations;
  const invested = data.invested;
  const last = series[series.length - 1];
  const first = series[0];
  const balance = last.total;
  const profit = balance - invested;
  const pct = (profit / invested) * 100;
  const amountOf = {};
  allocations.forEach((a) => (amountOf[a.id] = a.amount));

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shk = (n) => "₪" + Math.round(n).toLocaleString("en-US");
  const shk2 = (n) => "₪" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  }
  const up = profit >= 0;

  /* ---------- per-asset performance figures ---------- */
  const holdings = allocations.map((a) => {
    const today = last.assets[a.id];
    const allocated = a.amount;
    const p = today - allocated;
    return { ...a, today, allocated, profit: p, pct: (p / allocated) * 100 };
  });

  /* ---------- hedging / "insurance" mechanics (all simplified & illustrative) ---------- */
  // Illustrative USD/ILS daily series — NOT a live feed. A gentle wave used only
  // to demonstrate the currency-shield mechanic (the baked US-asset ₪ values are
  // treated as embedding this FX, so the shield "removes" its wobble).
  const FX_ANCHORS = [3.70, 3.78, 3.66, 3.72, 3.75];
  const fx = series.map((_, i) => {
    const seg = (i / (series.length - 1)) * (FX_ANCHORS.length - 1);
    const a = Math.min(Math.floor(seg), FX_ANCHORS.length - 2);
    return FX_ANCHORS[a] + (FX_ANCHORS[a + 1] - FX_ANCHORS[a]) * (seg - a);
  });
  const fx0 = fx[0], fxEnd = fx[fx.length - 1];

  const US_IDS = ["sp500", "nasdaq", "dow", "agg"]; // TA-35 is the only local asset
  const usValueAt = (row) => US_IDS.reduce((s, id) => s + row.assets[id], 0);
  const usEnd = usValueAt(last);
  const monthsElapsed =
    (new Date(last.date) - new Date(data.investedDate)) / (1000 * 60 * 60 * 24) / 30.44;

  // Currency shield: 0.1%/month of protected (US) value; flattens FX wobble.
  const currencyPremium = Math.round(0.001 * monthsElapsed * usEnd);
  const fxComponentEnd = usEnd * (1 - fx0 / fxEnd); // FX-driven ₪ on US assets at today
  let currencyWobble = 0;
  series.forEach((row, i) => {
    const dev = Math.abs(usValueAt(row) * (fx[i] / fx0 - 1));
    if (dev > currencyWobble) currencyWobble = dev;
  });
  currencyWobble = Math.round(currencyWobble);

  // Loss protection: a simplified put — floor at −10%, one-time 1.5% premium.
  const lossFloor = Math.round(invested * 0.9);      // ₪9,000
  const lossPremium = Math.round(invested * 0.015);  // ₪150

  let currencyOn = false, lossOn = false, currentPeriod = "YTD";
  // Net-of-premium balance shown on the KPI cards when protections are toggled.
  function displayedTotal() {
    let t = balance;
    if (currencyOn) t += -fxComponentEnd - currencyPremium; // remove FX gain + pay premium
    if (lossOn) t += Math.max(0, lossFloor - balance) - lossPremium; // payout (0 here) − premium
    return t;
  }

  /* ---------- best / worst insight (computed) ---------- */
  const best = holdings.reduce((m, h) => (h.pct > m.pct ? h : m), holdings[0]);
  const worst = holdings.reduce((m, h) => (h.pct < m.pct ? h : m), holdings[0]);
  const worstPhrase = worst.pct < 0
    ? `${worst.name} is napping (−${Math.abs(worst.pct).toFixed(1)}%)`
    : `${worst.name} is taking it slow (+${worst.pct.toFixed(1)}%)`;
  const insight =
    `📊 <strong>${best.name}</strong> is pulling the wagon (+${best.pct.toFixed(1)}%), while ${worstPhrase} — ` +
    `spreading your money is why one bad apple doesn't spoil the whole account.`;

  /* ---------- static shell ---------- */
  inner.innerHTML = `
    <div class="pf-head">
      <h1 class="pf-title">My Portfolio</h1>
      <span class="pf-asof">as of ${fmtDate(last.date)}</span>
    </div>

    <div class="pf-balance-card">
      <div class="pf-live"><span class="pf-dot"></span> Demo account</div>
      <div class="pf-balance-label">Total balance</div>
      <div class="pf-balance num-key" id="pf-balance">${shk(balance)}</div>
      <div class="pf-pl" id="pf-pl">
        <span class="${up ? "num-positive" : "num-negative"}">${up ? "+" : "−"}${shk2(Math.abs(profit))}</span>
        <span class="${up ? "num-positive" : "num-negative"}">(${up ? "+" : "−"}${Math.abs(pct).toFixed(2)}%)</span>
      </div>
      <div class="pf-protect-note" id="pf-protect-note" hidden>🛡️ includes protection costs</div>
      <div class="pf-invested">Invested: ${shk(invested)} · ${fmtDate(data.investedDate)}</div>
    </div>

    <div class="pf-period" id="pf-period" role="group" aria-label="Chart period">
      <button class="pf-chip" data-p="1W" type="button">1W</button>
      <button class="pf-chip" data-p="1M" type="button">1M</button>
      <button class="pf-chip" data-p="3M" type="button">3M</button>
      <button class="pf-chip active" data-p="YTD" type="button">YTD</button>
    </div>
    <div class="pf-chart-wrap" id="pf-chart"></div>

    <h2 class="pf-section">Where your money is</h2>
    <div class="pf-alloc">
      <div class="donut-wrap" id="pf-donut"></div>
      <div class="pf-holdings" id="pf-holdings"></div>
    </div>
    <p class="pf-hint">Tap a holding to trace its line on the chart above.</p>

    <div class="diversify-note" id="pf-insight">${insight}</div>

    <!-- Protection / hedging (demo) -->
    <div class="pf-protect" id="pf-protect"></div>

    <!-- Newsletter (demo) -->
    <div class="pf-news" id="pf-news"></div>

    <p class="sim-disclaimer">Illustrative demo account — invented 2026 data, not real market
      data and not a prediction.</p>`;

  const balanceEl = document.getElementById("pf-balance");
  const chartWrap = document.getElementById("pf-chart");
  const activeLines = new Set(); // asset ids currently traced on the main chart

  /* ---------- period filtering ---------- */
  function cutoffFor(period) {
    const [y, m, d] = last.date.split("-").map(Number);
    const end = new Date(Date.UTC(y, m - 1, d));
    const c = new Date(end);
    if (period === "1W") c.setUTCDate(c.getUTCDate() - 7);
    else if (period === "1M") c.setUTCMonth(c.getUTCMonth() - 1);
    else if (period === "3M") c.setUTCMonth(c.getUTCMonth() - 3);
    else return null;
    return c.toISOString().slice(0, 10);
  }
  function rowsFor(period) {
    const cut = cutoffFor(period);
    const rows = cut ? series.filter((p) => p.date >= cut) : series;
    return rows.length > 1 ? rows : series.slice(-2);
  }

  /* ---------- SVG helpers (adapted from the simulator) ---------- */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  // Per-asset chart lines are rebased to the ₪10,000 invested amount, so the
  // total (your diversified result) and each "all-in that asset" line share
  // one honest ₪ scale — perfect for the "who's pulling the wagon" story.
  function rebased(rows, id) { return rows.map((r) => invested * (r.assets[id] / amountOf[id])); }

  function drawChart(period) {
    const rows = rowsFor(period);
    const totalVals = rows.map((r) => r.total);
    const assetLines = allocations.map((a) => ({ id: a.id, color: a.color, vals: rebased(rows, a.id) }));

    const C = cssVar("--color-primary") || "#FF0083";
    const C_MUTED = cssVar("--color-text-muted") || "#6B6B6B";
    const W = 340, H = 170, padX = 8, padTop = 14, padBot = 22;
    // Stable scale over the total + every asset line + invested, so toggling a
    // line just reveals it (no jarring rescale). Include the loss floor when on.
    let all = totalVals.concat([invested]);
    assetLines.forEach((s) => (all = all.concat(s.vals)));
    if (lossOn) all = all.concat([lossFloor]);
    const lo = Math.min(...all), hi = Math.max(...all), range = hi - lo || 1;
    const x = (i) => padX + (i * (W - 2 * padX)) / Math.max(1, rows.length - 1);
    const y = (v) => padTop + (H - padTop - padBot) * (1 - (v - lo) / range);
    const toLine = (vals) => vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

    const totalLine = toLine(totalVals);
    const area = `M ${x(0).toFixed(1)},${(H - padBot).toFixed(1)} L ${totalLine.split(" ").join(" L ")} L ${x(rows.length - 1).toFixed(1)},${(H - padBot).toFixed(1)} Z`;
    const endX = x(rows.length - 1), endY = y(totalVals[totalVals.length - 1]);
    const baseY = y(invested).toFixed(1);
    const legLines = assetLines.map((s) =>
      `<polyline data-asset="${s.id}" points="${toLine(s.vals)}" fill="none" stroke="${s.color}"
         stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"
         style="display:${activeLines.has(s.id) ? "" : "none"}"/>`).join("");

    chartWrap.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="sim-chart" role="img" aria-label="Portfolio value over time">
        <defs>
          <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${C}" stop-opacity="0.20"/>
            <stop offset="100%" stop-color="${C}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#pfFill)"/>
        <line x1="${padX}" y1="${baseY}" x2="${W - padX}" y2="${baseY}" stroke="${C_MUTED}" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>
        <text x="${padX}" y="${(+baseY - 4).toFixed(1)}" fill="${C_MUTED}" font-size="8">invested ${shk(invested)}</text>
        ${lossOn ? `<line x1="${padX}" y1="${y(lossFloor).toFixed(1)}" x2="${W - padX}" y2="${y(lossFloor).toFixed(1)}" stroke="${cssVar("--color-warning") || "#E5484D"}" stroke-width="1.5" stroke-dasharray="5 3"/>
        <text x="${W - padX}" y="${(y(lossFloor) - 4).toFixed(1)}" text-anchor="end" fill="${cssVar("--color-warning") || "#E5484D"}" font-size="8" font-weight="700">protection floor ${shk(lossFloor)}</text>` : ""}
        ${legLines}
        <polyline points="${totalLine}" fill="none" stroke="${C}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="3.5" fill="${C}"/>
        <text x="${padX}" y="${H - 6}" fill="${C_MUTED}" font-size="9">${fmtDate(rows[0].date)}</text>
        <text x="${W - padX}" y="${H - 6}" text-anchor="end" fill="${C_MUTED}" font-size="9">${fmtDate(rows[rows.length - 1].date)}</text>
      </svg>`;
  }

  // Tiny sparkline of one asset's full journey (mini chart variant).
  function sparkline(id, color) {
    const vals = series.map((r) => r.assets[id]);
    const W = 60, H = 22, pad = 2;
    const lo = Math.min(...vals), hi = Math.max(...vals), range = hi - lo || 1;
    const pts = vals.map((v, i) =>
      `${(pad + (i * (W - 2 * pad)) / (vals.length - 1)).toFixed(1)},${(pad + (H - 2 * pad) * (1 - (v - lo) / range)).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" class="pf-spark" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  // Donut of CURRENT allocation by value.
  function donut(entries) {
    const size = 104, r = 40, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
    let off = 0;
    const rings = entries.map((e) => {
      const len = (e.pct / 100) * C;
      const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${e.color}" stroke-width="15"
        stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
        transform="rotate(-90 ${cx} ${cy})"/>`;
      off += len;
      return seg;
    }).join("");
    return `<svg viewBox="0 0 ${size} ${size}" class="donut" aria-hidden="true">${rings}</svg>`;
  }

  /* ---------- render breakdown ---------- */
  document.getElementById("pf-donut").innerHTML =
    donut(holdings.map((h) => ({ color: h.color, pct: (h.today / balance) * 100 })));

  const holdingsEl = document.getElementById("pf-holdings");
  holdingsEl.innerHTML = holdings.map((h) => {
    const gain = h.profit >= 0;
    return `<button class="pf-holding" data-asset="${h.id}" type="button">
      <span class="pf-h-main">
        <span class="pf-h-name"><span class="asset-dot" style="background:${h.color}"></span>${h.name}</span>
        <span class="pf-h-flow">${shk(h.allocated)} → ${shk(h.today)}</span>
      </span>
      ${sparkline(h.id, h.color)}
      <span class="pf-h-vals">
        <span class="${gain ? "num-positive" : "num-negative"} pf-h-profit">${gain ? "+" : "−"}${shk(Math.abs(h.profit))}</span>
        <span class="${gain ? "num-positive" : "num-negative"} pf-h-pct">${gain ? "+" : "−"}${Math.abs(h.pct).toFixed(1)}%</span>
      </span>
    </button>`;
  }).join("");

  holdingsEl.querySelectorAll(".pf-holding").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.dataset.asset;
      if (activeLines.has(id)) activeLines.delete(id);
      else activeLines.add(id);
      row.classList.toggle("active", activeLines.has(id));
      const line = chartWrap.querySelector(`polyline[data-asset="${id}"]`);
      if (line) line.style.display = activeLines.has(id) ? "" : "none";
    });
  });

  // Period chips.
  const periodBox = document.getElementById("pf-period");
  periodBox.querySelectorAll(".pf-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      periodBox.querySelectorAll(".pf-chip").forEach((c) => c.classList.toggle("active", c === chip));
      currentPeriod = chip.dataset.p;
      drawChart(currentPeriod);
    });
  });

  /* ---------- protection / hedging (demo) ---------- */
  const EXPLAINERS = {
    currency: {
      title: "Currency shield 🛡️",
      body: [
        "When you own U.S. investments, your money takes two rides at once: how the stocks do, AND how the dollar moves against the shekel. A currency shield (in real life, an FX hedge) is basically insurance on that second ride — it locks in today's exchange rate so a swinging dollar doesn't add extra bumps to your balance.",
        "Like any insurance, it isn't free — you pay a small ongoing premium, and in calm currency times it can feel like money spent for nothing. Big funds hedge to make their returns smoother and more predictable, especially when they can't afford surprises. Whether that smoothness is worth the cost is a personal call — I just show you the mechanics.",
      ],
    },
    loss: {
      title: "Loss protection 🛡️",
      body: [
        "Loss protection here works like a put option — think of it as a deductible in reverse. You pay a one-time premium up front, and in exchange there's a floor under your account: no matter how bad things get, your balance can't fall below a set level (here, −10%, or ₪9,000). The scary downside gets capped.",
        "The trade-off is real: that premium comes straight off the top, so in good times you keep a little less. Professionals buy this kind of protection when the peace of mind — or not being forced to sell in a crash — is worth more than the cost. Whether it's worth it for you is a personal call — I just show you the mechanics.",
      ],
    },
  };

  function renderProtect() {
    const el = document.getElementById("pf-protect");
    el.innerHTML = `
      <h2 class="pf-section">Protect your portfolio 🛡️</h2>
      <p class="pf-protect-intro">Investors can buy protection — like insurance for your money. Try toggling these and watch what they'd do.</p>

      <div class="pf-product">
        <div class="pf-product-head">
          <div class="pf-product-info">
            <div class="pf-product-name">Currency shield</div>
            <div class="pf-product-desc">Protects your U.S. assets from USD/ILS exchange swings.</div>
          </div>
          <label class="pf-switch"><input type="checkbox" id="pf-currency" aria-label="Currency shield" /><span class="pf-track"></span></label>
        </div>
        <div class="pf-product-detail" id="pf-currency-detail" hidden></div>
        <div class="pf-product-foot">
          <button class="pf-explain" type="button" data-explain="currency">How does this work?</button>
          <span class="pf-price">Illustrative pricing · 0.1%/month of protected value</span>
        </div>
      </div>

      <div class="pf-product">
        <div class="pf-product-head">
          <div class="pf-product-info">
            <div class="pf-product-name">Loss protection</div>
            <div class="pf-product-desc">Caps your maximum loss at −10% (${shk(lossFloor)}) — like a deductible in reverse.</div>
          </div>
          <label class="pf-switch"><input type="checkbox" id="pf-loss" aria-label="Loss protection" /><span class="pf-track"></span></label>
        </div>
        <div class="pf-product-detail" id="pf-loss-detail" hidden></div>
        <div class="pf-product-foot">
          <button class="pf-explain" type="button" data-explain="loss">How does this work?</button>
          <span class="pf-price">Illustrative pricing · 1.5% of protected value, one-time</span>
        </div>
      </div>
      <div class="pf-coin-flash" id="pf-coin-flash" hidden></div>`;

    document.getElementById("pf-currency").addEventListener("change", (e) => { currencyOn = e.target.checked; onToggle(); });
    document.getElementById("pf-loss").addEventListener("change", (e) => { lossOn = e.target.checked; onToggle(); });
    el.querySelectorAll(".pf-explain").forEach((b) => b.addEventListener("click", () => openExplainer(b.dataset.explain)));
  }

  function onToggle() {
    const cd = document.getElementById("pf-currency-detail");
    if (currencyOn) {
      cd.hidden = false;
      cd.innerHTML = `Without shield: your U.S. assets carry currency ups and downs of <strong>±${shk(currencyWobble)}</strong> this period · ` +
        `With shield: that wobble is flattened — for a total premium of <strong>${shk(currencyPremium)}</strong> since Jan 1.`;
    } else cd.hidden = true;

    const ld = document.getElementById("pf-loss-detail");
    if (lossOn) {
      ld.hidden = false;
      ld.innerHTML = `Your balance could never have fallen below <strong>${shk(lossFloor)}</strong> — cost: <strong>${shk(lossPremium)}</strong>.`;
    } else ld.hidden = true;

    updateKPIs();
    drawChart(currentPeriod);

    // +5 the first time any protection is tried.
    const got = P2Pi.awardOnce("protection_tried", 5);
    if (got > 0) {
      if (typeof showCoinToast === "function") showCoinToast(5, false);
      const f = document.getElementById("pf-coin-flash");
      f.textContent = "🪙 Curiosity pays — +5 coins for exploring!";
      f.hidden = false;
      setTimeout(() => { f.hidden = true; }, 2800);
    }
  }

  function updateKPIs() {
    const t = displayedTotal();
    const p = t - invested;
    const gain = p >= 0;
    balanceEl.textContent = shk(t);
    document.getElementById("pf-pl").innerHTML =
      `<span class="${gain ? "num-positive" : "num-negative"}">${gain ? "+" : "−"}${shk2(Math.abs(p))}</span> ` +
      `<span class="${gain ? "num-positive" : "num-negative"}">(${gain ? "+" : "−"}${Math.abs((p / invested) * 100).toFixed(2)}%)</span>`;
    document.getElementById("pf-protect-note").hidden = !(currencyOn || lossOn);
  }

  // Explainer overlay (Coach voice).
  function openExplainer(kind) {
    const ov = document.getElementById("pf-explain-overlay");
    const ex = EXPLAINERS[kind];
    if (!ov || !ex) return;
    document.getElementById("pf-explain-title").textContent = ex.title;
    document.getElementById("pf-explain-body").innerHTML = ex.body.map((p) => `<p>${p}</p>`).join("");
    ov.hidden = false;
  }
  (function wireExplainer() {
    const ov = document.getElementById("pf-explain-overlay");
    if (!ov) return;
    const close = () => (ov.hidden = true);
    document.getElementById("pf-explain-close").addEventListener("click", close);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  })();

  renderProtect();

  /* ---------- newsletter (demo) ---------- */
  // In production this would POST the email to a mailing-list service. The demo
  // only remembers a local flag so the success state survives a refresh.
  const NEWS_KEY = "p2pi_newsletter";
  const isSubscribed = () => { try { return localStorage.getItem(NEWS_KEY) === "1"; } catch (e) { return false; } };
  const newsEl = document.getElementById("pf-news");
  const TEASER =
    `<button class="pf-teaser" id="pf-teaser" type="button">📰 Last issue: Why did tech stocks wobble in March? →</button>`;

  function renderNewsletterForm() {
    newsEl.innerHTML = `
      <div class="pf-news-card">
        <h3>Want to get smarter every week? 📬</h3>
        <p>The <strong>P2π Weekly</strong> — 3 minutes on markets, money, and one thing worth learning.</p>
        <form class="pf-news-form" id="pf-news-form" novalidate>
          <input type="email" id="pf-email" class="pf-email" inputmode="email" autocomplete="email"
            placeholder="your@email.com" aria-label="Email address" />
          <button type="submit" class="run-btn pf-subscribe">Count me in</button>
        </form>
        <p class="pf-news-err" id="pf-news-err" hidden></p>
      </div>
      ${TEASER}`;
    const form = document.getElementById("pf-news-form");
    const email = document.getElementById("pf-email");
    const err = document.getElementById("pf-news-err");

    // Validation runs ONLY on submit; the message clears as soon as the user edits.
    function clearError() { err.hidden = true; err.textContent = ""; }
    email.addEventListener("input", clearError);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        err.textContent = "Hmm, that doesn't look like an email — mind checking it? 🙂";
        err.hidden = false;
        email.focus();
        return;
      }
      clearError();
      try { localStorage.setItem(NEWS_KEY, "1"); } catch (e2) { /* ignore */ }
      renderNewsletterSuccess(true);
    });
    wireTeaser();
  }

  function renderNewsletterSuccess(celebrate) {
    newsEl.innerHTML = `
      <div class="pf-news-card success">
        <div class="pf-confetti" id="pf-confetti"></div>
        <h3>You're in! 🎉</h3>
        <p>First issue hits your inbox <strong>Monday</strong>. Keep an eye out!</p>
        <button class="pf-unsub" id="pf-unsub" type="button">unsubscribe</button>
      </div>
      ${TEASER}`;
    document.getElementById("pf-unsub").addEventListener("click", () => {
      try { localStorage.removeItem(NEWS_KEY); } catch (e) { /* ignore */ }
      renderNewsletterForm();
    });
    if (celebrate) {
      const c = document.getElementById("pf-confetti");
      for (let i = 0; i < 8; i++) {
        const s = document.createElement("span");
        s.textContent = ["🎉", "🎊", "✨", "🪙"][i % 4];
        s.style.left = 8 + i * 11 + "%";
        s.style.animationDelay = i * 0.05 + "s";
        c.appendChild(s);
      }
      setTimeout(() => (c.innerHTML = ""), 1400);
    }
    wireTeaser();
  }

  function wireTeaser() {
    const t = document.getElementById("pf-teaser");
    if (t) t.addEventListener("click", () => {
      // Best-fit lesson: Finance 101 → "Risk and reward" (index 3).
      if (window.P2PILearn) window.P2PILearn.openLesson("finance101", 3);
    });
  }

  if (isSubscribed()) renderNewsletterSuccess(false);
  else renderNewsletterForm();

  /* ---------- count-up on first view ---------- */
  let countUpRAF = null;
  function countUp(el, target) {
    if (countUpRAF) cancelAnimationFrame(countUpRAF);
    const dur = 1100;
    let start = null;
    function frame(ts) {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      el.textContent = shk(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) countUpRAF = requestAnimationFrame(frame);
    }
    countUpRAF = requestAnimationFrame(frame);
  }

  drawChart("YTD");

  let animated = false;
  const tabBtn = document.querySelector('.tab[data-tab="portfolio"]');
  if (tabBtn) tabBtn.addEventListener("click", () => {
    if (animated) return;
    animated = true;
    countUp(balanceEl, balance);
  });
})();
