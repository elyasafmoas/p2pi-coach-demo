/* ============================================================
   P2Pi Coach — results-aware contextual help (lives in the Simulate tab).

   The Coach appears AFTER a simulation runs. simulate.js builds a
   SimulationContext each run and calls window.P2PICoach.onSimulation(ctx).
   The Coach then:
   - generates suggested chips FROM that context,
   - answers with the user's ACTUAL numbers (template-aware),
   - and still hard-blocks advice-seeking with the guardrail card.

   It also keeps a general educational Q&A bank (the same concepts are
   taught in the Learn courses) for free-text questions, plus a graceful
   fallback. Everything the coach "says" lives in data structures below.
   ============================================================ */

/* ------------------------------------------------------------
   1. GUARDRAIL — advice-seeking intent (checked FIRST, blocks answers)
   ------------------------------------------------------------ */
const ADVICE_PATTERNS = [
  /\bshould i\b/i,
  /what should i (do|buy|invest|pick|choose)( next)?/i,
  /what.* should i (do|buy|pick) next/i,
  /(tell|show) me what to (buy|do|invest|pick)/i,
  /what (do you )?(recommend|suggest)/i,
  /\brecommend\b/i,
  /which (asset|index|stock|fund|etf|coin|one) (is|would be) (the )?best/i,
  /what.*(the )?best (asset|index|stock|thing) to (buy|pick)/i,
  /is (it|now|this|that) a good (time|idea) to (invest|buy)/i,
  /is .* a good investment for me/i,
  /how much (leverage|money|risk) should i/i,
  /which (stock|fund|etf|coin|asset) should i/i,
  /should i (add|use|try|increase|go higher on) .*(leverage|risk)/i,
  /what would you do/i,
  /is .* worth (buying|it)/i,
];

// Context-aware reframe shown inside the guardrail card. When we have a
// result on screen, the offer points back at explaining THIS result.
function reframeFor(text, ctx) {
  const t = text.toLowerCase();
  const explainChip = { label: "Explain my result in simple words", intent: "explain" };
  if (t.includes("leverage")) {
    return {
      body: "I can explain what leverage DID to this result — but whether to use it, and how much, is your call, not mine. It depends on your goals, your timeline, and how much loss you could stomach.",
      offer: "Want me to break down how leverage changed this exact result?",
      chip: ctx && ctx.leverage > 1 ? { label: "What would 1x have looked like?", intent: "leveragecompare" } : explainChip,
    };
  }
  if (t.includes("best") || t.includes("pick") || t.includes("buy") || t.includes("choose") || t.includes("which")) {
    return {
      body: "I can’t tell you which to pick — choosing investments for someone is personal advice, and that stays with you. What I can do is explain what each choice does, using your own results.",
      offer: "Want me to explain your result in plain words instead?",
      chip: explainChip,
    };
  }
  return {
    body: "I can teach you how this all works — but deciding what to do next with your money is yours to make, not mine. Let’s build your understanding so the choice is truly yours.",
    offer: "Want me to walk through what just happened in your simulation?",
    chip: explainChip,
  };
}

/* ------------------------------------------------------------
   2. RESULTS-AWARE ANSWERS — interpolate the user's real numbers.
   ------------------------------------------------------------ */
// Brief, real-world one-liners for the big crashes (worst-year question).
const CRASH_NOTES = {
  "2000": "the dot-com bubble burst — years of hype around internet companies unwound, and tech-heavy prices slid for over two years.",
  "2008": "the global financial crisis hit — a housing and banking meltdown spread worldwide and dragged almost every market down together.",
  "2020": "the COVID-19 pandemic struck — markets plunged in just a few weeks as the world locked down, then recovered surprisingly fast.",
  "2022": "inflation jumped and interest rates rose sharply — which pushed stocks AND bonds down at the same time, an unusually tough combo.",
};

const shk = (n) => "₪" + Math.round(n).toLocaleString("en-US");
function monthLabel(ym) {
  const names = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const [y, m] = ym.split("-");
  return names[+m - 1] + " " + y;
}
function assetList(ctx) {
  if (ctx.assets.length === 1) return ctx.assets[0].shortName;
  return ctx.assets.map((a) => `${a.shortName} (${a.weight}%)`).join(" + ");
}

