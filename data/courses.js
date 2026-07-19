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

  window.P2PI_COURSES = window.P2PI_COURSES || [];
  window.P2PI_COURSES.push(finance101);

  // Teaser cards that signal more is coming (not yet built).
  window.P2PI_COURSES_SOON = [
    { emoji: "📊", title: "Investing 201", tagline: "Indexes, diversification, and leverage — deeper." },
    { emoji: "🧠", title: "Money Mindset", tagline: "Habits, goals, and beating impulse spending." },
  ];
})();
