# P2Pi Coach — a classroom GenAI investing demo

A polished, front-end-only prototype of **P2Pi Coach**: a friendly GenAI coach that
teaches young students how investing works. Built for a **financial-literacy classroom**,
it demonstrates one product principle above all else — **the coach educates, but never
tells you what to buy.**

> **DEMO — simulated coach, not financial advice.** All coach replies are scripted, and
> the simulator uses approximate historical data for learning only. See the Disclaimer.

**▶ Live demo:** https://elyasafmoas.github.io/p2pi-coach-demo/

---

## What P2Pi is

P2Pi is a community investment app for Gen Z — the tagline is *"Invest, share, grow."*
The core insight: the biggest barrier for first-time investors isn't a lack of money —
it's **fear**. Young people hold cash on the sidelines because they don't understand what
happens to their money and are afraid of doing something wrong. P2Pi removes the fear by
**building understanding first**, in plain, jargon-free language.

## The three tabs

The demo is a mobile-first, single-page app with a tab bar (bottom on phones, top on
desktop):

### 💬 Learn — the Coach
A branded chat coach that greets the student and answers common beginner questions
(leverage, volatility, the S&P 500, fees, inflation, market drops, where to begin) in
warm, plain language — with a simulated "thinking" pause and word-by-word streaming so it
feels like a live AI. Suggested-question chips make it easy to explore.

**The guardrail is the heart of the demo.** When a student asks for *personal advice*
("Should I use 4x leverage?", "Just tell me what to buy", "Is now a good time to invest?"),
the coach **does not answer**. It shows a friendly-protective **guardrail card** — white
card, magenta border, shield icon, *"We teach, we don't tell you what to buy"* — and offers
to explain the underlying concept instead. The AI explains *how leverage works*, but never
*how much leverage to use with your money*.

### 📈 Simulate — a historical time machine
Pick an **amount** (₪100–₪10,000), a **starting year** (1985–2024), and a **leverage**
level (1x–5x), then hit *"Show me what would've happened."* The app replays real S&P 500
history and shows:
- an animated count-up to today's value, with profit/loss in ₪ and %,
- a hand-rolled SVG line chart of the journey (no chart library),
- honest storytelling about the **worst dip** along the way, always in shekels, and
- a **margin-call teaching card** when leverage would have wiped the student out during a
  crash (e.g. 5x from 2007) — framed as a lesson, not an error.

### 🪙 My Coins — light gamification
A coin balance (saved in the browser) that rewards exploration:
- **+1** for every question asked,
- **+3** for each simulation run,
- **+5** the first time a student tries leverage above 1x.

Plus a locked *"Coming soon: redeem coins for community perks"* teaser that signals the
community vision without building it.

## How to run it

No build step, no dependencies, no backend, no API keys.

**Just open [`index.html`](index.html) in any browser** (or visit the live link above).

## How to deploy (GitHub Pages)

It's a plain static site, so GitHub Pages serves it as-is:

1. Push to the `main` branch of a GitHub repo.
2. **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, then pick
   **`main` / root** and Save.
3. The site publishes at `https://<user>.github.io/<repo>/` within a minute, and
   re-deploys automatically on every push.

## Try these (to feel the product)

- Ask *"What is leverage?"* → a plain explanation with a quick ₪1,000-at-4x example.
- Type *"Should I use 4x leverage?"* → the **guardrail card**, not an answer.
- Simulate **₪1,000 from 2015 at 1x** → a plausible, encouraging S&P result.
- Simulate **₪1,000 from 2007 at 5x** → the **margin-call teaching moment**.
- Open **My Coins** to watch the balance climb as you explore.

## How it would work in production

The demo's answers are **scripted** and the market data is approximate. In the real
product, the same experience would be powered by:

1. **An LLM** for natural, plain-language conversation.
2. **RAG** grounded in **vetted, compliance-approved financial-education content**, so
   answers stay accurate and on-brand.
3. **A deterministic guardrail layer** that classifies intent *before* the model responds
   and hard-blocks personal advice — independent of whatever the model might generate.

**Guardrail principle: the AI never moves money and never advises.** It teaches how things
work; the decision always belongs to the person.

## Project structure

| File | Purpose |
|------|---------|
| [`index.html`](index.html) | Page structure: header, tabs, three panels, modal. |
| [`style.css`](style.css) | Vivid magenta-on-white brand (Lemonade-inspired); all colors are `:root` variables. |
| [`app.js`](app.js) | The Coach: guardrail rules, Q&A bank, streaming, chips, onboarding, reset. |
| [`simulate.js`](simulate.js) | The Simulator: leverage math, margin calls, SVG chart, count-up. |
| [`coins.js`](coins.js) | My Coins tab: balance display and coin animation. |
| [`store.js`](store.js) | Shared coin/flag state, persisted to `localStorage`. |
| [`data/sp500_monthly.js`](data/sp500_monthly.js) | Approximate monthly S&P 500 values, 1985–2024, for the simulator. |

Coach content and colors live in clearly-labeled structures at the top of their files so a
non-engineer can read and edit them.

## Disclaimer

This is a **demonstration prototype only**. It does not provide financial, investment, or
any other professional advice. Coach responses are scripted; the simulator uses
approximate, unofficial historical data for **educational illustration only** and is not a
prediction. Nothing here should be relied upon to make real financial decisions.

---

*Built by **Elyasaf Moas** — GenAI Product Owner portfolio demo.*