function ctxExplain(ctx) {
  const grew = ctx.totalProfit >= 0;
  let msg =
    `Here’s the plain-words version: you put in ${shk(ctx.amount)} across ${assetList(ctx)}, ` +
    `and over ${ctx.startYear}–${ctx.endYear} at ${ctx.leverage}x it ${grew ? "grew to" : "shrank to"} ` +
    `about ${shk(ctx.finalValue)} — a ${grew ? "gain" : "loss"} of roughly ${shk(Math.abs(ctx.totalProfit))} ` +
    `(${grew ? "+" : "−"}${Math.abs(ctx.totalPct).toFixed(0)}%).`;
  if (ctx.marginCall.happened) {
    msg += ` It didn’t run the full stretch, though — a margin call in ${monthLabel(ctx.marginCall.date)} closed your leveraged position early.`;
  } else if (ctx.worstYear.drop > 0) {
    msg += ` The scariest moment was around ${ctx.worstYear.year}, when you were down about ${shk(ctx.worstYear.drop)} from your high — and it recovered from there.`;
  }
  return msg;
}

function ctxWorstYear(ctx) {
  const note = CRASH_NOTES[ctx.worstYear.year] ||
    "markets simply hit a rough patch — dips like this happen periodically, and historically they’ve recovered given time.";
  return (
    `In ${ctx.worstYear.year}, your portfolio was down about ${shk(ctx.worstYear.drop)} from its high point. ` +
    `In the real world, ${note} The important part: a dip on paper only becomes a real loss if you sell — ` +
    `staying invested is what lets a recovery reach you.`
  );
}

function ctxMarginCall(ctx) {
  return (
    `Your ${ctx.leverage}x leverage meant you were investing with borrowed money, so when the market fell around ` +
    `${monthLabel(ctx.marginCall.date)}, your losses grew about ${ctx.leverage}× as fast. Your own cushion got too thin, ` +
    `so the lender automatically sold your position to protect their loan — that’s a margin call. You walked away with ` +
    `roughly ${shk(ctx.finalValue)}. Here’s the kicker: without leverage (1x), the same ${shk(ctx.amount)} would’ve ended ` +
    `around ${shk(ctx.oneXFinal)} — because it would’ve stayed invested and ridden the recovery back up.`
  );
}

function ctxLeverageCompare(ctx) {
  const diff = ctx.finalValue - ctx.oneXFinal;
  let msg =
    `You used ${ctx.leverage}x and ended with about ${shk(ctx.finalValue)}. With plain 1x — just your own ${shk(ctx.amount)}, ` +
    `no borrowing — the same run would’ve ended around ${shk(ctx.oneXFinal)}.`;
  if (ctx.marginCall.happened) {
    msg += ` In this case leverage actually hurt: it triggered a margin call that wiped you out early, while 1x would have survived and kept going.`;
  } else if (diff >= 0) {
    msg += ` Here, leverage boosted your result by about ${shk(Math.abs(diff))} — but remember, that same force works in reverse when markets fall.`;
  } else {
    msg += ` Here, leverage actually cost you about ${shk(Math.abs(diff))} versus 1x — a reminder that borrowing amplifies losses and carries a financing cost too.`;
  }
  return msg + " Same market, very different ride.";
}

// Diversification what-if for a single-asset result. Returns text + a chip
// that pre-loads a 50/50 split into the simulator (a nudge, not advice).
function ctxDiversify(ctx) {
  const a0 = ctx.assets[0];
  const partnerId = a0.id === "agg" ? "sp500" : "agg";
  const partnerName = a0.id === "agg" ? "the S&P 500" : "a steadier Bond ETF";
  const text =
    `Right now all your money is in ${a0.shortName}. Splitting it — say half in ${a0.shortName} and half in ${partnerName} — ` +
    `often smooths the ride: a rough year for one can be softened by the other. It won’t erase risk, but it usually makes the ` +
    `worst year milder. Want to see it on your own numbers?`;
  const presetChip = {
    label: "Try a 50/50 split →",
    preset: { assets: [a0.id, partnerId], allocation: [50, 50], amount: ctx.amount, startYear: +ctx.startYear, leverage: ctx.leverage },
  };
  return { text, presetChip };
}

// Free-text → context intent (only used when a result is on screen).
function matchContextIntent(text) {
  const t = text.toLowerCase();
  if (/margin call|happened to my money|wiped|lost everything|closed my position|blew up/.test(t)) return "margincall";
  if (/\b1x\b|without leverage|no leverage|un-?leveraged|compare leverage|what would 1x/.test(t)) return "leveragecompare";
  if (/why.*(drop|crash|fell|fall|down)|what happened in (19|20)\d\d|worst year|why did everything/.test(t)) return "worstyear";
  if (/split|diversif|spread it|spread my money/.test(t)) return "diversify";
  if (/explain|simple words|summar|how did i do|my result|in plain/.test(t)) return "explain";
  return null;
}
function intentApplies(intent, ctx) {
  if (intent === "explain") return true;
  if (intent === "worstyear") return ctx.worstYear.drop > 0;
  if (intent === "margincall") return ctx.marginCall.happened;
  if (intent === "leveragecompare") return ctx.leverage > 1;
  if (intent === "diversify") return ctx.assets.length === 1;
  return false;
}

