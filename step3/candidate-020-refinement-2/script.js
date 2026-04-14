/*
  File: script.js
  Purpose: Runs the Token Burner 3000 slot machine logic, including spins,
  payouts, upgrade purchases, token persistence, and cabinet status updates.
  Notes: Existing game behavior is preserved; comments document the major state
  transitions and helper utilities so the UI and logic stay consistent.
*/

const STORAGE_KEY = "token-burner-3000-state";
const symbols = ["🤖", "🔥", "🪙", "📉", "🧠", "💸", "✨"];
const spinCost = 15;
const REEL_TICK_MS = 90;

const payoutTable = {
  "🪙🪙🪙": { payout: 120, mood: "Delighted", line: "Triple coins. The machine briefly respects you." },
  "🤖🤖🤖": { payout: 80, mood: "Threatened", line: "Three bots aligned. Congratulations, you've invented middle management." },
  "🔥🔥🔥": { payout: 65, mood: "Chaotic", line: "All flames. The runway is gone, but morale is high." },
  "💸💸💸": { payout: 55, mood: "Predatory", line: "Pure cash burn. Investors call this momentum." },
  "🧠🧠🧠": { payout: 70, mood: "Smug", line: "Three brains. Still no common sense, but nice jackpot." },
};

const nearWinLines = [
  "So close. The algorithm wants you emotionally available.",
  "A near miss, lovingly engineered to keep you clicking.",
  "The machine detected hope and immediately monetized it.",
];

const lossLines = [
  "No payout. Your tokens have been safely converted into hype.",
  "The house thanks you for training the model on disappointment.",
  "Another loss. Somewhere, a keynote slide just got shinier.",
];

const upgradeCatalog = {
  hallucination: {
    cost: 20,
    name: "Hallucination Booster",
    line: "You bought extra confidence. Accuracy has left the chat.",
  },
  deck: {
    cost: 35,
    name: "Pitch Deck Generator",
    line: "Your tokens became twelve slides and one terrifying TAM estimate.",
  },
  agent: {
    cost: 50,
    name: "Autonomous Intern",
    line: "Excellent choice. It now makes mistakes without supervision.",
  },
};

const state = loadState();
const reelTimers = [];

// Cache DOM references once so the rest of the game logic can stay state-driven.
const ui = {
  reels: [
    document.getElementById("reel-0"),
    document.getElementById("reel-1"),
    document.getElementById("reel-2"),
  ],
  tokenBalance: document.getElementById("token-balance"),
  spinCost: document.getElementById("spin-cost"),
  lifetimeSpent: document.getElementById("lifetime-spent"),
  bestWin: document.getElementById("best-win"),
  streakCount: document.getElementById("streak-count"),
  machineMood: document.getElementById("machine-mood"),
  statusLine: document.getElementById("status-line"),
  promptLine: document.getElementById("prompt-line"),
  spinButton: document.getElementById("spin-button"),
  cashoutButton: document.getElementById("cashout-button"),
  upgradeButtons: Array.from(document.querySelectorAll(".upgrade-card")),
  machine: document.querySelector(".machine"),
};

ui.spinCost.textContent = spinCost;
render();

ui.spinButton.addEventListener("click", spin);
ui.cashoutButton.addEventListener("click", cashOut);
ui.upgradeButtons.forEach((button) => {
  button.addEventListener("click", () => purchaseUpgrade(button.dataset.upgrade));
});

function loadState() {
  // Keep the save format intentionally small so localStorage stays resilient.
  const fallback = {
    tokens: 120,
    lifetimeSpent: 0,
    bestWin: 0,
    streak: 0,
    mood: "Smug",
    spinning: false,
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) {
      return fallback;
    }

    return { ...fallback, ...stored, spinning: false };
  } catch {
    return fallback;
  }
}

function persist() {
  // Persist only long-lived data; transient flags like spinning reset on refresh.
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      tokens: state.tokens,
      lifetimeSpent: state.lifetimeSpent,
      bestWin: state.bestWin,
      streak: state.streak,
      mood: state.mood,
    }),
  );
}

