/* ============================================================
   My Portfolio — a static "as of today" demo account (2026).

   Renders headline KPIs (balance, profit) + a total-value line chart with
   period chips, all from data/portfolio2026.js. "Today" and every date are
   derived from the data (last row), never hardcoded here.
   ============================================================ */
(function initPortfolio() {
  const inner = document.getElementById("pf-inner");
  const data = window.P2PI_PORTFOLIO_2026;
  if (!inner || !data) return;

  const series = data.series;
  const invested = data.invested;
  const last = series[series.length - 1];
  const balance = last.total;
  const profit = balance - invested;
  const pct = (profit / invested) * 100;

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shk = (n) => "₪" + Math.round(n).toLocaleString("en-US");
  const shk2 = (n) => "₪" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // "2026-07-17" -> "Jul 17, 2026" (derived, never hardcoded)
  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  }

  /* ---------- static shell ---------- */
  const up = profit >= 0;
  inner.innerHTML = `
    <div class="pf-head">
      <h1 class="pf-title">My Portfolio</h1>
      <span class="pf-asof">as of ${fmtDate(last.date)}</span>
    </div>

    <div class="pf-balance-card">
      <div class="pf-live"><span class="pf-dot"></span> Demo account</div>
      <div class="pf-balance-label">Total balance</div>
      <div class="pf-balance num-key" id="pf-balance">${shk(balance)}</div>
      <div class="pf-pl">
        <span class="${up ? "num-positive" : "num-negative"}">${up ? "+" : "−"}${shk2(Math.abs(profit))}</span>
        <span class="${up ? "num-positive" : "num-negative"}">(${up ? "+" : "−"}${Math.abs(pct).toFixed(2)}%)</span>
      </div>
      <div class="pf-invested">Invested: ${shk(invested)} · ${fmtDate(data.investedDate)}</div>
    </div>

    <div class="pf-period" id="pf-period" role="group" aria-label="Chart period">
      <button class="pf-chip" data-p="1W" type="button">1W</button>
      <button class="pf-chip" data-p="1M" type="button">1M</button>
      <button class="pf-chip" data-p="3M" type="button">3M</button>
      <button class="pf-chip active" data-p="YTD" type="button">YTD</button>
    </div>
    <div class="pf-chart-wrap" id="pf-chart"></div>

    <p class="sim-disclaimer">Illustrative demo account — invented 2026 data, not real
      market data and not a prediction.</p>`;

  const balanceEl = document.getElementById("pf-balance");
  const chartWrap = document.getElementById("pf-chart");

  /* ---------- period filtering ---------- */
  function cutoffFor(period) {
    const [y, m, d] = last.date.split("-").map(Number);
    const end = new Date(Date.UTC(y, m - 1, d));
    const c = new Date(end);
    if (period === "1W") c.setUTCDate(c.getUTCDate() - 7);
    else if (period === "1M") c.setUTCMonth(c.getUTCMonth() - 1);
    else if (period === "3M") c.setUTCMonth(c.getUTCMonth() - 3);
    else return null; // YTD = everything
    return c.toISOString().slice(0, 10);
  }
  function pointsFor(period) {
    const cut = cutoffFor(period);
    const pts = (cut ? series.filter((p) => p.date >= cut) : series).map((p) => ({ date: p.date, value: p.total }));
    return pts.length > 1 ? pts : series.slice(-2).map((p) => ({ date: p.date, value: p.total }));
  }

  /* ---------- SVG line chart (adapted from the simulator's) ---------- */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function drawChart(period) {
    const pts = pointsFor(period);
    const C = cssVar("--color-primary") || "#FF0083";
    const C_MUTED = cssVar("--color-text-muted") || "#6B6B6B";
    const W = 340, H = 170, padX = 8, padTop = 14, padBot = 22;
    const vals = pts.map((p) => p.value);
    // Show the "invested" baseline only when it's within view (e.g. YTD).
    const showBase = invested >= Math.min(...vals) && invested <= Math.max(...vals);
    const lo = Math.min(...vals, showBase ? invested : Infinity);
    const hi = Math.max(...vals, showBase ? invested : -Infinity);
    const range = hi - lo || 1;
    const x = (i) => padX + (i * (W - 2 * padX)) / Math.max(1, pts.length - 1);
    const y = (v) => padTop + (H - padTop - padBot) * (1 - (v - lo) / range);
    const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
    const area = `M ${x(0).toFixed(1)},${(H - padBot).toFixed(1)} L ${line.split(" ").join(" L ")} L ${x(pts.length - 1).toFixed(1)},${(H - padBot).toFixed(1)} Z`;
    const endX = x(pts.length - 1), endY = y(pts[pts.length - 1].value);
    const baseY = showBase ? y(invested).toFixed(1) : null;

    chartWrap.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="sim-chart" role="img" aria-label="Portfolio value over time">
        <defs>
          <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${C}" stop-opacity="0.20"/>
            <stop offset="100%" stop-color="${C}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#pfFill)"/>
        ${baseY ? `<line x1="${padX}" y1="${baseY}" x2="${W - padX}" y2="${baseY}" stroke="${C_MUTED}" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>
        <text x="${padX}" y="${(+baseY - 4).toFixed(1)}" fill="${C_MUTED}" font-size="8">invested ${shk(invested)}</text>` : ""}
        <polyline points="${line}" fill="none" stroke="${C}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="3.5" fill="${C}"/>
        <text x="${padX}" y="${H - 6}" fill="${C_MUTED}" font-size="9">${fmtDate(pts[0].date)}</text>
        <text x="${W - padX}" y="${H - 6}" text-anchor="end" fill="${C_MUTED}" font-size="9">${fmtDate(pts[pts.length - 1].date)}</text>
      </svg>`;
  }

  // Period chips.
  const periodBox = document.getElementById("pf-period");
  periodBox.querySelectorAll(".pf-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      periodBox.querySelectorAll(".pf-chip").forEach((c) => c.classList.toggle("active", c === chip));
      drawChart(chip.dataset.p);
    });
  });

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

  // Run the balance count-up the first time the tab is opened (so it's seen).
  let animated = false;
  const tabBtn = document.querySelector('.tab[data-tab="portfolio"]');
  if (tabBtn) {
    tabBtn.addEventListener("click", () => {
      if (animated) return;
      animated = true;
      countUp(balanceEl, balance);
    });
  }
})();