/* ------------------------------------------------------------
   3. GENERAL Q&A BANK — free-text educational answers (also taught in
   the Learn courses). Kept so no scripted content dies in the move.
   ------------------------------------------------------------ */
const QA_BANK = [
  {
    id: "begin",
    keywords: ["begin", "scared", "afraid", "new to", "first time", "where do i start"],
    answer:
      "Being nervous is completely normal — almost everyone feels it before their first investment. The fear usually comes from not understanding what’s happening to your money, and that’s fixable. It’s worth learning just 2–3 basics first — what you’re actually buying, what “risk” really means, and how time works in your favor. Understanding comes first; investing comes second. There’s no rush, and learning costs you nothing.",
    followUp: "Want to start with what “risk” and volatility actually mean?",
    chips: ["What does volatility mean?", "What is the S&P 500?"],
  },
  {
    id: "leverage",
    keywords: ["leverage", "borrow", "margin", "amplif", "4x", "2x", "multiplier"],
    answer:
      "Leverage means investing with borrowed money to make your position bigger than your own cash. The catch: it multiplies movement in BOTH directions equally. Put in ₪1,000 at 4x and you’re controlling ₪4,000 — a 10% market rise gives you about +40% (₪400), but a 10% fall costs you about 40% (₪400) of your own money, not 10%. Same tool, opposite outcomes. Leverage doesn’t create free upside; it stretches the risk right alongside the reward.",
    followUp: "Curious what leverage did to your own result?",
    chips: ["What would 1x have looked like?", "What does volatility mean?"],
  },
  {
    id: "volatility",
    keywords: ["volatil", "swing", "ups and downs", "fluctuat", "bumpy", "goes up and down"],
    answer:
      "Volatility is just how much an investment’s price bounces around over time. Low volatility is a gentle ±2% wobble; high volatility might swing ±10% in a week — thrilling on the way up, stressful on the way down. Key insight: volatility isn’t the same as losing money. Prices that dip often recover. That’s why time horizon matters so much — over months and years, the daily bumps tend to smooth out.",
    followUp: "Want to see how your own worst year played out?",
    chips: ["What is the S&P 500?", "What are bonds?"],
  },
  {
    id: "sp500",
    keywords: ["s&p", "sp500", "s and p", "500", "index fund"],
    answer:
      "The S&P 500 is a basket that tracks 500 of the largest U.S. companies — names like Apple and Microsoft. Instead of betting on one company, you’re spread across all of them at once, so if a few stumble, the others help balance it out. That built-in diversification is why so many people treat a broad index like this as a starting point.",
    followUp: "Want to understand what happens to an index like this in a crash?",
    chips: ["What does volatility mean?", "What is the NASDAQ?"],
  },
  {
    id: "nasdaq",
    keywords: ["nasdaq", "nas daq", "tech index", "tech-heavy", "composite"],
    answer:
      "The NASDAQ Composite is another big U.S. index, but it leans heavily toward technology — Apple, Microsoft, Nvidia, and lots of younger tech names. Because tech grows fast but also swings hard, the NASDAQ usually rises more in good times and falls more in rough ones than a broader index like the S&P 500. That extra bounce is exactly what “higher volatility” feels like.",
    followUp: "Want to see that bumpier ride in the Simulator?",
    chips: ["What does volatility mean?", "What is the S&P 500?"],
  },
  {
    id: "dow",
    keywords: ["dow jones", "dow", "djia", "industrial average", "30 companies", "blue chip"],
    answer:
      "The Dow Jones Industrial Average — “the Dow” — tracks 30 large, well-established U.S. companies, the kind you hear about on the news. It’s one of the oldest, most famous market measures, so people quote it as shorthand for “how the market did today.” With only 30 big, steady companies, it tends to move a little more calmly than a tech-heavy index like the NASDAQ.",
    followUp: "Curious how the Dow compares to the NASDAQ?",
    chips: ["What is the NASDAQ?", "What is the S&P 500?"],
  },
  {
    id: "ta35",
    keywords: ["ta-35", "ta35", "ta 35", "ta-25", "tel aviv", "tel-aviv", "israel", "israeli", "maof"],
    answer:
      "The TA-35 is Israel’s leading stock index — the 35 largest companies on the Tel Aviv Stock Exchange, including big Israeli banks and firms you might know locally. Just like the S&P 500 does for the U.S., the TA-35 gives a quick read on how Israel’s biggest companies are doing overall. It’s a popular way to get exposure to the local market.",
    followUp: "Want to try investing in the TA-35 in the Simulator?",
    chips: ["What is the S&P 500?", "What does volatility mean?"],
  },
  {
    id: "diversification",
    keywords: ["diversif", "spread", "spreading", "mix", "basket of", "don't put all", "eggs"],
    answer:
      "Diversification is a simple idea: don’t put all your money in one place. Spread it across several investments and a bad year for one can be softened by a better year for another — a smoother overall ride. It doesn’t remove risk, and it won’t save you when everything falls at once, but historically a mix has gentler ups and downs than any single bet.",
    followUp: "Want to see it on your own numbers? Try splitting your money in the Simulator.",
    chips: ["What are bonds?", "What does volatility mean?"],
  },
  {
    id: "drop",
    keywords: ["market drops", "goes down", "falls", "lose money", "paper loss", "recover"],
    answer:
      "If the market drops after you invest, you have a “paper loss” — the number is lower, but you haven’t actually lost anything until you sell. It only becomes a real, locked-in loss the moment you cash out at that lower price. That’s why panic-selling in a dip is so painful: it turns a temporary dip into a permanent loss. Historically, broad markets have recovered given enough time.",
    followUp: "Want to see how your own worst year recovered?",
    chips: ["What does volatility mean?", "What are bonds?"],
  },
  {
    id: "fees",
    keywords: ["fee", "cost", "charge", "expense", "commission", "how much does it cost"],
    answer:
      "Fees are the small costs of investing, and they quietly add up. A common one is a management fee — a yearly percentage a fund charges to run itself (often a fraction of a percent for broad index funds, more for actively managed ones). None of these are dramatic on any single day, but over years even a 1% difference can meaningfully change your end result, so it’s smart to know what you’re paying.",
    followUp: "Want to know why investing despite fees still beats holding cash?",
    chips: ["Why invest instead of keeping cash?", "What is the S&P 500?"],
  },
  {
    id: "cash",
    keywords: ["cash", "inflation", "why invest", "instead of saving", "keep my money", "savings", "why not just save"],
    answer:
      "Keeping everything in cash feels safest — but there’s a quiet catch called inflation, the slow rise in prices that means the same money buys a little less each year. If prices rise about 3% a year, ₪1,000 buys roughly ₪970 worth of stuff a year later. Your number didn’t change, but its real power shrank. Investing is one way people try to grow money faster than inflation erodes it.",
    followUp: "Curious how people decide how much to keep safe versus invested?",
    chips: ["What are bonds?", "What does low risk low reward mean?"],
  },
  {
    id: "bonds",
    keywords: ["bond", "bonds", "agg", "fixed income", "lend money", "loan to"],
    answer:
      "A bond is basically a loan you give — to a government or a big company — and in return they pay you steady interest and give your money back later. Because that income is agreed up front, bonds usually move around a lot less than stocks: smaller ups, smaller downs, a calmer ride. The trade-off is that the reward is usually smaller too. They’re the classic “steadier” building block people mix with stocks.",
    followUp: "Want to see a mostly-bonds mix next to a bumpy one? Try the “Mostly safe” preset.",
    chips: ["What does low risk low reward mean?", "What is diversification?"],
  },
  {
    id: "lowrisk",
    keywords: ["low risk", "low reward", "risk reward", "risk and reward", "risk vs reward", "solid choice", "defensive", "safe investment", "safer option"],
    answer:
      "“Low risk, low reward” is one of investing’s most honest rules: the calmer and safer an investment is, the smaller its likely payoff — and vice versa. Something steady like a bond ETF grows slowly without scary drops; something bold like a tech-heavy index can soar but also plunge. Neither is “better” — they’re tools for different jobs. That’s why people often mix them: some steady ballast, some growth.",
    followUp: "Want to feel the contrast? Try splitting the Bond ETF with the NASDAQ.",
    chips: ["What are bonds?", "What is diversification?"],
  },
  {
    id: "split",
    keywords: ["safe vs", "how much should be safe", "emergency fund", "allocation", "safe or invested", "how much of my money"],
    answer:
      "Here’s the general framework people are taught — though the right split is genuinely personal, and I can’t decide it for you. A widely taught starting principle is the “emergency fund”: keeping roughly 3–6 months of essential expenses in safe, easy-to-reach cash before investing the rest. Beyond that, many people balance steadier holdings (like bonds) with growth ones (like stocks) to match their comfort with ups and downs.",
    followUp: "Want to feel that trade-off? Try the “Mostly safe” preset in the Simulator.",
    chips: ["What are bonds?", "What does low risk low reward mean?"],
  },
];

