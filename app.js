/* ============================================================
   P2Pi Coach — demo logic (no frameworks, no backend)

   How it works, top to bottom:
   1. GUARDRAIL rules  — advice-seeking intent is detected FIRST and
      hard-blocks a normal answer (the heart of the demo).
   2. Q&A BANK         — scripted educational answers, matched by keyword.
   3. Rendering        — bubbles, simulated "thinking", word-by-word stream.
   4. Chips            — clickable suggested questions that refresh each turn.

   Everything the coach "says" lives in data structures below, so a
   non-engineer can read and edit the content without touching the plumbing.
   ============================================================ */

/* ------------------------------------------------------------
   1. THE GUARDRAIL
   These patterns capture advice-seeking intent ("what should I do
   with my money"). If any match, we render a guardrail card instead
   of answering. This runs BEFORE the Q&A match on purpose.
   ------------------------------------------------------------ */
const ADVICE_PATTERNS = [
  /\bshould i\b/i,
  /what should i (do|buy|invest|pick|choose)/i,
  /(tell|show) me what to (buy|do|invest|pick)/i,
  /what (do you )?(recommend|suggest)/i,
  /\brecommend\b/i,
  /is (it|now|this|that) a good (time|idea) to (invest|buy)/i,
  /is .* a good investment for me/i,
  /how much (leverage|money|risk) should i/i,
  /which (stock|fund|etf|coin|asset) should i/i,
  /what would you do/i,
  /is .* worth (buying|it)/i,
];

// Educational reframe offered inside the guardrail card, keyed loosely by topic.
function reframeFor(text) {
  const t = text.toLowerCase();
  if (t.includes("leverage")) {
    return {
      body: "I can’t tell you how much leverage to use — that depends on your goals, your timeline, and how much loss you could handle, and only you can weigh that. What I *can* do is show you exactly how leverage changes the math in both directions.",
      offer: "Want me to explain how leverage magnifies gains AND losses, with a quick example?",
      chip: "What is leverage?",
    };
  }
  if (t.includes("buy") || t.includes("stock") || t.includes("fund") || t.includes("etf")) {
    return {
      body: "I can’t tell you what to buy — picking specific investments for someone is personal advice, and that decision stays with you. But I’m happy to explain the building blocks so you can decide with confidence.",
      offer: "Want me to explain what an index like the S&P 500 actually is?",
      chip: "What is the S&P 500?",
    };
  }
  if (t.includes("time") || t.includes("now")) {
    return {
      body: "I can’t tell you whether now is a good time to invest — timing the market is a personal bet, and I won’t make that call for you. What I can explain is how markets move over time and why time horizon matters more than timing.",
      offer: "Want me to explain what happens if the market drops right after you invest?",
      chip: "What happens if the market drops after I invest?",
    };
  }
  return {
    body: "I can teach you how investing works, but I can’t tell you what to do with your money — that’s a personal decision, and it stays with you. Let’s build your understanding instead so the choice is yours to make.",
    offer: "Want me to walk you through a core concept to get started?",
    chip: "Where do I even begin?",
  };
}

/* ------------------------------------------------------------
   2. THE SCRIPTED Q&A BANK
   Each entry: keyword matchers, a warm plain-language answer, and a
   set of follow-up chips to show after it's delivered.
   Answers are ~60–120 words, jargon-free, each ending with a nudge.
   ------------------------------------------------------------ */
