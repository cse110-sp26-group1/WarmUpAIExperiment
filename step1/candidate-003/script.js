const STORAGE_KEY = "token-tugger-5000-save";

const symbols = [
  { label: "TOKEN", weight: 3, mood: "Greedy" },
  { label: "PROMPT", weight: 3, mood: "Verbose" },
  { label: "GPU", weight: 2, mood: "Overheated" },
  { label: "ERROR", weight: 1, mood: "Defensive" },
  { label: "404", weight: 2, mood: "Hallucinating" },
  { label: "HYPE", weight: 2, mood: "Funded" },
  { label: "BOT", weight: 2, mood: "Automated" },
];

const state = {
  tokens: 120,
  bet: 10,
  isSpinning: false,
  bestWallet: 120,
};

const tokenCount = document.querySelector("#token-count");
const lastPayout = document.querySelector("#last-payout");
const mood = document.querySelector("#ai-mood");
const bestWallet = document.querySelector("#best-wallet");
const resultMessage = document.querySelector("#result-message");
const betInput = document.querySelector("#bet-input");
const betDisplay = document.querySelector("#bet-display");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const reels = [...document.querySelectorAll(".reel")];

const weightedPool = symbols.flatMap((symbol) =>
  Array.from({ length: symbol.weight }, () => symbol)
);

const snark = {
  bankrupt: [
    "Your wallet is empty. Even the AI wants you to upgrade to the enterprise plan.",
    "No tokens left. The machine suggests writing a thinkpiece about efficiency instead.",
  ],
  lose: [
    "Nothing lined up. Classic AI move: lots of output, no value.",
    "The model consumed your tokens and returned 'it depends.'",
    "A premium spin with a freemium result. Beautifully on brand.",
  ],
  small: [
    "Two matched. The machine calls this 'meaningful progress.'",
    "Tiny payout unlocked. Somewhere an AI startup just wrote a case study about it.",
    "You won a modest refund, which in AI terms counts as radical transparency.",
  ],
  big: [
    "Jackpot. The machine finally over-delivered, which feels frankly suspicious.",
    "Three of a kind. Investor deck energy is surging through the building.",
    "Massive token haul. The AI would like credit for empowering your workflow.",
  ],
  error: [
    "Triple ERROR. The machine apologizes, blames the benchmark, and refunds your dignity.",
    "You hit ERROR-ERROR-ERROR. Congratulations, you've achieved peak platform authenticity.",
  ],
};

loadProgress();

betInput.addEventListener("input", () => {
  state.bet = Number(betInput.value);
  betDisplay.textContent = `${state.bet} tokens`;
  updateButtonState();
  saveProgress();
});

spinButton.addEventListener("click", async () => {
  if (state.isSpinning || state.tokens < state.bet) {
    return;
  }

  state.isSpinning = true;
  state.tokens -= state.bet;
  lastPayout.textContent = "0";
  clearHighlights();
  render();
  updateButtonState();
  resultMessage.textContent = "Streaming confidence... please ignore the smell of warm GPUs.";

  const results = await spinReels();
  const payout = calculatePayout(results, state.bet);

  state.tokens += payout.amount;
  state.bestWallet = Math.max(state.bestWallet, state.tokens);
  lastPayout.textContent = String(payout.amount);
  mood.textContent = payout.mood;
  resultMessage.textContent = payout.message;

  if (payout.amount > state.bet) {
    reels.forEach((reel) => reel.classList.add("win"));
  } else if (payout.matches >= 2) {
    reels
      .filter((_, index) => results[index] === payout.matchLabel)
      .forEach((reel) => reel.classList.add("win"));
  }

  if (state.tokens < state.bet) {
    resultMessage.textContent += ` ${pick(snark.bankrupt)}`;
  }

  state.isSpinning = false;
  saveProgress();
  render();
  updateButtonState();
});

resetButton.addEventListener("click", () => {
  state.tokens = 120;
  state.bet = 10;
  state.bestWallet = 120;
  state.isSpinning = false;
  betInput.value = "10";
  lastPayout.textContent = "0";
  mood.textContent = "Smug";
  resultMessage.textContent =
    "Economy reset. The machine has pivoted from disruption back to extraction.";
  reels[0].textContent = "PROMPT";
  reels[1].textContent = "TOKEN";
  reels[2].textContent = "404";
  clearHighlights();
  saveProgress();
  render();
  updateButtonState();
});

function render() {
  tokenCount.textContent = String(state.tokens);
  bestWallet.textContent = String(state.bestWallet);
  betDisplay.textContent = `${state.bet} tokens`;
}

function updateButtonState() {
  const canAfford = state.tokens >= state.bet;
  spinButton.disabled = state.isSpinning || !canAfford;
  spinButton.textContent = canAfford ? "Spin For Clout" : "Out Of Tokens";
}

function clearHighlights() {
  reels.forEach((reel) => reel.classList.remove("win"));
}

async function spinReels() {
  const results = [];

  for (const [index, reel] of reels.entries()) {
    reel.classList.add("spinning");

    await animateReel(reel, 550 + index * 220);

    const symbol = pick(weightedPool);
    reel.textContent = symbol.label;
    reel.dataset.label = symbol.label;
    results.push(symbol.label);
    reel.classList.remove("spinning");
  }

  return results;
}

function animateReel(reel, duration) {
  return new Promise((resolve) => {
    const started = performance.now();

    function frame(now) {
      const elapsed = now - started;
      reel.textContent = pick(weightedPool).label;

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function calculatePayout(results, bet) {
  const counts = results.reduce((map, label) => {
    map[label] = (map[label] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [matchLabel, matches] = entries[0];

  if (matches === 3 && matchLabel === "ERROR") {
    return {
      amount: bet,
      matches,
      matchLabel,
      mood: "Apologetic",
      message: pick(snark.error),
    };
  }

  if (matches === 3) {
    const multipliers = {
      TOKEN: 6,
      PROMPT: 5,
      GPU: 4,
    };

    const multiplier = multipliers[matchLabel] || 3;

    return {
      amount: bet * multiplier,
      matches,
      matchLabel,
      mood: lookupMood(matchLabel),
      message: pick(snark.big),
    };
  }

  if (matches === 2) {
    return {
      amount: bet * 2,
      matches,
      matchLabel,
      mood: lookupMood(matchLabel),
      message: pick(snark.small),
    };
  }

  return {
    amount: 0,
    matches: 0,
    matchLabel: "",
    mood: lookupMood(results[2]),
    message: pick(snark.lose),
  };
}

function lookupMood(label) {
  return symbols.find((symbol) => symbol.label === label)?.mood ?? "Smug";
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return;
    }

    const saved = JSON.parse(raw);
    state.tokens = sanitizeNumber(saved.tokens, 120);
    state.bet = sanitizeNumber(saved.bet, 10);
    state.bestWallet = sanitizeNumber(saved.bestWallet, state.tokens);
    betInput.value = String(state.bet);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveProgress() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      tokens: state.tokens,
      bet: state.bet,
      bestWallet: state.bestWallet,
    })
  );
}

function sanitizeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

render();
updateButtonState();