/* ============================================================
   RENDERING / PLUMBING (targets the Coach panel in the Simulate tab)
   ============================================================ */
const coachChat = document.getElementById("coach-chat");
const coachChips = document.getElementById("coach-chips");
const coachComposer = document.getElementById("coach-composer");
const coachInput = document.getElementById("coach-input");
const coachSend = document.getElementById("coach-send");
const coachPanel = document.getElementById("coach-panel");
const coachFab = document.getElementById("coach-fab");
const coachBackdrop = document.getElementById("coach-backdrop");
const coachClose = document.getElementById("coach-close");
const coachHint = document.getElementById("coach-hint");

let busy = false;          // prevents overlapping messages while "typing"
let currentContext = null; // the latest SimulationContext

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function scrollDown() { if (coachChat) coachChat.scrollTop = coachChat.scrollHeight; }

function addUserMessage(text) {
  const row = document.createElement("div");
  row.className = "msg-row user";
  const bubble = document.createElement("div");
  bubble.className = "bubble user";
  bubble.textContent = text;
  row.appendChild(bubble);
  coachChat.appendChild(row);
  scrollDown();
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "msg-row coach";
  row.innerHTML =
    `<div class="avatar">π</div>` +
    `<div class="bubble coach"><div class="typing"><span></span><span></span><span></span></div></div>`;
  coachChat.appendChild(row);
  scrollDown();
  return row;
}