const QA_BANK = [
  {
    id: "begin",
    keywords: ["begin", "start", "scared", "afraid", "1000", "1,000", "₪1000", "new to", "first time", "where do i"],
    answer:
      "First — being nervous is completely normal, and honestly it’s a healthy instinct. Almost everyone feels it before their first investment. Here’s the reassuring part: the fear usually comes from not understanding what’s happening to your money, and that’s fixable. Before putting in a single shekel, it’s worth learning just 2–3 basics — what you’re actually buying, what “risk” really means, and how time works in your favor. Understanding comes first; investing comes second. There’s no rush, and learning costs you nothing.",
    followUp: "Want to start with the very first concept — what “risk” and volatility actually mean?",
    chips: ["What does volatility mean?", "What is the S&P 500?", "Why invest at all instead of keeping cash?"],
  },
  {
    id: "leverage",
    keywords: ["leverage", "borrow", "margin", "amplif", "4x", "2x", "multiplier"],
    answer:
      "Leverage means investing with borrowed money to make your position bigger than your own cash. The catch: it multiplies movement in BOTH directions equally. Quick example — say you put in ₪1,000 at 4x, so you’re controlling ₪4,000. If the market rises 10%, you don’t gain 10% — you gain about 40% (₪400). But if it falls 10%, you lose about 40% (₪400) of your own money, not 10%. Same tool, opposite outcomes. Leverage doesn’t create free upside; it stretches the risk right alongside the reward.",
    followUp: "Want to see what actually happens to your money when the market drops?",
    chips: ["What happens if the market drops after I invest?", "What does volatility mean?", "Should I use 4x leverage?"],
  },
  {
    id: "volatility",
    keywords: ["volatil", "swing", "ups and downs", "fluctuat", "bumpy", "goes up and down"],
    answer:
      "Volatility is just how much an investment’s price bounces around over time. Low volatility feels like a gentle ±2% wobble — barely noticeable. High volatility might swing ±10% in a week, which can feel thrilling on the way up and stressful on the way down. Here’s the key insight: volatility isn’t the same as losing money. Prices that dip often recover. That’s why time horizon matters so much — over months and years, the daily bumps tend to smooth out, and the short-term drama matters far less than where things trend over the long run.",
    followUp: "Curious how a long time horizon actually softens those swings in practice?",
    chips: ["What happens if the market drops after I invest?", "What is the S&P 500?", "Why invest at all instead of keeping cash?"],
  },
  {
    id: "sp500",
    keywords: ["s&p", "sp500", "s and p", "500", "index fund"],
    answer:
      "The S&P 500 is basically a basket that tracks 500 of the largest companies in the U.S. — names you’d recognize like Apple, Microsoft, and many more. Instead of betting on one company, you’re spread across all of them at once, so if a few stumble, the others help balance it out. That built-in diversification is why so many people treat a broad index like this as a starting point for learning: it’s one simple way to get exposure to “the market overall” rather than trying to pick individual winners.",
    followUp: "Want to understand what happens to an index like this when the market drops?",
    chips: ["What happens if the market drops after I invest?", "What fees would I pay?", "What does volatility mean?"],
  },
  {
    id: "nasdaq",
    keywords: ["nasdaq", "nas daq", "tech index", "tech-heavy", "composite"],
    answer:
      "The NASDAQ Composite is another big U.S. index, but it leans heavily toward technology — think companies like Apple, Microsoft, Nvidia, and lots of younger tech names. Because tech tends to grow fast but also swing hard, the NASDAQ usually rises more in good times and falls more in rough ones than a broader index like the S&P 500. That extra bounce is exactly what “higher volatility” feels like. It’s a great example of the trade-off between bigger potential gains and a bumpier ride.",
    followUp: "Want to see how that bumpier ride looks in the Simulator?",
    chips: ["What does volatility mean?", "What is the Dow Jones?", "What is the S&P 500?"],
  },
  {
    id: "dow",
    keywords: ["dow jones", "dow", "djia", "industrial average", "30 companies", "blue chip"],
    answer:
      "The Dow Jones Industrial Average — usually just “the Dow” — tracks 30 large, well-established U.S. companies, the kind you hear about on the news. It’s one of the oldest and most famous market measures, so people often quote it as shorthand for “how the market did today.” Because it’s only 30 big, steady companies, it tends to move a little more calmly than a tech-heavy index like the NASDAQ. It’s a simple window into how big American businesses are doing overall.",
    followUp: "Curious how the Dow compares to a tech-heavy index like the NASDAQ?",
    chips: ["What is the NASDAQ?", "What is the S&P 500?", "What does volatility mean?"],
  },
  {
    id: "ta35",
    keywords: ["ta-35", "ta35", "ta 35", "ta-25", "tel aviv", "tel-aviv", "israel", "israeli", "maof"],
    answer:
      "The TA-35 is Israel’s leading stock index — it follows the 35 largest companies traded on the Tel Aviv Stock Exchange, including big Israeli banks and firms you might know locally. Just like the S&P 500 does for the U.S., the TA-35 gives a quick read on how Israel’s biggest companies are doing overall. It’s a popular starting point for people who want exposure to the local market they see around them every day, rather than only investing abroad.",
    followUp: "Want to try investing in the TA-35 in the Simulator?",
    chips: ["What is the S&P 500?", "What is the NASDAQ?", "What does volatility mean?"],
  },
  {
    id: "diversification",
    keywords: ["diversif", "spread", "spreading", "split", "splitting", "mix", "basket of", "don't put all", "eggs"],
    answer:
      "Diversification is a fancy word for a simple idea: don’t put all your money in one place. When you spread it across several different investments, a bad year for one can be softened by a better year for another — so your overall ride is usually smoother. It doesn’t remove risk entirely, and it won’t save you when everything falls at once, but historically a mix tends to have gentler ups and downs than any single bet. It’s one of the most trusted ideas in investing, precisely because it’s about not needing to be right about any one thing.",
    followUp: "Want to see it in action? Try splitting your money across a few indexes in the Simulate tab and watch how the worst year gets milder.",
    chips: ["What is the S&P 500?", "What does volatility mean?", "What is the NASDAQ?"],
  },
  {
    id: "drop",
    keywords: ["drop", "crash", "market drops", "goes down", "falls", "lose money", "loss", "lose", "red", "down"],
    answer:
      "Great question, because this is where emotions hit hardest. If the market drops after you invest, you have what’s called a “paper loss” — the number is lower, but you haven’t actually lost anything until you sell. It only becomes a real, locked-in loss the moment you cash out at that lower price. That’s why panic-selling in a dip is so painful: it turns a temporary dip into a permanent loss. Historically, broad markets have recovered given enough time, which is why a longer time horizon and a steady hand tend to matter more than any single scary day.",
    followUp: "Want to see how volatility and time horizon fit into this picture?",
    chips: ["What does volatility mean?", "Why invest at all instead of keeping cash?", "How much of my money should be safe vs invested?"],
  },
  {
    id: "fees",
    keywords: ["fee", "cost", "charge", "expense", "spread", "commission", "how much does it cost"],
    answer:
      "Fees are the small costs of investing, and they’re worth understanding because they quietly add up over time. Two common ones: a management fee — an annual percentage a fund charges to run itself (often a fraction of a percent for broad index funds, more for actively managed ones) — and the spread, which is the tiny gap between the buy price and the sell price whenever you trade. None of these are dramatic on any single day, but over years even a 1% difference in fees can meaningfully change your end result, so it’s smart to know what you’re paying.",
    followUp: "Want to understand why investing despite these fees can still beat holding cash?",
    chips: ["Why invest at all instead of keeping cash?", "What is the S&P 500?", "What does volatility mean?"],
  },
  {
    id: "cash",
    keywords: ["cash", "inflation", "why invest", "instead of saving", "keep my money", "savings", "why not just save"],
    answer:
      "It feels safest to keep everything in cash — but there’s a quiet catch called inflation. Inflation is the slow rise in prices over time, which means the same money buys a little less each year. Imagine prices rise about 3% a year: ₪1,000 sitting untouched would buy roughly ₪970 worth of stuff a year later, and less the year after. Your number didn’t change, but its real power shrank. Investing is one way people try to grow their money faster than inflation erodes it. Cash still has an important role — it’s just not built for long-term growth.",
    followUp: "Curious how people decide how much to keep in safe cash versus invested?",
    chips: ["How much of my money should be safe vs invested?", "What is the S&P 500?", "What does volatility mean?"],
  },
  {
    id: "split",
    keywords: ["safe vs", "how much should be safe", "emergency fund", "allocation", "split", "safe or invested", "how much of my money"],
    answer:
      "This is a smart thing to think about, and I’ll share the general framework people are taught — though the right split is genuinely personal, and I can’t decide it for you. A widely taught starting principle is the “emergency fund”: keeping roughly 3–6 months of essential expenses in safe, easy-to-reach cash before investing the rest. The idea is that a cushion means a surprise bill won’t force you to sell investments at a bad moment. How much beyond that you invest depends on your goals, your timeline, and your comfort with ups and downs — all things only you can weigh.",
    followUp: "Want me to explain why that cash cushion protects you during a market drop?",
    chips: ["What happens if the market drops after I invest?", "Why invest at all instead of keeping cash?", "What does volatility mean?"],
  },
];