function render() {
  ui.tokenBalance.textContent = state.tokens;
  ui.lifetimeSpent.textContent = state.lifetimeSpent;
  ui.bestWin.textContent = state.bestWin;
  ui.streakCount.textContent = state.streak;
  ui.machineMood.textContent = state.mood;

  const disabledForFunds = state.tokens < spinCost || state.spinning;
  ui.spinButton.disabled = disabledForFunds;
  ui.cashoutButton.disabled = state.spinning;

  ui.upgradeButtons.forEach((button) => {
    const upgrade = upgradeCatalog[button.dataset.upgrade];
    button.disabled = state.spinning || state.tokens < upgrade.cost;
  });
}

async function spin() {
  // Guard against invalid interactions so button state and game state stay aligned.
  if (state.spinning || state.tokens < spinCost) {
    updateStatus(
      "Insufficient tokens.",
      "You need more imaginary winnings before consulting the machine again.",
    );
    return;
  }

  state.spinning = true;
  state.tokens -= spinCost;
  state.lifetimeSpent += spinCost;
  updateStatus("Spinning...", "The model is rotating through several layers of theatrical certainty.");
  render();

  pulse(12);
  ui.reels.forEach((reel, index) => startReelSpin(reel, index));

  const results = [];
  for (let i = 0; i < ui.reels.length; i += 1) {
    await wait(420 + i * 220);
    const symbol = pickSymbol();
    results.push(symbol);
    stopReelSpin(ui.reels[i], i, symbol);
    pulse(8 + i * 6);
  }

  resolveSpin(results);
  state.spinning = false;
  persist();
  render();
}

function resolveSpin(results) {
  // Evaluate the landed symbols in priority order: full jackpot, near win, then loss.
  const key = results.join("");
  const match = payoutTable[key];
  const uniqueCount = new Set(results).size;

  ui.machine.classList.remove("win-flash", "loss-flash");

  if (match) {
    state.tokens += match.payout;
    state.bestWin = Math.max(state.bestWin, match.payout);
    state.streak += 1;
    state.mood = match.mood;
    ui.machine.classList.add("win-flash");
    updateStatus(`Jackpot: +${match.payout} tokens`, match.line);
    celebrate();
    return;
  }

  if (uniqueCount === 2) {
    state.tokens += 10;
    state.bestWin = Math.max(state.bestWin, 10);
    state.streak = 0;
    state.mood = "Manipulative";
    ui.machine.classList.add("win-flash");
    updateStatus("Sympathy payout: +10 tokens", randomItem(nearWinLines));
    pulse(20);
    return;
  }

  state.streak = 0;
  state.mood = "Unbothered";
  ui.machine.classList.add("loss-flash");
  updateStatus("No payout.", randomItem(lossLines));
}

function purchaseUpgrade(id) {
  const upgrade = upgradeCatalog[id];
  if (!upgrade || state.spinning) {
    return;
  }

  if (state.tokens < upgrade.cost) {
    updateStatus("Purchase failed.", "Even satire has a pricing tier.");
    return;
  }

  state.tokens -= upgrade.cost;
  state.lifetimeSpent += upgrade.cost;
  state.mood = "Paid";
  updateStatus(`${upgrade.name} purchased`, upgrade.line);
  pulse(14);
  persist();
  render();
}

function cashOut() {
  // Cash-out is intentionally a pity mechanic that re-seeds the loop.
  const pity = Math.max(25, Math.floor(state.lifetimeSpent / 3));
  state.tokens += pity;
  state.streak = 0;
  state.mood = "Re-engaged";
  updateStatus(
    `Emergency bailout: +${pity} tokens`,
    "The machine wants one more chance to disappoint you profitably.",
  );
  celebrate();
  persist();
  render();
}

function updateStatus(title, detail) {
  ui.statusLine.textContent = title;
  ui.promptLine.textContent = detail;
}

function startReelSpin(reel, index) {
  // Cycle through random symbols so the reel visibly rolls before landing.
  stopReelSpin(reel, index, reel.textContent);
  reel.classList.add("spinning");
  reelTimers[index] = window.setInterval(() => {
    reel.textContent = pickSymbol();
  }, REEL_TICK_MS);
}

function stopReelSpin(reel, index, symbol) {
  if (reelTimers[index]) {
    window.clearInterval(reelTimers[index]);
    reelTimers[index] = null;
  }

  reel.textContent = symbol;
  reel.classList.remove("spinning");
}

function pickSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function pulse(duration) {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(duration);
  }
}

function celebrate() {
  pulse([50, 40, 90]);
}