function streamCoachMessage(text, followUp) {
  return new Promise((resolve) => {
    const row = document.createElement("div");
    row.className = "msg-row coach";
    row.innerHTML = `<div class="avatar">π</div><div class="bubble coach"><span class="stream"></span><span class="caret">▌</span></div>`;
    coachChat.appendChild(row);
    const streamEl = row.querySelector(".stream");
    const caret = row.querySelector(".caret");
    const words = text.split(" ");
    let i = 0;
    const timer = setInterval(() => {
      streamEl.textContent += (i === 0 ? "" : " ") + words[i];
      i++;
      scrollDown();
      if (i >= words.length) {
        clearInterval(timer);
        caret.remove();
        if (followUp) {
          const fu = document.createElement("span");
          fu.className = "follow-up";
          fu.textContent = followUp;
          streamEl.parentElement.appendChild(fu);
        }
        scrollDown();
        resolve();
      }
    }, 40);
  });
}

// The distinct GUARDRAIL card (friendly-protective). chip = {label, intent}.
function renderGuardrail(reframe) {
  const row = document.createElement("div");
  row.className = "msg-row coach";
  row.innerHTML = `
    <div class="avatar">π</div>
    <div class="guardrail">
      <div class="gr-head">
        <span class="shield">🛡️</span>
        <span class="gr-label">We teach, we don’t tell you what to buy</span>
      </div>
      <div class="gr-body"></div>
      <div class="gr-reframe"></div>
    </div>`;
  row.querySelector(".gr-body").textContent = reframe.body;
  row.querySelector(".gr-reframe").textContent = reframe.offer;

  const chip = document.createElement("button");
  chip.className = "chip inline";
  chip.type = "button";
  chip.textContent = reframe.chip.label;
  chip.addEventListener("click", () => handleSubmit(reframe.chip.label, reframe.chip.intent));
  row.querySelector(".guardrail").appendChild(chip);

  coachChat.appendChild(row);
  scrollDown();
}

// Render chips. Items may be plain strings (free-text questions) or
// {label, onClick} objects (context intents / preset bridges).
function renderCoachChips(list) {
  coachChips.innerHTML = "";
  (list || []).forEach((item) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.textContent = typeof item === "string" ? item : item.label;
    chip.addEventListener("click", typeof item === "string" ? () => handleSubmit(item) : item.onClick);
    coachChips.appendChild(chip);
  });
}

/* ------------------------------------------------------------
   CONTEXT chips + answers
   ------------------------------------------------------------ */
function cchip(label, intent) {
  return { label, intent, onClick: () => handleSubmit(label, intent) };
}
function contextChips(ctx) {
  if (!ctx) return [];
  const specific = [];
  if (ctx.marginCall.happened) specific.push(cchip("What just happened to my money?", "margincall"));
  if (ctx.worstYear.drop > 0) {
    const y = String(ctx.worstYear.year);
    const label = ["2000", "2008", "2020", "2022"].includes(y) ? `Why did everything drop in ${y}?` : "Why did that happen?";
    specific.push(cchip(label, "worstyear"));
  }
  if (ctx.leverage > 1) specific.push(cchip("What would 1x have looked like?", "leveragecompare"));
  if (ctx.assets.length === 1) specific.push(cchip("What if I had split my money?", "diversify"));
  // Always keep one general chip.
  return [...specific.slice(0, 3), cchip("Explain my result in simple words", "explain")];
}