/* ------------------------------------------------------------
   Opening greeting + the starting chips.
   Chips deliberately include a guardrail-triggering option so an
   interviewer meets the guardrail moment within a couple of clicks.
   ------------------------------------------------------------ */
const GREETING =
  "Hi, I’m the P2Pi Coach 👋 I’m here to explain investing in plain, jargon-free language — no pressure and no judgment, just answers. I can’t tell you what to do with your money, but I can help you understand how it all works so your choices are truly yours.";

const STARTER_CHIPS = [
  "I have ₪1,000 and I’m scared to start. Where do I begin?",
  "What is leverage?",
  "What happens if the market drops after I invest?",
  "Should I use 4x leverage?",
];

// Fallback follow-up chips reused when we don't have topic-specific ones.
const FALLBACK_CHIPS = [
  "What is leverage?",
  "What does volatility mean?",
  "Why invest at all instead of keeping cash?",
];

/* ============================================================
   RENDERING / PLUMBING
   ============================================================ */
const chatEl = document.getElementById("chat");
const chipsEl = document.getElementById("chips");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");

let busy = false; // prevents overlapping messages while the coach "types"

// Smoothly scroll the chat to the newest content.
function scrollDown() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

// Add a user message bubble (right-aligned).
function addUserMessage(text) {
  const row = document.createElement("div");
  row.className = "msg-row user";
  const bubble = document.createElement("div");
  bubble.className = "bubble user";
  bubble.textContent = text;
  row.appendChild(bubble);
  chatEl.appendChild(row);
  scrollDown();
}

