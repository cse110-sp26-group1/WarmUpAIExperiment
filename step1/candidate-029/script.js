const symbols = ["🪙", "🤖", "🔥", "📉", "🧠", "💸"];
const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2"),
];

const tokenBalance = document.getElementById("tokenBalance");
const spinCostEl = document.getElementById("spinCost");
const burnedTotalEl = document.getElementById("burnedTotal");
const spinButton = document.getElementById("spinButton");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const aiCommentary = document.getElementById("aiCommentary");
const storageKey = "token-laundromat-save";

const gameState = {
  balance: 120,
  spinCost: 15,
  burned: 0,
  spinning: false,
};

function loadState() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }

    const parsed = JSON.parse(saved);
    if (typeof parsed.balance === "number" && typeof parsed.burned === "number") {
      gameState.balance = Math.max(0, parsed.balance);
      gameState.burned = Math.max(0, parsed.burned);
    }
  } catch {
    // Ignore malformed storage and keep defaults.
  }
}

function saveState() {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      balance: gameState.balance,
      burned: gameState.burned,
    })
  );
}

const commentary = {
  jackpot: [
    "Outstanding. The machine has validated your business model for almost six seconds.",
    "Three of a kind. Please update your pitch deck to say the market has spoken.",
    "A statistically suspicious win. The AI insists this was organic demand.",
  ],
  pair: [
    "A modest payout. Enough tokens to schedule another avoidable inference request.",
    "Two matched. Congratulations on achieving pre-seed profitability.",
    "The machine calls this traction. Accounting calls it noise.",
  ],
  special: [
    "Double robots and a brain. The app now believes it deserves stock options.",
    "You assembled artificial genius. It immediately asked for more GPU time.",
  ],
  bust: [
    "No match. Your tokens have been safely converted into executive summaries.",
    "A loss. Somewhere an AI copilot just suggested this was user error.",
    "Nothing hit. The machine is calling it a strategic data donation.",
  ],
  meltdown: [
    "Server bill combo. The machine charged a realism fee.",
    "That spin recreated an AI startup's third quarter in under a second.",
  ],
  broke: [
    "Wallet empty. Even the AI has stopped pretending this is sustainable.",
    "No tokens left. Time to pivot into consulting or astrology.",
  ],
};

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function setDisplay() {
  tokenBalance.textContent = gameState.balance;
  spinCostEl.textContent = gameState.spinCost;
  burnedTotalEl.textContent = gameState.burned;

  const canSpin = !gameState.spinning && gameState.balance >= gameState.spinCost;
  spinButton.disabled = !canSpin;
  spinButton.textContent = canSpin
    ? `Burn ${gameState.spinCost} Tokens`
    : "Out of Tokens";
}

function pickLine(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function evaluateSpin(results) {
  const [a, b, c] = results;
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});
  const highestMatch = Math.max(...Object.values(counts));

  if (a === "🤖" && b === "🤖" && c === "🧠") {
    return {
      delta: 140,
      title: "Synthetic Synergy",
      description: "The robots found a brain and immediately monetized your optimism.",
      comment: pickLine(commentary.special),
    };
  }

  if (a === "🔥" && b === "💸" && c === "📉") {
    return {
      delta: -10,
      title: "Quarterly Earnings Call",
      description: "An extra fee has been applied for enterprise-grade disappointment.",
      comment: pickLine(commentary.meltdown),
    };
  }

  if (highestMatch === 3) {
    return {
      delta: 90,
      title: "Jackpot Adjacent",
      description: `Three ${a} symbols. You have been promoted to Chief Token Officer.`,
      comment: pickLine(commentary.jackpot),
    };
  }

  if (highestMatch === 2) {
    return {
      delta: 30,
      title: "Minor Hallucinated Success",
      description: "A matched pair means the machine is willing to gaslight reality in your favor.",
      comment: pickLine(commentary.pair),
    };
  }

  return {
    delta: 0,
    title: "Model Said No",
    description: "The reels produced absolutely no alignment between ambition and outcome.",
    comment: pickLine(commentary.bust),
  };
}

function updateNarration(outcome) {
  resultTitle.textContent = outcome.title;
  resultText.textContent =
    `${outcome.description} Net change: ${outcome.delta >= 0 ? "+" : ""}${outcome.delta} tokens.`;
  aiCommentary.textContent = outcome.comment;
}

function finishSpin(results) {
  reels.forEach((reel, index) => {
    reel.classList.remove("spinning");
    reel.textContent = results[index];
  });

  const outcome = evaluateSpin(results);
  gameState.balance += outcome.delta;

  if (gameState.balance < 0) {
    gameState.balance = 0;
  }

  updateNarration(outcome);
  saveState();

  if (gameState.balance < gameState.spinCost) {
    aiCommentary.textContent = pickLine(commentary.broke);
  }

  gameState.spinning = false;
  setDisplay();
}

function animateSpin() {
  gameState.spinning = true;
  gameState.balance -= gameState.spinCost;
  gameState.burned += gameState.spinCost;
  setDisplay();
  saveState();

  reels.forEach((reel) => reel.classList.add("spinning"));
  resultTitle.textContent = "Spinning Up Hype";
  resultText.textContent =
    "Allocating tokens into the innovation furnace. Please wait while the machine reinvents waste.";
  aiCommentary.textContent =
    "The AI is preparing a very expensive guess dressed up as destiny.";

  const results = reels.map(() => randomSymbol());

  reels.forEach((reel, index) => {
    window.setTimeout(() => {
      reel.textContent = randomSymbol();
    }, 180 + index * 180);
  });

  window.setTimeout(() => finishSpin(results), 1200);
}

spinButton.addEventListener("click", () => {
  if (!gameState.spinning && gameState.balance >= gameState.spinCost) {
    animateSpin();
  }
});

loadState();
setDisplay();