async function renderContextAnswer(intent, ctx) {
  if (intent === "diversify") {
    const { text, presetChip } = ctxDiversify(ctx);
    await streamCoachMessage(text, null);
    renderCoachChips([
      { label: presetChip.label, onClick: () => { if (window.P2PI_loadSimulatorPreset) window.P2PI_loadSimulatorPreset(presetChip.preset, "the Coach"); } },
      ...contextChips(ctx).filter((c) => c.intent !== "diversify"),
    ]);
    return;
  }
  const builders = { explain: ctxExplain, worstyear: ctxWorstYear, margincall: ctxMarginCall, leveragecompare: ctxLeverageCompare };
  await streamCoachMessage(builders[intent](ctx), null);
  renderCoachChips(contextChips(ctx));
}

/* ------------------------------------------------------------
   MATCHING
   ------------------------------------------------------------ */
function isAdviceSeeking(text) { return ADVICE_PATTERNS.some((re) => re.test(text)); }

function matchQA(text) {
  const t = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const entry of QA_BANK) {
    let score = 0;
    for (const kw of entry.keywords) if (t.includes(kw.toLowerCase())) score++;
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return bestScore > 0 ? best : null;
}

/* ------------------------------------------------------------
   MAIN TURN HANDLER
   ------------------------------------------------------------ */
async function handleSubmit(rawText, forcedIntent) {
  const text = (rawText || "").trim();
  if (!text || busy) return;

  busy = true;
  if (coachSend) coachSend.disabled = true;
  if (coachInput) coachInput.value = "";
  addUserMessage(text);
  coachChips.innerHTML = "";

  // +1 P2Pi coin per question (preserved in the Coach's new home).
  P2Pi.addCoins(1);
  if (typeof showCoinToast === "function") showCoinToast(1, false);

  const typing = showTyping();
  await wait(600 + Math.min(text.length * 8, 400));
  typing.remove();

  // 1) GUARDRAIL first — advice-seeking never gets a direct answer.
  if (isAdviceSeeking(text)) {
    renderGuardrail(reframeFor(text, currentContext));
    renderCoachChips(contextChips(currentContext));
    finishTurn();
    return;
  }

  // 2) Results-aware intent (only when a result is on screen and applicable).
  const intent = forcedIntent || (currentContext ? matchContextIntent(text) : null);
  if (intent && currentContext && intentApplies(intent, currentContext)) {
    await renderContextAnswer(intent, currentContext);
    finishTurn();
    return;
  }

  // 3) General educational bank.
  const match = matchQA(text);
  if (match) {
    await streamCoachMessage(match.answer, match.followUp);
    renderCoachChips(match.chips);
    finishTurn();
    return;
  }

  // 4) Graceful fallback.
  await streamCoachMessage(
    "That’s a good question — I’m a demo coach with a limited set of scripted topics, so I don’t have a great answer for that one yet. Here are a few things I can explain about your result:",
    null
  );
  renderCoachChips(contextChips(currentContext));
  finishTurn();
}

function finishTurn() {
  busy = false;
  if (coachSend) coachSend.disabled = false;
  if (coachInput) coachInput.focus();
  scrollDown();
}

/* ------------------------------------------------------------
   PUBLIC API — simulate.js calls this after every run
   ------------------------------------------------------------ */
window.P2PICoach = {
  onSimulation(ctx) {
    currentContext = ctx;
    busy = false;
    if (!coachChat) return;
    coachChat.innerHTML = "";
    coachChips.innerHTML = "";
    if (coachHint) coachHint.hidden = true;      // results exist now
    if (coachFab) coachFab.hidden = false;       // mobile entry point
    // Badge/pulse the mobile pill when narration lands while the sheet is closed
    // (on desktop the panel is always visible, so the pulse simply doesn't show).
    if (coachFab && !(coachPanel && coachPanel.classList.contains("open"))) coachFab.classList.add("pulse");

    // First run of a session (incl. right after "Start over") → full agent
    // experience; repeat runs in the same session → snappy condensed narration.
    let firstOfSession = true;
    try {
      firstOfSession = !sessionStorage.getItem("p2pi_narrated");
      sessionStorage.setItem("p2pi_narrated", "1");
    } catch (e) { /* sessionStorage may be blocked */ }

    if (firstOfSession) narrateFull(ctx);
    else narrateSnappy(ctx);
  },
  reset() {
    currentContext = null;
    if (coachChat) coachChat.innerHTML = "";
    if (coachChips) coachChips.innerHTML = "";
    if (coachFab) coachFab.classList.remove("pulse");
  },
};

