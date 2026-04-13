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

// Central game state keeps the UI and persistence logic in sync.
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
const reelCycles = 12;

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

// Seed each reel with a visible symbol before any user interaction.
function setReelFace(reel, icon) {
  reel.innerHTML = `<div class="reel-cell is-final">${icon}</div>`;
  reel.style.transform = "translateY(0)";
  reel.style.transition = "none";
}

// Build a vertical strip so the reel can actually scroll before landing.
function buildReelSequence(finalSymbol, index) {
  const sequence = [];

  for (let step = 0; step < reelCycles + index * 3; step += 1) {
    sequence.push(pickSymbol());
  }

  sequence.push(finalSymbol);
  return sequence;
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
        const sequence = buildReelSequence(finalResult[index], index);

        reel.innerHTML = sequence
          .map(
            (symbol, symbolIndex) =>
              `<div class="reel-cell${symbolIndex === sequence.length - 1 ? " is-final" : ""}">${symbol.icon}</div>`
          )
          .join("");

        const finalOffset = (sequence.length - 1) * 100;
        reel.style.transition = "none";
        reel.style.transform = "translateY(0)";

        // Force layout so the browser sees the reset position before the animated one.
        reel.getBoundingClientRect();

        reel.style.transition = `transform ${900 + index * 220}ms cubic-bezier(0.16, 0.84, 0.28, 1)`;
        reel.style.transform = `translateY(-${finalOffset}%)`;

        window.setTimeout(() => {
          setReelFace(reel, finalResult[index].icon);
          resolve();
        }, 980 + index * 220);
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
    setReelFace(reel, symbols[index].icon);
  });
  headline.textContent = "Fresh runway acquired.";
  subhead.textContent = "New quarter, same plan: turn tokens into branding.";
  saveState();
  render();
  showToast("Runway reset. The board believes in you again.", "good");
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

// Draw the default reel faces first, then restore any persisted counters.
reels.forEach((reel, index) => {
  setReelFace(reel, symbols[index].icon);
});

loadState();
