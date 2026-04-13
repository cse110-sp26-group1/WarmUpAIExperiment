const symbols = [
  {
    icon: "🪙",
    label: "Token Rain",
    payout: 90,
    headline: "Revenue event detected.",
    subhead: "Three coins. The startup accidentally has a business model.",
  },
  {
    icon: "🤖",
    label: "Hallucination",
    payout: 70,
    headline: "The machine is certain and probably wrong.",
    subhead: "Confidence scored higher than truth, but you still got paid.",
  },
  {
    icon: "📈",
    label: "Growth Deck",
    payout: 55,
    headline: "Metrics have entered presentation mode.",
    subhead: "Charts climbed. Nobody asked what the y-axis means.",
  },
  {
    icon: "🔥",
    label: "Viral Clip",
    payout: 40,
    headline: "A demo went viral for reasons unrelated to reliability.",
    subhead: "Two seconds of spectacle just covered another inference bill.",
  },
  {
    icon: "🧠",
    label: "Compute Brain",
    payout: 48,
    headline: "You rented more GPUs than judgment.",
    subhead: "It worked just long enough for the keynote.",
  },
  {
    icon: "404",
    label: "Context Window Missing",
    payout: 0,
    headline: "The model summarized the prompt instead of reading it.",
    subhead: "Classic 404 combo. Tokens gone, swagger intact.",
  },
];

const state = {
  tokens: 120,
  spinCost: 15,
  streak: 0,
  isSpinning: false,
};

const tokenCount = document.getElementById("token-count");
const spinCost = document.getElementById("spin-cost");
const streakBonus = document.getElementById("streak-bonus");
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");
const headline = document.getElementById("headline");
const subhead = document.getElementById("subhead");
const machine = document.querySelector(".machine");
const reels = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
const toastTemplate = document.getElementById("toast-template");

const storageKey = "token-hallucination-casino";

function loadState() {
  const saved = localStorage.getItem(storageKey);

  if (!saved) {
    render();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.tokens = Number.isFinite(parsed.tokens) ? Math.max(0, parsed.tokens) : state.tokens;
    state.spinCost = Number.isFinite(parsed.spinCost)
      ? Math.min(45, Math.max(15, parsed.spinCost))
      : state.spinCost;
    state.streak = Number.isFinite(parsed.streak) ? Math.max(0, parsed.streak) : state.streak;
  } catch {
    localStorage.removeItem(storageKey);
  }

  render();
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      tokens: state.tokens,
      spinCost: state.spinCost,
      streak: state.streak,
    })
  );
}

function render() {
  tokenCount.textContent = state.tokens;
  spinCost.textContent = state.spinCost;
  streakBonus.textContent = `x${1 + state.streak}`;
  spinButton.disabled = state.isSpinning || state.tokens < state.spinCost;
}

function pickSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function evaluate(result) {
  const icons = result.map((item) => item.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});

  const [topIcon, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const matchedSymbol = symbols.find((entry) => entry.icon === topIcon);

  if (topCount === 3 && matchedSymbol) {
    const payout = matchedSymbol.payout + state.streak * 10;
    return {
      payout,
      won: true,
      headline: matchedSymbol.headline,
      subhead: `${matchedSymbol.subhead} Streak bonus added: +${state.streak * 10} tokens.`,
    };
  }

  if (topCount === 2) {
    return {
      payout: 25 + state.streak * 5,
      won: true,
      headline: "Partial alignment. The benchmark was probably cherry-picked.",
      subhead: "Two matching symbols. Enough synergy to keep the slide deck alive.",
    };
  }

  return {
    payout: 0,
    won: false,
    headline: "No alignment detected.",
    subhead: "The machine spent your tokens on speculative autocomplete.",
  };
}

function showToast(message, tone) {
  const existing = document.querySelector(".toast");
  existing?.remove();

  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  toast.classList.add(tone);
  document.body.appendChild(toast);

  window.setTimeout(() => toast.remove(), 2200);
}

function animateReels(finalResult) {
  return Promise.all(
    reels.map((reel, index) => {
      return new Promise((resolve) => {
        let ticks = 0;
        const interval = window.setInterval(() => {
          reel.textContent = pickSymbol().icon;
          ticks += 1;

          if (ticks > 7 + index * 3) {
            window.clearInterval(interval);
            reel.textContent = finalResult[index].icon;
            resolve();
          }
        }, 85);
      });
    })
  );
}

async function spin() {
  if (state.isSpinning || state.tokens < state.spinCost) {
    if (state.tokens < state.spinCost) {
      showToast("Out of tokens. Even fake AI economics has limits.", "bad");
    }
    return;
  }

  const spent = state.spinCost;
  state.isSpinning = true;
  state.tokens -= spent;
  machine.classList.add("spinning");
  machine.classList.remove("win");
  headline.textContent = "Burning tokens...";
  subhead.textContent = "Prompt engineering the lever. Please enjoy the latency.";
  render();

  const finalResult = [pickSymbol(), pickSymbol(), pickSymbol()];
  await animateReels(finalResult);

  const outcome = evaluate(finalResult);
  state.tokens += outcome.payout;
  state.streak = outcome.won ? state.streak + 1 : 0;
  state.spinCost = Math.min(45, 15 + state.streak * 3);
  state.isSpinning = false;

  machine.classList.remove("spinning");
  machine.classList.toggle("win", outcome.won);
  headline.textContent = outcome.headline;
  subhead.textContent = outcome.subhead;

  showToast(
    outcome.won
      ? `You won ${outcome.payout} tokens. Monetization remains mostly fictional.`
      : `You lost ${spent} tokens to the inference void.`,
    outcome.won ? "good" : "bad"
  );

  saveState();
  render();
}

function resetGame() {
  state.tokens = 120;
  state.spinCost = 15;
  state.streak = 0;
  state.isSpinning = false;
  machine.classList.remove("spinning", "win");
  reels.forEach((reel, index) => {
    reel.textContent = symbols[index].icon;
  });
  headline.textContent = "Fresh runway acquired.";
  subhead.textContent = "New quarter, same plan: turn tokens into branding.";
  saveState();
  render();
  showToast("Runway reset. The board believes in you again.", "good");
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

loadState();