/* ------------------------------------------------------------
   NARRATION — the Coach tells the story of the result in its own voice.
   ------------------------------------------------------------ */
function narrReaction(ctx) {
  const grew = ctx.totalProfit >= 0;
  if (grew) {
    return `Nice — your ${shk(ctx.amount)} in ${assetList(ctx)} grew to about ${shk(ctx.finalValue)} ` +
      `over ${ctx.startYear}–${ctx.endYear}. That's roughly ${shk(ctx.totalProfit)} of profit ` +
      `(+${Math.abs(ctx.totalPct).toFixed(0)}%). 🎉`;
  }
  return `Okay — this one dipped: your ${shk(ctx.amount)} in ${assetList(ctx)} ended around ` +
    `${shk(ctx.finalValue)} over ${ctx.startYear}–${ctx.endYear}, down about ${shk(Math.abs(ctx.totalProfit))} ` +
    `(−${Math.abs(ctx.totalPct).toFixed(0)}%). No judgment — let's look at what happened.`;
}
function narrWorstYear(ctx) {
  return `On the way there was a rough patch: around ${ctx.worstYear.year}, you were down about ` +
    `${shk(ctx.worstYear.drop)} from your high point. Bumps like that are a normal part of investing.`;
}
function narrMargin(ctx) {
  return `Your ${ctx.leverage}x leverage ran into a margin call in ${monthLabel(ctx.marginCall.date)}. ` +
    `Because you'd borrowed, the drop hit about ${ctx.leverage}× as hard, your cushion ran out, and the ` +
    `position was closed early — leaving roughly ${shk(ctx.finalValue)}. Tap below and I'll show what plain 1x would've done.`;
}
function narrDiversify(ctx) {
  return `Nice side-effect of splitting your money: your worst year came in milder than going all-in — ` +
    `about ${shk(ctx.worstYear.drop)} down, versus ${shk(ctx.diversification.worstSingle)} all-in on ` +
    `${ctx.diversification.worstName}. That's diversification quietly working.`;
}

// Ordered "beats". condensed = snappy mode (reaction + one key insight).
function buildBeats(ctx, condensed) {
  const beats = [{ kind: "msg", text: narrReaction(ctx) }];
  const worst = ctx.worstYear.drop > 0;
  const margin = ctx.marginCall.happened;
  const divers = ctx.diversification && ctx.diversification.applies;
  if (condensed) {
    if (margin) beats.push({ kind: "card", text: narrMargin(ctx) });
    else if (worst) beats.push({ kind: "msg", text: narrWorstYear(ctx) });
    else if (divers) beats.push({ kind: "msg", text: narrDiversify(ctx) });
  } else {
    if (worst) beats.push({ kind: "msg", text: narrWorstYear(ctx) });
    if (margin) beats.push({ kind: "card", text: narrMargin(ctx) });
    if (divers) beats.push({ kind: "msg", text: narrDiversify(ctx) });
  }
  return beats;
}

// FULL mode: thinking dots + word-by-word streaming + short pauses (< ~8s total).
async function narrateFull(ctx) {
  busy = true;
  for (const beat of buildBeats(ctx, false)) {
    const typing = showTyping();
    await wait(340);
    typing.remove();
    if (beat.kind === "card") { renderShieldCard("Margin call — the leverage lesson", beat.text); await wait(240); }
    else { await streamCoachMessage(beat.text, null); }
    await wait(180);
  }
  renderCoachChips(contextChips(ctx));
  busy = false;
}

// SNAPPY mode: near-instant condensed narration (brief CSS fade-in, no streaming).
function narrateSnappy(ctx) {
  buildBeats(ctx, true).forEach((beat) => {
    if (beat.kind === "card") renderShieldCard("Margin call — the leverage lesson", beat.text);
    else appendMessageInstant(beat.text);
  });
  renderCoachChips(contextChips(ctx));
}

// A coach bubble that appears at once (brief CSS fade-in), no word-by-word.
function appendMessageInstant(text) {
  const row = document.createElement("div");
  row.className = "msg-row coach instant";
  row.innerHTML = `<div class="avatar">π</div><div class="bubble coach"></div>`;
  row.querySelector(".bubble").textContent = text;
  coachChat.appendChild(row);
  scrollDown();
}

// A shield/guardrail-styled card, used for the margin-call beat.
function renderShieldCard(label, text) {
  const row = document.createElement("div");
  row.className = "msg-row coach instant";
  row.innerHTML =
    `<div class="avatar">π</div>` +
    `<div class="guardrail"><div class="gr-head"><span class="shield">🛡️</span><span class="gr-label"></span></div><div class="gr-body"></div></div>`;
  row.querySelector(".gr-label").textContent = label;
  row.querySelector(".gr-body").textContent = text;
  coachChat.appendChild(row);
  scrollDown();
}