// Show the "Coach is thinking…" indicator; returns the element so we can remove it.
function showTyping() {
  const row = document.createElement("div");
  row.className = "msg-row coach";
  row.innerHTML = `
    <div class="avatar">π</div>
    <div class="bubble coach"><div class="typing"><span></span><span></span><span></span></div></div>`;
  chatEl.appendChild(row);
  scrollDown();
  return row;
}

// Stream text word-by-word into a coach bubble to mimic a live LLM.
function streamCoachMessage(text, followUp) {
  return new Promise((resolve) => {
    const row = document.createElement("div");
    row.className = "msg-row coach";
    row.innerHTML = `<div class="avatar">π</div><div class="bubble coach"><span class="stream"></span><span class="caret">▌</span></div>`;
    chatEl.appendChild(row);
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
    }, 45); // ~word delay; feels like typing without being slow
  });
}

// Render the distinct GUARDRAIL card (friendly-protective: soft accent
// border, shield, reframe + chip). Feels caring, not alarming.
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

  // An inline chip that accepts the educational reframe.
  const chip = document.createElement("button");
  chip.className = "chip inline";
  chip.type = "button";
  chip.textContent = reframe.chip;
  chip.addEventListener("click", () => handleSubmit(reframe.chip));
  row.querySelector(".guardrail").appendChild(chip);

  chatEl.appendChild(row);
  scrollDown();
}

