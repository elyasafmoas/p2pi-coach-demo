# P2Pi Coach — GenAI Investment Coach (Demo)

A polished, front-end-only prototype of **P2Pi Coach**: a GenAI investment coach for
first-time Gen Z investors. It demonstrates one product principle above all else —
**the coach educates, but never advises.**

> **DEMO — simulated coach, not financial advice.** All responses are scripted for
> demonstration purposes. See the Disclaimer below.

---

## What P2Pi is

P2Pi is a community investment app for Gen Z — the tagline is *"Invest, share, grow."*
The core insight behind the product is that the biggest barrier for first-time investors
isn't a lack of money — it's **fear**. Young people often hold cash on the sidelines not
because they can't invest, but because they don't understand what's happening to their
money and are afraid of doing something wrong.

P2Pi's answer is a **coach that removes the fear by building understanding** — in plain,
jargon-free language, on the user's terms.

## What this demo shows

This repo is a working slice of that coach experience, built as a portfolio piece:

- **A branded chat coach** that greets the user and answers common beginner questions
  (leverage, volatility, the S&P 500, fees, inflation, market drops, where to begin) in
  warm, plain language — with simulated "thinking" and word-by-word streaming so it feels
  like a live LLM.
- **The educate-never-advise guardrail** — the heart of the demo. When the user asks for
  *personal advice* ("Should I use 4x leverage?", "Just tell me what to buy", "Is now a
  good time to invest?"), the coach **does not answer**. Instead it renders a visually
  distinct **guardrail card** — gold border, shield icon, "Education only — no personal
  advice" — and offers to teach the underlying concept instead.

This is the compliance-critical behavior for a regulated, insurance-adjacent product:
the AI can explain *how leverage works*, but it will never tell you *how much leverage to
use with your money*. That decision always stays with the person.

## How to run it

No build step, no dependencies, no backend, no API keys.

**Just open [`index.html`](index.html) in any browser.**

It's a plain static site (`index.html` + `style.css` + `app.js`) and deploys to GitHub
Pages as-is.

## Try these (to see the two behaviors)

**Educational answers:**
- *"What is leverage?"* → a plain-language explanation with a quick ₪1,000-at-4x example.
- *"What happens if the market drops after I invest?"* → paper loss vs. realized loss.

**The guardrail (advice-seeking is blocked):**
- *"Should I use 4x leverage?"* → gold guardrail card, then an offer to explain the concept.
- *"Just tell me what to buy."* → guardrail card, no recommendation.

## How it would work in production

The demo's answers are **scripted** in a small JavaScript data structure. In the real
product, the same experience would be powered by:

1. **An LLM** for natural, plain-language conversation.
2. **RAG** (retrieval-augmented generation) grounded in **vetted, compliance-approved
   financial-education content**, so answers stay accurate, current, and on-brand.
3. **A deterministic guardrail layer** that classifies user intent *before* the model
   responds and hard-blocks personal advice — independent of whatever the model might
   otherwise generate.

**Guardrail principle: the AI never moves money and never advises.** It teaches how things
work; the decision always belongs to the user.

## Project structure

| File | Purpose |
|------|---------|
| [`index.html`](index.html) | Page structure: header, chat window, chips, input, modal. |
| [`style.css`](style.css) | P2Pi brand styling (dark charcoal + gold), responsive layout. |
| [`app.js`](app.js) | Scripted coach: guardrail rules, Q&A bank, streaming, chips. |

The content (greeting, answers, guardrail wording) lives in clearly-labeled data
structures at the top of `app.js` so a non-engineer can read and edit it.

## Disclaimer

This is a **demonstration prototype only**. It does not provide financial, investment, or
any other professional advice. All coach responses are scripted for illustration and may
be simplified or incomplete. Nothing here should be relied upon to make real financial
decisions. Numbers in examples are illustrative.

---

*Built by **Elyasaf Moas** — GenAI Product Owner portfolio demo.*
