const symbols = ["🤖", "💸", "🔥", "🧠", "👀", "🪙"];
const spinCost = 15;
const startingTokens = 120;

const reels = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];

const tokensEl = document.getElementById("tokens");
const costEl = document.getElementById("cost");
const bestWinEl = document.getElementById("best-win");
const messageEl = document.getElementById("message");
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");

let tokens = startingTokens;
let bestWin = 0;
let spinning = false;

costEl.textContent = spinCost;

const sarcasticMisses = [
  "The reels generated a confident answer with zero grounding.",
  "You bought premium uncertainty. The machine thanks you.",
  "Another spin, another visionary burn rate.",
  "The model improvised. Your wallet handled the consequences.",
  "Impressive. You converted tokens into vibes at scale.",
];

const pairMessages = [
  "Two matching reels. Finally, a pilot program with traction.",
  "A pair hit. The board approves another quarter of hype.",
  "Close enough for a keynote demo. Enjoy the rebate.",
];

const tripleMessages = {
  "🤖": "Triple bots. Congratulations, you monetized autocomplete.",
  "💸": "Triple cash. A venture capitalist just called this defensible.",
  "🔥": "Triple fire. The demo is hot, the margins are not.",
  "🧠": "Triple brains. Benchmark charts deployed directly into your bloodstream.",
  "👀": "Triple eyes. The timeline thinks your toaster achieved AGI.",
  "🪙": "Triple coins. The token economy consumed itself and paid you anyway.",
};

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function updateDisplay() {
  tokensEl.textContent = tokens;
  bestWinEl.textContent = bestWin;
  spinButton.disabled = spinning || tokens < spinCost;
  spinButton.textContent = tokens < spinCost ? "Out of Tokens" : `Spend ${spinCost} Tokens`;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function payoutFor(result) {
  const [a, b, c] = result;

  if (a === b && b === c) {
    const rewards = {
      "🤖": 120,
      "💸": 90,
      "🔥": 75,
      "🧠": 65,
      "👀": 55,
      "🪙": 45,
    };

    return {
      amount: rewards[a] || 40,
      message: tripleMessages[a] || "Three of a kind. Capitalism applauds."
    };
  }

  if (a === b || a === c || b === c) {
    return {
      amount: 20,
      message: sample(pairMessages),
    };
  }

  return {
    amount: 0,
    message: sample(sarcasticMisses),
  };
}

function randomSymbol() {
  return sample(symbols);
}

function animateReel(reel, duration) {
  return new Promise((resolve) => {
    reel.classList.add("spinning");

    const intervalId = window.setInterval(() => {
      reel.textContent = randomSymbol();
    }, 90);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      reel.classList.remove("spinning");
      resolve();
    }, duration);
  });
}

async function spin() {
  if (spinning || tokens < spinCost) {
    if (tokens < spinCost) {
      setMessage("Wallet empty. Even satire has a token floor. Hit reboot.");
    }
    return;
  }

  spinning = true;
  tokens -= spinCost;
  updateDisplay();
  setMessage("Submitting tokens to the machine learning furnace...");

  const result = [];

  for (let index = 0; index < reels.length; index += 1) {
    const reel = reels[index];
    await animateReel(reel, 700 + (index * 220));
    const symbol = randomSymbol();
    reel.textContent = symbol;
    result.push(symbol);
  }

  const payout = payoutFor(result);
  tokens += payout.amount;
  bestWin = Math.max(bestWin, payout.amount);
  spinning = false;

  const summary = payout.amount > 0
    ? `${payout.message} You won ${payout.amount} tokens.`
    : `${payout.message} No payout this round.`;

  setMessage(summary);
  updateDisplay();
}

function resetGame() {
  tokens = startingTokens;
  bestWin = 0;
  spinning = false;
  reels.forEach((reel, index) => {
    reel.classList.remove("spinning");
    reel.textContent = symbols[index];
  });
  setMessage("System reboot complete. Fresh tokens loaded for irresponsible innovation.");
  updateDisplay();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

updateDisplay();
