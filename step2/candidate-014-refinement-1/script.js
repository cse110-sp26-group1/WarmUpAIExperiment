// Each symbol teases a different flavor of AI nonsense.
const symbols = [
  { emoji: "🧠", label: "Hallucination" },
  { emoji: "🔥", label: "GPU Fan" },
  { emoji: "📎", label: "Prompt Loop" },
  { emoji: "🪙", label: "Token Refund" },
  { emoji: "📦", label: "Jackpot.json" },
  { emoji: "🤖", label: "Alignment Tax" }
];

const spinCost = 15;
const startingBalance = 120;
const reelHeight = () => document.querySelector(".reel-frame").clientHeight;
const reelWindows = [
  document.getElementById("reelWindow1"),
  document.getElementById("reelWindow2"),
  document.getElementById("reelWindow3")
];

const tokenBalanceEl = document.getElementById("tokenBalance");
const lastPayoutEl = document.getElementById("lastPayout");
const messageEl = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");

let balance = startingBalance;
let isSpinning = false;

// Build one tall strip per reel so we can animate it like a real rolling cylinder.
function createReelStrip(finalSymbolIndex) {
  const strip = document.createElement("div");
  strip.className = "reel-strip";

  // Repeat random filler symbols to create the illusion of continuous motion.
  for (let i = 0; i < 16; i += 1) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    strip.appendChild(createSymbolCell(symbol));
  }

  // Finish on the winning or losing symbol we actually want to show.
  strip.appendChild(createSymbolCell(symbols[finalSymbolIndex]));
  return strip;
}

function createSymbolCell(symbol) {
  const cell = document.createElement("div");
  cell.className = "symbol";
  cell.innerHTML = `
    <span class="symbol-emoji" aria-hidden="true">${symbol.emoji}</span>
    <span class="symbol-label">${symbol.label}</span>
  `;
  return cell;
}

function setMessage(text, tone = "") {
  messageEl.textContent = text;
  messageEl.className = `message ${tone}`.trim();
}

function updateStats(lastPayout = 0) {
  tokenBalanceEl.textContent = String(balance);
  lastPayoutEl.textContent = String(lastPayout);
}

function pickResults() {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * symbols.length));
}

function calculatePayout(results) {
  const counts = results.reduce((map, value) => {
    map[value] = (map[value] || 0) + 1;
    return map;
  }, {});

  const matchedCount = Math.max(...Object.values(counts));
  const first = results[0];

  if (matchedCount === 3 && symbols[first].label === "Jackpot.json") {
    return 140;
  }

  if (matchedCount === 3 && symbols[first].label === "Hallucination") {
    return 65;
  }

  if (matchedCount === 3 && symbols[first].label === "GPU Fan") {
    return 45;
  }

  if (matchedCount >= 2) {
    return 20;
  }

  return 0;
}

function describeOutcome(payout, results) {
  if (payout >= 140) {
    return 'Miracle. The AI returned "exactly what you asked for."';
  }

  if (payout >= 65) {
    return "Triple Hallucination. Confidently wrong, financially right.";
  }

  if (payout >= 45) {
    return "The GPUs are screaming, but at least they paid out.";
  }

  if (payout > 0) {
    return `Two reels matched. The model calls that "close enough."`;
  }

  return `No match: ${results.map((index) => symbols[index].label).join(", ")}. Classic AI benchmark behavior.`;
}

function animateReel(reelWindow, finalSymbolIndex, delayMs) {
  return new Promise((resolve) => {
    const strip = createReelStrip(finalSymbolIndex);
    reelWindow.replaceChildren(strip);

    const itemHeight = reelHeight();
    const fillerCount = strip.children.length - 1;
    const finalOffset = -(fillerCount * itemHeight);

    // Start above the visible frame so the first animation frame already feels in motion.
    strip.style.transform = "translateY(0)";

    requestAnimationFrame(() => {
      strip.style.transition = `transform ${1300 + delayMs}ms cubic-bezier(0.16, 0.84, 0.22, 1)`;
      strip.style.transform = `translateY(${finalOffset}px)`;
    });

    window.setTimeout(() => {
      // Replace the tall animated strip with one static cell after the motion settles.
      reelWindow.replaceChildren(createReelStrip(finalSymbolIndex).lastElementChild);
      resolve();
    }, 1400 + delayMs);
  });
}

async function spin() {
  if (isSpinning) {
    return;
  }

  if (balance < spinCost) {
    setMessage("You are out of tokens. Even the AI says to reset your wallet.", "empty");
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  balance -= spinCost;
  updateStats(0);
  setMessage("Feeding 15 fresh tokens into the machine...", "");

  const results = pickResults();
  await Promise.all(
    reelWindows.map((reelWindow, index) => animateReel(reelWindow, results[index], index * 180))
  );

  const payout = calculatePayout(results);
  balance += payout;
  updateStats(payout);

  if (payout > 0) {
    setMessage(describeOutcome(payout, results), "win");
  } else {
    setMessage(describeOutcome(payout, results), "lose");
  }

  spinButton.disabled = false;
  isSpinning = false;
}

function resetGame() {
  balance = startingBalance;
  updateStats(0);
  setMessage("Wallet restored. Ready to waste tokens with renewed optimism.", "");
  reelWindows.forEach((reelWindow, index) => {
    reelWindow.replaceChildren(createSymbolCell(symbols[index]));
  });
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

// Populate the machine with a clean initial state on page load.
resetGame();
