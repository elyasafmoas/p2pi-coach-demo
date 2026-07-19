# P2π Coach — a classroom GenAI investing demo

A polished, front-end-only prototype of **P2π Coach**: a friendly GenAI coach that
teaches young students how investing works. Built for a **financial-literacy classroom**,
it demonstrates one product principle above all else — **the coach educates, but never
tells you what to buy.**

> **DEMO — simulated coach, not financial advice.** All coach replies are scripted, and
> the simulator uses approximate historical data for learning only. See the Disclaimer.

**▶ Live demo:** https://elyasafmoas.github.io/p2pi-coach-demo/

---

## What P2π is

P2π is a community investment app for Gen Z — the tagline is *"Invest, share, grow."*
The core insight: the biggest barrier for first-time investors isn't a lack of money —
it's **fear**. Young people hold cash on the sidelines because they don't understand what
happens to their money and are afraid of doing something wrong. P2π removes the fear by
**building understanding first**, in plain, jargon-free language.

## First impression: a conversational onboarding

On a true first visit (or after **Start over**), the Coach opens a streamed, agent-style
**welcome conversation**: it asks at most two quick questions ("What sounds most like you?" →
read-first / try-first, or theory / crash-a-sim), then visibly **acts** — it badges a
"Recommended for you" course on the Learn tab and/or pre-loads a simulation, then drops you
right there. It's skippable ("Skip for now") and re-runnable anytime from **Settings →
"Redo my welcome"** (without wiping progress). The persona is remembered so the recommended
badge persists.

## The layout

The demo is a mobile-first, single-page app with a two-tab bar (bottom on phones, top on
desktop) — **Learn** and **Simulate** — plus a tappable **coin counter** in the header that
opens the **My Coins** rewards overlay.

The architecture: **Learn = learn it, Simulate = do it + ask about it, coins = rewards.**

### 📚 Learn — the course marketplace
A grid of short, playful **courses** — Finance 101, Investments 101, Leverage 101 — each a
handful of bite-size lessons ending in a quick quiz. Passing a quiz completes a lesson
(**+2 coins**); finishing a course gives a **+5** bonus. Progress persists in the browser.
Relevant lessons end with a magenta **"try it in the Simulator"** button that jumps to the
Simulate tab with the right values pre-loaded (e.g. *"Trigger a margin call safely →"*).

### 📈 Simulate — do it, then ask the Coach
Pick **one or more assets** — S&P 500, NASDAQ, Dow Jones, Israel's TA-35, or the defensive
**Bond ETF (AGG)** — an **amount** (₪100–₪10,000), a **starting year** (the slider adapts to
the earliest reliable data of your picks — e.g. TA-35 starts in 2000, the Bond ETF in 2004),
and a **leverage** level (1x–5x), then hit *"Show me what would've happened."*

**The Coach now lives here, and it's results-aware.** Once a simulation runs, a Coach panel
appears (a right-hand column on desktop, a tap-up **bottom-sheet** on mobile) and **narrates
your result in its own voice** — a reaction with your numbers, the worst-year story, a
shield-styled margin-call card, a diversification note — as streamed messages. The insights
that used to be static cards now all come from this one voice. (First run of a session gets
the full streamed experience; repeat runs are snappy and condensed.) Its follow-up questions
are generated from *your* result — *"What just happened to my money?"*, *"Why did everything
drop in 2008?"*, *"What would 1x have looked like?"* — and answers interpolate your actual
numbers (including a computed 1x-vs-leverage comparison).

**The guardrail is still the heart of the demo.** Ask for *personal advice* ("what should I
buy", "which asset is best", "should I add leverage") and the Coach **does not answer** — it
shows the friendly-protective **guardrail card** (*"We teach, we don't tell you what to
buy"*), now context-aware: *"I can explain what leverage DID to this result — deciding what
to do next is yours."*

**Portfolio splitting:** tap multiple assets to build a portfolio (1–4). An allocation panel
appears with a slider per asset (always summing to 100%, with a live donut chart) and quick
presets — **Equal split**, **Mostly safe** (a defensive 70% Bond ETF / 30% S&P 500 mix), and
**Adventurous** (tilts toward NASDAQ). Results show one bold total line plus tappable
per-asset lines (the calm Bond line shows by default so the flat-vs-bumpy contrast is
obvious), a per-asset breakdown table, and a **diversification callout** when splitting
softened the worst year. The app replays real history and shows:
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

- In **Learn**, play a Finance 101 lesson → pass the quiz → watch coins land.
- In **Simulate**, run **₪1,000 in S&P 500 from 2007 at 4x** → the **margin-call card** →
  ask the Coach *"What just happened to my money?"* → it answers with **your** numbers and a
  1x comparison.
- Then type *"what should I buy"* → the **guardrail card**, not an answer.
- Simulate a **50/50 S&P + Bond ETF** split → see the **diversification callout**.
- Tap the **coin counter** (top-right) to watch your balance climb as you learn and explore.

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
| [`index.html`](index.html) | Page structure: header, two tabs, panels, coins overlay, modals. |
| [`style.css`](style.css) | Vivid magenta-on-white brand (Lemonade-inspired); all colors are `:root` variables. |
| [`app.js`](app.js) | The results-aware **Coach** (in the Simulate tab): guardrail rules, context answers, general Q&A bank, streaming, chips. |
| [`simulate.js`](simulate.js) | The Simulator: multi-asset leverage math, margin calls, SVG chart, count-up, and the `SimulationContext` it hands the Coach. |
| [`learn.js`](learn.js) | The Learn course marketplace: course/lesson/quiz UI, progress, and the "try it in the Simulator" bridge. |
| [`data/courses.js`](data/courses.js) | Course content (Finance 101, Investments 101, Leverage 101) — PM-editable. |
| [`coins.js`](coins.js) | My Coins overlay (opened from the header counter): balance + coin animation. |
| [`store.js`](store.js) | Shared coin/flag state, persisted to `localStorage`. |
| [`data/*.js`](data/) | Approximate monthly index data (S&P 500, NASDAQ, Dow, TA-35, Bond ETF), for the simulator. |

Coach content, course content, and colors live in clearly-labeled structures at the top of
their files so a non-engineer can read and edit them.

## Disclaimer

This is a **demonstration prototype only**. It does not provide financial, investment, or
any other professional advice. Coach responses are scripted; the simulator uses
approximate, unofficial historical data for **educational illustration only** and is not a
prediction. Nothing here should be relied upon to make real financial decisions.

---

*Built by **Elyasaf Moas** — GenAI Product Owner portfolio demo.*
