const symbols = [
  { label: "GPU", weight: 4 },
  { label: "PROMPT", weight: 4 },
  { label: "SEED", weight: 3 },
  { label: "AGI", weight: 2 },
  { label: "TOKEN", weight: 3 },
  { label: "VC", weight: 2 }
];

const jokeWins = {
  AGI: [
    "Three AGIs. Congratulations, you have solved intelligence and immediately monetized it with a subscription tier.",
    "AGI jackpot. Ethics committee postponed until after product launch."
  ],
  GPU: [
    "Three GPUs. The cloud bill salutes you.",
    "GPU sweep. Somewhere, a startup just pivoted to infrastructure."
  ],
  PROMPT: [
    "Prompt parade. You have successfully turned adjectives into shareholder value.",
    "Three prompts. Nothing is built, but the demo sounds incredible."
  ],
  pair: [
    "A tidy pair. Investors call this traction.",
    "Two of a kind. Slide deck updated, reality unchanged."
  ],
  loss: [
    "No match. The tokens were reinvested into a webinar about responsible disruption.",
    "Bust. At least your burn rate still looks intentional."
  ],
  burn: [
    "Forty tokens vaporized on premium copilots and artisanal embeddings.",
    "Token burn complete. The roadmap now includes six agents and zero accountability."
  ]
};

const state = {
  balance: 120,
  spinCost: 15,
  spins: 0,
  burned: 0,
  bestWin: 0,
  lastWin: 0,
  spinning: false
};

const reelEls = [
  document.getElementById("reel1"),
  document.getElementById("reel2"),
  document.getElementById("reel3")
];

const tokenBalanceEl = document.getElementById("tokenBalance");
const spinCostEl = document.getElementById("spinCost");
const lastWinEl = document.getElementById("lastWin");
const spinCountEl = document.getElementById("spinCount");
const tokensBurnedEl = document.getElementById("tokensBurned");
const bestWinEl = document.getElementById("bestWin");
const statusEl = document.getElementById("status");
const spinButton = document.getElementById("spinButton");
const cashOutButton = document.getElementById("cashOutButton");

function weightedPick() {
  const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const symbol of symbols) {
    cursor -= symbol.weight;
    if (cursor <= 0) {
      return symbol.label;
    }
  }

  return symbols[symbols.length - 1].label;
}

function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function evaluate(result) {
  const counts = result.reduce((map, label) => {
    map[label] = (map[label] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topLabel, topCount] = entries[0];

  if (topCount === 3) {
    if (topLabel === "GPU") {
      return { payout: 140, message: choice(jokeWins.GPU) };
    }

    if (topLabel === "AGI") {
      return { payout: 110, message: choice(jokeWins.AGI) };
    }

    if (topLabel === "PROMPT") {
      return { payout: 75, message: choice(jokeWins.PROMPT) };
    }

    return {
      payout: 60,
      message: `Triple ${topLabel}. Strong result. The keynote will now contain the phrase "platform moat" 14 times.`
    };
  }

  if (topCount === 2) {
    return { payout: 30, message: choice(jokeWins.pair) };
  }

  return { payout: 0, message: choice(jokeWins.loss) };
}

function render() {
  tokenBalanceEl.textContent = String(state.balance);
  spinCostEl.textContent = String(state.spinCost);
  lastWinEl.textContent = String(state.lastWin);
  spinCountEl.textContent = String(state.spins);
  tokensBurnedEl.textContent = String(state.burned);
  bestWinEl.textContent = String(state.bestWin);

  const canSpin = state.balance >= state.spinCost && !state.spinning;
  const canBurn = state.balance >= 40 && !state.spinning;

  spinButton.disabled = !canSpin;
  cashOutButton.disabled = !canBurn;

  if (!canSpin && !state.spinning) {
    statusEl.textContent =
      "Insufficient tokens. Please acquire more hype, budget, or plausible deniability.";
  }
}

function animateSpin(finalResults) {
  return Promise.all(
    reelEls.map((reelEl, index) => {
      reelEl.classList.add("spinning");

      return new Promise((resolve) => {
        const timer = setInterval(() => {
          reelEl.textContent = symbols[Math.floor(Math.random() * symbols.length)].label;
        }, 90);

        setTimeout(() => {
          clearInterval(timer);
          reelEl.classList.remove("spinning");
          reelEl.textContent = finalResults[index];
          resolve();
        }, 700 + index * 280);
      });
    })
  );
}

async function spin() {
  if (state.spinning || state.balance < state.spinCost) {
    render();
    return;
  }

  state.spinning = true;
  state.balance -= state.spinCost;
  state.spins += 1;
  state.lastWin = 0;
  statusEl.textContent = "Allocating tokens to the probability engine...";
  render();

  const results = [weightedPick(), weightedPick(), weightedPick()];
  await animateSpin(results);

  const outcome = evaluate(results);
  state.balance += outcome.payout;
  state.lastWin = outcome.payout;
  state.bestWin = Math.max(state.bestWin, outcome.payout);

  if (state.spins % 4 === 0) {
    state.spinCost += 5;
    outcome.message += " Also, your usage tier has mysteriously become more expensive.";
  }

  statusEl.textContent = outcome.message;
  state.spinning = false;
  render();
}

function burnTokens() {
  if (state.spinning || state.balance < 40) {
    render();
    return;
  }

  state.balance -= 40;
  state.burned += 40;
  state.lastWin = 0;
  statusEl.textContent = choice(jokeWins.burn);
  render();
}

spinButton.addEventListener("click", spin);
cashOutButton.addEventListener("click", burnTokens);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    spin();
  }
});

render();
