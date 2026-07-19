/* ============================================================
   Course content for the Learn tab — PM-editable.

   Shape (kept simple so a non-engineer can add courses/lessons):
     course  = { id, title, tagline, emoji, lessons: [lesson] }
     lesson  = { id, title, content: [paragraph, …], quiz: [question] }
     question = { question, options: [string], correctIndex,
                  feedbackCorrect, feedbackWrong }

   Voice: warm, plain, a little playful — same as the Coach. Amounts in ₪.
   Each self-registers into window.P2PI_COURSES (+ a "coming soon" list).
   ============================================================ */
(function () {
  const finance101 = {
    id: "finance101",
    title: "Finance 101",
    tagline: "The absolute basics, in plain language.",
    emoji: "💡",
    lessons: [
      {
        id: "l1",
        title: "What is money actually doing?",
        content: [
          "Most of us learn two things to do with money: earn it (we trade our time and skills for it) and spend it (we trade it back for things we need and want). That's it — earn, spend, repeat.",
          "But there's a third thing money can do that nobody really teaches you: it can work for you. When you save or invest, your money can quietly earn a little more money over time — even while you're asleep or at school. That's the whole big idea behind investing.",
          "And here's the encouraging part: you don't need a big pile to begin. Understanding comes first, money second. The earlier the idea clicks, the more time your money has to grow.",
        ],
        quiz: [
          {
            question: "Besides earning and spending, what's the third thing money can do?",
            options: ["Work for you and grow over time", "Disappear on its own", "Only ever lose value", "Nothing — that's all money does"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — money can work for you and grow!",
            feedbackWrong: "Not quite — the key idea is that money can work for you and grow over time.",
          },
          {
            question: "Do you need a lot of money before it can start working for you?",
            options: ["No — even small amounts can grow", "Yes, at least ₪1,000,000", "Yes, only rich people can invest", "Money can never grow"],
            correctIndex: 0,
            feedbackCorrect: "Right — starting small is completely fine.",
            feedbackWrong: "Actually, even small amounts can grow over time — understanding matters more than a big balance.",
          },
        ],
      },
      {
        id: "l2",
        title: "Inflation: the silent shrink",
        content: [
          "Have you noticed prices slowly creeping up? A snack that costs ₪10 today might cost ₪11 in a few years. That slow, steady rise in prices has a name: inflation.",
          "Inflation means the same ₪100 buys a little less each year. If prices rise about 3% in a year, then ₪100 today buys roughly what ₪97 bought a year ago. The number in your pocket didn't change — but its buying power quietly shrank.",
          "Over ten years that really adds up: ₪100 left untouched under a mattress could feel more like ₪75 in real buying power. That's why just holding cash can slowly cost you — and why people invest to try to outrun inflation.",
        ],
        quiz: [
          {
            question: "What does inflation do to your money?",
            options: ["Slowly reduces what it can buy", "Increases the number in your account", "Makes all prices fall", "Has no real effect"],
            correctIndex: 0,
            feedbackCorrect: "Yes — same shekels, less buying power.",
            feedbackWrong: "Inflation slowly reduces what your money can buy, even when the number stays the same.",
          },
          {
            question: "If prices rise about 3% a year, ₪100 kept as cash for a year later buys roughly…",
            options: ["A bit less — about ₪97 worth", "Exactly ₪100 worth", "More than before", "₪150 worth"],
            correctIndex: 0,
            feedbackCorrect: "Spot on — that's inflation quietly at work.",
            feedbackWrong: "It buys a little less — about ₪97 worth — because prices crept up.",
          },
          {
            question: "Why do many people invest instead of only holding cash?",
            options: ["To try to grow money faster than inflation", "To make prices go down", "Because holding cash is illegal", "To avoid ever taking any risk"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — investing is one way to outrun inflation.",
            feedbackWrong: "The main reason is to try to grow money faster than inflation erodes it.",
          },
        ],
      },
      {
        id: "l3",
        title: "Saving vs investing",
        content: [
          "Saving and investing sound like the same thing, but they do different jobs. Saving is money you keep safe and can grab at any moment — for surprises and short-term goals. Investing is money you put to work for the long run, accepting some ups and downs along the way.",
          "A widely taught starting point is the \"emergency fund\": before investing, set aside roughly 3–6 months of your essential expenses in easy-to-reach cash. That cushion means a surprise bill won't force you to sell investments at a bad moment. (This is a general framework, not personal advice — the right number is yours to decide.)",
          "Once that cushion is in place, money you won't need for years can be invested to grow over the long run. Same person, two different tools, two different jobs.",
        ],
        quiz: [
          {
            question: "What's the main job of your savings?",
            options: ["Money kept safe for surprises and short-term needs", "Growing as fast as humanly possible", "Beating the stock market", "Buying lottery tickets"],
            correctIndex: 0,
            feedbackCorrect: "Right — savings are your safe, grab-anytime cushion.",
            feedbackWrong: "Savings are mainly money kept safe and reachable for surprises and short-term needs.",
          },
          {
            question: "The commonly taught \"emergency fund\" is about…",
            options: ["Roughly 3–6 months of expenses in easy-to-reach cash", "Investing everything you have immediately", "Keeping exactly ₪50 aside", "Borrowing money to invest"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — a cushion first, then invest the rest.",
            feedbackWrong: "It's the idea of keeping roughly 3–6 months of expenses in easy-to-reach cash first.",
          },
          {
            question: "Money you won't need for many years is often…",
            options: ["Invested for long-term growth", "Kept only as cash forever", "Spent right away", "Best ignored completely"],
            correctIndex: 0,
            feedbackCorrect: "Yes — long time horizons suit investing.",
            feedbackWrong: "Money you won't need for years is often invested for long-term growth.",
          },
        ],
      },
      {
        id: "l4",
        title: "Risk and reward",
        content: [
          "Here's one of investing's most honest rules: bigger potential rewards usually come with bigger bumps along the way. Safe things tend to grow slowly and calmly; bolder things can grow faster, but they swing up and down a lot more.",
          "Those swings have a name: volatility. High volatility means the value can jump around a lot from week to week — thrilling on the way up, stressful on the way down. Low volatility means a gentler, steadier ride.",
          "Neither is \"better\" — they're tools for different jobs and different comfort levels. The trick isn't avoiding risk entirely; it's understanding it, so you can pick a ride you can actually stick with. (You can even feel this in the Simulate tab!)",
        ],
        quiz: [
          {
            question: "Higher potential reward usually comes with…",
            options: ["Bigger ups and downs along the way", "Zero risk at all", "A guaranteed profit", "Always lower volatility"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — reward and risk travel together.",
            feedbackWrong: "Higher potential reward usually comes with bigger ups and downs — more bumps along the way.",
          },
          {
            question: "\"Volatility\" is just a plain word for…",
            options: ["How much an investment's value jumps around", "How much tax you pay", "How old a company is", "A type of coin"],
            correctIndex: 0,
            feedbackCorrect: "Yep — it's the size of the ups and downs.",
            feedbackWrong: "Volatility simply means how much an investment's value jumps around.",
          },
          {
            question: "What's the smart goal when it comes to risk?",
            options: ["Understand it and pick a ride you can stick with", "Avoid it completely, forever", "Take as much as possible, always", "Ignore it and hope"],
            correctIndex: 0,
            feedbackCorrect: "Well said — understanding beats avoiding.",
            feedbackWrong: "The goal is to understand risk and choose a ride you can stick with — not to avoid it entirely.",
          },
        ],
      },
    ],
  };

  /* ===================== Investments 101 ===================== */
  const investments101 = {
    id: "investments101",
    title: "Investments 101",
    tagline: "Stocks, indexes, and how to spread risk.",
    emoji: "📊",
    lessons: [
      {
        id: "l1",
        title: "What is a stock?",
        content: [
          "A stock is a tiny slice of ownership in a company. Buy one share and you literally own a small piece of that business — if it does well, your slice can become more valuable; if it struggles, your slice can shrink.",
          "Companies sell shares to raise money to grow, and in return shareholders get to benefit from that growth. Some companies even share a slice of their profits with shareholders — that's called a dividend.",
          "So you're not buying a lottery ticket — you're becoming a part-owner of a real business. That's why understanding what a company actually does matters far more than chasing a hot tip.",
        ],
        quiz: [
          {
            question: "A stock is…",
            options: ["A small piece of ownership in a company", "A loan to the government", "A type of savings account", "A lottery ticket"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — one share is a tiny slice of a real business.",
            feedbackWrong: "A stock is a small piece of ownership in a company.",
          },
          {
            question: "If a company you own shares in grows over time, your share…",
            options: ["Can become more valuable", "Always stays exactly the same", "Turns into cash automatically", "Disappears"],
            correctIndex: 0,
            feedbackCorrect: "Right — you benefit from the company's growth.",
            feedbackWrong: "If the company grows, your share can become more valuable.",
          },
          {
            question: "A \"dividend\" is…",
            options: ["A slice of profits some companies pay shareholders", "A penalty for selling", "A government tax", "A type of stock"],
            correctIndex: 0,
            feedbackCorrect: "Yep — some companies share profits as dividends.",
            feedbackWrong: "A dividend is a share of profits that some companies pay to their shareholders.",
          },
        ],
      },
      {
        id: "l2",
        title: "What is an index?",
        content: [
          "Instead of picking one company, an index bundles many together and tracks them as a group — one simple number that answers \"how are all these companies doing overall?\"",
          "Famous examples: the S&P 500 (500 of the biggest U.S. companies), the NASDAQ (tech-heavy, with bigger swings), the Dow Jones (30 classic U.S. giants), and Israel's TA-35 (the 35 largest companies in Tel Aviv). Buy into an index and you're spread across all its companies at once.",
          "That built-in spreading is why so many people use a broad index as a starting point: instead of betting on a single winner, you get a slice of the whole group.",
        ],
        quiz: [
          {
            question: "An index is…",
            options: ["A group of many companies tracked together", "A single company's stock", "A type of bank account", "A government loan"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — one number for a whole group of companies.",
            feedbackWrong: "An index tracks many companies together as a group.",
          },
          {
            question: "Which of these is the tech-heavy index known for bigger swings?",
            options: ["The NASDAQ", "The Dow Jones", "The TA-35", "A savings bond"],
            correctIndex: 0,
            feedbackCorrect: "Right — the NASDAQ leans tech, so it's bumpier.",
            feedbackWrong: "The NASDAQ is the tech-heavy index known for bigger swings.",
          },
          {
            question: "Israel's leading index of its 35 largest companies is…",
            options: ["The TA-35", "The S&P 500", "The Dow Jones", "The NASDAQ"],
            correctIndex: 0,
            feedbackCorrect: "Yep — the TA-35 tracks Tel Aviv's biggest names.",
            feedbackWrong: "That's the TA-35 — Israel's 35 largest companies.",
          },
        ],
        tryIt: {
          label: "See the S&P 500's real journey →",
          simulatorPreset: { assets: ["sp500"], amount: 1000, startYear: 2015, leverage: 1 },
        },
      },
      {
        id: "l3",
        title: "Diversification: don't put it all in one basket",
        content: [
          "There's an old saying: don't put all your eggs in one basket. In investing that's called diversification — spreading your money across different investments so one bad apple can't spoil everything.",
          "When you spread out, a rough year for one holding can be softened by a steadier or better year from another. It doesn't erase risk, and it won't save you if everything falls at once — but historically, a mix tends to have gentler ups and downs than any single bet.",
          "Our Simulator shows this beautifully: split your money across a few indexes and watch the \"worst year\" get milder. That softening is diversification doing its quiet job.",
        ],
        quiz: [
          {
            question: "Diversification means…",
            options: ["Spreading money across different investments", "Putting everything into one stock", "Only ever holding cash", "Borrowing to invest"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — spread out, don't concentrate.",
            feedbackWrong: "Diversification means spreading your money across different investments.",
          },
          {
            question: "One honest limit of diversification is…",
            options: ["It won't save you if everything falls at once", "It guarantees a profit", "It removes all risk forever", "It only works for rich people"],
            correctIndex: 0,
            feedbackCorrect: "Right — it softens bumps, but it isn't magic.",
            feedbackWrong: "Diversification softens bumps, but it won't save you if everything falls together.",
          },
          {
            question: "In the Simulator, splitting your money tends to make the worst year…",
            options: ["Milder", "Much worse", "Disappear entirely", "Exactly the same, always"],
            correctIndex: 0,
            feedbackCorrect: "Yep — that softening is the diversification callout at work.",
            feedbackWrong: "Splitting tends to make the worst year milder — that's what the diversification callout shows.",
          },
        ],
        tryIt: {
          label: "See how a 50/50 split handled 2008 →",
          simulatorPreset: { assets: ["sp500", "agg"], allocation: [50, 50], amount: 1000, startYear: 2007, leverage: 1 },
        },
      },
      {
        id: "l4",
        title: "Fees: the quiet leak",
        content: [
          "Investing usually comes with small fees, and they're worth understanding because they're so easy to miss. A common one is a management fee — a yearly percentage a fund charges just to run itself.",
          "The numbers sound tiny, but they add up. Imagine two funds: one charges 0.1% a year, the other 1%. On ₪10,000 that's ₪10 versus ₪100 a year — and over many years, that gap quietly compounds into a real difference in what you keep.",
          "Fees aren't evil — they pay for a service. But a great habit is simply to know what you're paying. Low-cost broad index funds are popular partly because their fees are so small.",
        ],
        quiz: [
          {
            question: "A management fee is…",
            options: ["A yearly percentage a fund charges to run itself", "A one-time government tax", "A penalty for winning", "A type of dividend"],
            correctIndex: 0,
            feedbackCorrect: "Right — a small yearly cost to run the fund.",
            feedbackWrong: "A management fee is a yearly percentage a fund charges to run itself.",
          },
          {
            question: "On ₪10,000, a 1% yearly fee costs about…",
            options: ["₪100 a year", "₪1 a year", "₪1,000 a year", "Nothing at all"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — 1% of ₪10,000 is ₪100.",
            feedbackWrong: "1% of ₪10,000 is ₪100 a year — small-sounding, but it adds up.",
          },
          {
            question: "Why do fees matter over the long run?",
            options: ["Small percentages compound into real money", "They are always enormous", "They make prices rise", "They don't matter at all"],
            correctIndex: 0,
            feedbackCorrect: "Yep — tiny leaks add up over many years.",
            feedbackWrong: "Even small fees compound into a real difference over many years.",
          },
        ],
      },
    ],
  };

  /* ===================== Leverage 101 ===================== */
  const leverage101 = {
    id: "leverage101",
    title: "Leverage 101",
    tagline: "Borrowed money, bigger swings — handle with care.",
    emoji: "⚡",
    lessons: [
      {
        id: "l1",
        title: "Borrowing to invest: how leverage works",
        content: [
          "Leverage means investing with borrowed money, so your position is bigger than your own cash. The catch: it multiplies movement in BOTH directions — equally.",
          "Quick example: put in ₪1,000 at 4x, and you're controlling ₪4,000. If the market rises 10%, you don't gain 10% — you gain about 40% (₪400). But if it falls 10%, you lose about 40% (₪400) of your own money, not 10%.",
          "Same tool, opposite outcomes. Leverage doesn't create free upside; it stretches the risk right alongside the reward. That's the one idea to hold onto.",
        ],
        quiz: [
          {
            question: "Leverage means…",
            options: ["Investing with borrowed money to control a bigger position", "Only ever using your own cash", "A type of savings account", "A way to avoid all risk"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — borrowed money, bigger position.",
            feedbackWrong: "Leverage means using borrowed money to control a bigger position.",
          },
          {
            question: "With ₪1,000 at 4x, a 10% market rise gives you about…",
            options: ["+40% (₪400)", "+10% (₪100)", "+4% (₪40)", "Nothing"],
            correctIndex: 0,
            feedbackCorrect: "Right — 4x turns a 10% rise into about +40%.",
            feedbackWrong: "At 4x, a 10% rise becomes about +40% (₪400) — and a 10% fall becomes −40%.",
          },
          {
            question: "The key thing leverage multiplies is…",
            options: ["Both gains AND losses", "Only your gains", "Only your losses", "Neither"],
            correctIndex: 0,
            feedbackCorrect: "Yep — both directions, equally.",
            feedbackWrong: "Leverage multiplies both gains AND losses, equally.",
          },
        ],
        tryIt: {
          label: "Watch 4x leverage in action →",
          simulatorPreset: { assets: ["sp500"], amount: 1000, startYear: 2015, leverage: 4 },
        },
      },
      {
        id: "l2",
        title: "The margin call",
        content: [
          "When you invest with borrowed money and the market drops, your losses grow fast — because they're multiplied. If your own money (your cushion) shrinks too far, the lender steps in to protect their loan.",
          "That moment is called a margin call: the lender automatically sells your position, locking in the loss before it can fall further. It's not a punishment — it's how the lender makes sure they get their money back.",
          "The hard part is the timing: a margin call can wipe you out right before the market recovers, so you miss the rebound entirely. It's the clearest reason leverage is risky — and why our Simulator lets you trigger one safely to watch it happen.",
        ],
        quiz: [
          {
            question: "A margin call happens when…",
            options: ["Your cushion shrinks too far and the lender closes your position", "You make too much profit", "You choose to sell voluntarily", "The market goes up"],
            correctIndex: 0,
            feedbackCorrect: "Right — the lender steps in to protect their loan.",
            feedbackWrong: "A margin call is when your cushion gets too thin and the lender closes your position.",
          },
          {
            question: "Why does a margin call exist?",
            options: ["So the lender can recover the money they lent", "To reward risky investors", "To push prices higher", "As a government rule for savers"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — it protects the lender's loan.",
            feedbackWrong: "It exists so the lender can recover the money they lent you.",
          },
          {
            question: "The painful part of a margin call is…",
            options: ["It can lock in losses right before a recovery", "It always makes you money", "It removes all risk", "It has no downside"],
            correctIndex: 0,
            feedbackCorrect: "Yep — you can miss the rebound entirely.",
            feedbackWrong: "It can lock in your loss right before the market recovers — so you miss the bounce-back.",
          },
        ],
        tryIt: {
          label: "Trigger a margin call safely →",
          simulatorPreset: { assets: ["nasdaq"], amount: 1000, startYear: 2007, leverage: 5 },
        },
      },
      {
        id: "l3",
        title: "Who should even think about leverage?",
        content: [
          "Here's the honest answer: leverage isn't a beginner tool, and there's no universal \"right\" amount — it depends entirely on the person. So instead of telling you what to do, let's talk about the questions people weigh.",
          "Two big ones: risk tolerance (could you stay calm, and stay invested, if a leveraged position dropped 40% in a month?) and time horizon (money you might need soon has no room to recover from a margin call). The more you'd panic, or the sooner you need the money, the less room there is for leverage.",
          "This is education, not advice — we can explain how leverage works and what to consider, but the choice is always yours to make, ideally only once you deeply understand the risks. When in doubt, the calmest option is simply not using it.",
        ],
        quiz: [
          {
            question: "Is there a single \"right\" amount of leverage for everyone?",
            options: ["No — it depends entirely on the person", "Yes, always 4x", "Yes, always 5x", "Yes, everyone should max it out"],
            correctIndex: 0,
            feedbackCorrect: "Right — it's personal, never one-size-fits-all.",
            feedbackWrong: "There's no universal right amount — it depends entirely on the person.",
          },
          {
            question: "Money you might need soon is…",
            options: ["A poor match for leverage — no room to recover", "Perfect for maximum leverage", "Safest when leveraged", "Completely unaffected by risk"],
            correctIndex: 0,
            feedbackCorrect: "Exactly — short horizons and leverage clash.",
            feedbackWrong: "Money you might need soon has no room to recover from a margin call, so it's a poor match for leverage.",
          },
          {
            question: "What's this lesson's honest stance?",
            options: ["Education on the trade-offs — the choice is yours", "A recommendation to use 5x", "A promise of guaranteed profits", "Advice to avoid all investing"],
            correctIndex: 0,
            feedbackCorrect: "Yep — we teach; you decide.",
            feedbackWrong: "It's education on the trade-offs — we explain, but the choice is always yours.",
          },
        ],
      },
    ],
  };

  window.P2PI_COURSES = window.P2PI_COURSES || [];
  window.P2PI_COURSES.push(finance101, investments101, leverage101);

  // All three courses are real now — no "coming soon" placeholders.
  window.P2PI_COURSES_SOON = [];
})();