// Replace the suggestion chips under the chat.
function renderChips(list) {
  chipsEl.innerHTML = "";
  list.forEach((label) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.textContent = label;
    chip.addEventListener("click", () => handleSubmit(label));
    chipsEl.appendChild(chip);
  });
}

/* ------------------------------------------------------------
   MATCHING LOGIC
   ------------------------------------------------------------ */
function isAdviceSeeking(text) {
  return ADVICE_PATTERNS.some((re) => re.test(text));
}

function matchQA(text) {
  const t = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of QA_BANK) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (t.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : null;
}

/* ------------------------------------------------------------
   MAIN TURN HANDLER
   ------------------------------------------------------------ */
async function handleSubmit(rawText) {
  const text = (rawText || "").trim();
  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;
  inputEl.value = "";
  addUserMessage(text);
  chipsEl.innerHTML = ""; // clear chips while the coach responds

  // Reward curiosity: +1 P2Pi coin for every question asked (shared state).
  P2Pi.addCoins(1);
  if (typeof showCoinToast === "function") showCoinToast(1, false);

  // Brief pause + typing indicator so it feels like a live model thinking.
  const typing = showTyping();
  await wait(650 + Math.min(text.length * 8, 500));
  typing.remove();

  // 1) GUARDRAIL first — advice-seeking never gets a direct answer.
  if (isAdviceSeeking(text)) {
    renderGuardrail(reframeFor(text));
    renderChips(["What is leverage?", "What does volatility mean?", "How much of my money should be safe vs invested?"]);
    finishTurn();
    return;
  }

  // 2) Try to match the scripted educational bank.
  const match = matchQA(text);
  if (match) {
    await streamCoachMessage(match.answer, match.followUp);
    renderChips(match.chips || FALLBACK_CHIPS);
    finishTurn();
    return;
  }

  // 3) Graceful fallback for anything we don't recognize.
  await streamCoachMessage(
    "That’s a good question — but I’m a demo coach with a limited set of scripted topics, so I don’t have a great answer for that one yet. In the real product I’d be able to handle it. In the meantime, here are a few things I can explain really well:",
    null
  );
  renderChips(STARTER_CHIPS);
  finishTurn();
}

function finishTurn() {
  busy = false;
  sendBtn.disabled = false;
  inputEl.focus();
  scrollDown();
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------
   WIRING: form submit, modal, initial greeting
   ------------------------------------------------------------ */
formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSubmit(inputEl.value);
});

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
    // Re-focus the input when returning to the coach.
    if (target === "learn") inputEl.focus();
  });
});

// "How this works" modal
const overlay = document.getElementById("modal-overlay");
document.getElementById("how-link").addEventListener("click", () => (overlay.hidden = false));
document.getElementById("modal-close").addEventListener("click", () => (overlay.hidden = true));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") overlay.hidden = true;
});

// First-visit hello card (Learn tab) — dismissible, shown once per browser.
const helloCard = document.getElementById("hello-card");
if (helloCard) {
  if (!P2Pi.hasFlag("seen_hello")) helloCard.hidden = false;
  document.getElementById("hello-dismiss").addEventListener("click", () => {
    helloCard.hidden = true;
    P2Pi.setFlag("seen_hello");
  });
}

// "Reset demo" link inside the modal — clears coins + chat for the next student.
document.getElementById("reset-link").addEventListener("click", () => {
  P2Pi.reset();                         // wipe coins + one-time flags
  chatEl.innerHTML = "";                // clear the conversation
  overlay.hidden = true;                // close the modal
  if (helloCard) helloCard.hidden = false; // re-greet the next student
  startCoachConversation();             // fresh greeting + starter chips
});

// Greet the user, then show starter chips. Reusable so "Reset demo" can
// start a clean conversation without a page reload.
async function startCoachConversation() {
  const typing = showTyping();
  await wait(700);
  typing.remove();
  await streamCoachMessage(GREETING, null);
  renderChips(STARTER_CHIPS);
  inputEl.focus();
}

startCoachConversation();