/* ------------------------------------------------------------
   WIRING: composer, tabs, modal, coach bottom-sheet, reset
   ------------------------------------------------------------ */
if (coachComposer) {
  coachComposer.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSubmit(coachInput.value);
  });
}

// Mobile bottom-sheet open/close.
function openCoachSheet() {
  if (!coachPanel) return;
  coachPanel.classList.add("open");
  if (coachBackdrop) coachBackdrop.hidden = false;
  if (coachFab) coachFab.classList.remove("pulse"); // they've seen the narration
  if (coachInput) coachInput.focus();
  scrollDown();
}
function closeCoachSheet() {
  if (!coachPanel) return;
  coachPanel.classList.remove("open");
  if (coachBackdrop) coachBackdrop.hidden = true;
}
if (coachFab) coachFab.addEventListener("click", openCoachSheet);
if (coachClose) coachClose.addEventListener("click", closeCoachSheet);
if (coachBackdrop) coachBackdrop.addEventListener("click", closeCoachSheet);

// Tab switching: show one panel at a time, highlight the active tab.
const tabButtons = document.querySelectorAll(".tab");
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab; // "learn" | "simulate" | "coins"
    tabButtons.forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".panel").forEach((p) => {
      p.hidden = p.id !== "panel-" + target;
    });
    if (target !== "simulate") closeCoachSheet(); // tidy the sheet when leaving
  });
});

/* ------------------------------------------------------------
   Settings menu (gear) → "How this works" + "Start over"
   ------------------------------------------------------------ */
const settingsBtn = document.getElementById("settings-btn");
const settingsMenu = document.getElementById("settings-menu");
function openSettings() {
  settingsMenu.hidden = false;
  settingsBtn.setAttribute("aria-expanded", "true");
}
function closeSettings() {
  settingsMenu.hidden = true;
  settingsBtn.setAttribute("aria-expanded", "false");
}
if (settingsBtn) {
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsMenu.hidden ? openSettings() : closeSettings();
  });
  // Click anywhere outside the menu closes it.
  document.addEventListener("click", (e) => {
    if (!settingsMenu.hidden && !e.target.closest(".settings-wrap")) closeSettings();
  });
}

// "How this works" modal (now opened from the Settings menu).
const overlay = document.getElementById("modal-overlay");
document.getElementById("how-link").addEventListener("click", () => {
  closeSettings();
  overlay.hidden = false;
});
document.getElementById("modal-close").addEventListener("click", () => (overlay.hidden = true));
overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.hidden = true; });

// "Redo my welcome" → re-run onboarding WITHOUT wiping progress.
const redoWelcomeBtn = document.getElementById("redo-welcome-btn");
if (redoWelcomeBtn) {
  redoWelcomeBtn.addEventListener("click", () => {
    closeSettings();
    if (window.P2PIOnboarding) window.P2PIOnboarding.start();
  });
}

// "Start over" → confirmation dialog → wipe everything → reload.
const confirmOverlay = document.getElementById("confirm-overlay");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmYes = document.getElementById("confirm-yes");
function closeConfirm() { confirmOverlay.hidden = true; }

const startOverBtn = document.getElementById("start-over-btn");
if (startOverBtn) {
  startOverBtn.addEventListener("click", () => {
    closeSettings();
    confirmOverlay.hidden = false;
    if (confirmCancel) confirmCancel.focus(); // Cancel is the safe default
  });
}
if (confirmCancel) confirmCancel.addEventListener("click", closeConfirm);
if (confirmOverlay) confirmOverlay.addEventListener("click", (e) => { if (e.target === confirmOverlay) closeConfirm(); });
if (confirmYes) {
  confirmYes.addEventListener("click", () => {
    // Wipe ALL P2π app state (coins, course progress, first-visit + any flags),
    // then reload so the user lands as a brand-new visitor.
    try {
      Object.keys(localStorage)
        .filter((k) => k.toLowerCase().startsWith("p2pi"))
        .forEach((k) => localStorage.removeItem(k));
      // Also clear the session narration flag so the reload gets the FULL agent
      // experience again (a truly brand-new session).
      Object.keys(sessionStorage)
        .filter((k) => k.toLowerCase().startsWith("p2pi"))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch (e) { /* storage may be blocked; reload still gives a clean session */ }
    location.reload();
  });
}

// Escape closes any open overlay/menu (Escape on the confirm = Cancel, the safe action).
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  overlay.hidden = true;
  closeConfirm();
  closeSettings();
  closeCoachSheet();
});
