const STORAGE_KEY = "token-gobbler-3000-state";
const DEFAULT_STATE = {
  tokens: 120,
  lifetimeWins: 0,
  bestWin: 0,
};

const SPIN_COST = 15;
const SYMBOLS = ["GPU", "TOKEN", "PROMPT", "HYPE", "SLIDE", "AGENT"];

const PAYOUTS = {
  GPU: 120,
  TOKEN: 90,
  PROMPT: 70,
  HYPE: 55,
  SLIDE: 45,
  AGENT: 40,
};

const roastLines = {
  GPU: "Triple GPU. Congratulations, you reinvented cloud burn with better branding.",
  TOKEN: "Triple TOKEN. You monetized vibes and called it a protocol.",
  PROMPT: "Triple PROMPT. A manager somewhere just said 'this changes everything.'",
  HYPE: "Triple HYPE. No product, all launch party. Somehow it worked.",
  SLIDE: "Triple SLIDE. Your deck now has more gradients than a foundation model.",
  AGENT: "Triple AGENT. You outsourced thinking and still missed the deadline.",
  pair: "A pair! Just enough alignment to raise another round off pure theater.",
  miss: "No match. You paid tokens to generate artisanal nonsense.",
  broke: "You are out of tokens. The board suggests pivoting to consultancy.",
  reset: "Empire reset. Fresh wallet, fresh delusions.",
};

const elements = {
  tokenBalance: document.getElementById("tokenBalance"),
  lifetimeWins: document.getElementById("lifetimeWins"),
  bestWin: document.getElementById("bestWin"),
  spinCost: document.getElementById("spinCost"),
  message: document.getElementById("message"),
  spinButton: document.getElementById("spinButton"),
  autoSpinButton: document.getElementById("autoSpinButton"),
  resetButton: document.getElementById("resetButton"),
  reels: [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3"),
  ],
};

let state = loadState();
let isSpinning = false;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_STATE };

    const parsed = JSON.parse(saved);
    return {
      tokens: Number.isFinite(parsed.tokens) ? parsed.tokens : DEFAULT_STATE.tokens,
      lifetimeWins: Number.isFinite(parsed.lifetimeWins) ? parsed.lifetimeWins : 0,
      bestWin: Number.isFinite(parsed.bestWin) ? parsed.bestWin : 0,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateUI() {
  elements.tokenBalance.textContent = String(state.tokens);
  elements.lifetimeWins.textContent = String(state.lifetimeWins);
  elements.bestWin.textContent = String(state.bestWin);
  elements.spinCost.textContent = String(SPIN_COST);
  elements.spinButton.textContent = `Spend ${SPIN_COST} Tokens`;

  const canSpin = state.tokens >= SPIN_COST && !isSpinning;
  elements.spinButton.disabled = !canSpin;
  elements.autoSpinButton.disabled = !canSpin;
}

function chooseSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function animateReel(reel, finalSymbol, delayMs) {
  reel.classList.add("spinning");

  const tickCount = 10 + Math.floor(Math.random() * 4);
  for (let index = 0; index < tickCount; index += 1) {
    reel.textContent = chooseSymbol();
    await delay(70 + index * 8);
  }

  await delay(delayMs);
  reel.textContent = finalSymbol;
  reel.classList.remove("spinning");
}

function evaluateSpin(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, topCount] = entries[0];

  if (topCount === 3) {
    const payout = PAYOUTS[topSymbol] || 35;
    return { payout, message: roastLines[topSymbol] };
  }

  if (topCount === 2) {
    return { payout: 25, message: roastLines.pair };
  }

  return { payout: 0, message: roastLines.miss };
}

function highlightResults(results) {
  const uniqueCount = new Set(results).size;

  elements.reels.forEach((reel) => reel.classList.remove("hit"));

  if (uniqueCount < 3) {
    const counts = results.reduce((map, symbol) => {
      map[symbol] = (map[symbol] || 0) + 1;
      return map;
    }, {});

    elements.reels.forEach((reel) => {
      if (counts[reel.textContent] > 1) {
        reel.classList.add("hit");
      }
    });
  }
}

function setMessage(text) {
  elements.message.textContent = text;
}

async function spinOnce() {
  if (isSpinning || state.tokens < SPIN_COST) {
    if (state.tokens < SPIN_COST) {
      setMessage(roastLines.broke);
    }
    return;
  }

  isSpinning = true;
  state.tokens -= SPIN_COST;
  updateUI();
  setMessage("Allocating compute budget to premium token extraction...");

  const results = [chooseSymbol(), chooseSymbol(), chooseSymbol()];
  elements.reels.forEach((reel) => reel.classList.remove("hit"));

  await Promise.all([
    animateReel(elements.reels[0], results[0], 0),
    animateReel(elements.reels[1], results[1], 120),
    animateReel(elements.reels[2], results[2], 220),
  ]);

  const outcome = evaluateSpin(results);
  highlightResults(results);

  state.tokens += outcome.payout;
  state.lifetimeWins += outcome.payout;
  state.bestWin = Math.max(state.bestWin, outcome.payout);
  saveState();

  const net = outcome.payout - SPIN_COST;
  const netText =
    net > 0
      ? ` Net: +${net} tokens.`
      : net === 0
        ? " Net: somehow break-even."
        : ` Net: ${net} tokens.`;

  setMessage(`${outcome.message}${netText}`);
  isSpinning = false;
  updateUI();

  if (state.tokens < SPIN_COST) {
    setMessage(`${elements.message.textContent} ${roastLines.broke}`);
  }
}

async function autoSpin() {
  if (isSpinning) return;

  for (let index = 0; index < 3; index += 1) {
    if (state.tokens < SPIN_COST) break;
    await spinOnce();
    await delay(280);
  }
}

function resetGame() {
  state = { ...DEFAULT_STATE };
  saveState();
  elements.reels.forEach((reel, index) => {
    reel.textContent = SYMBOLS[index];
    reel.classList.remove("hit", "spinning");
  });
  setMessage(roastLines.reset);
  isSpinning = false;
  updateUI();
}

elements.spinButton.addEventListener("click", spinOnce);
elements.autoSpinButton.addEventListener("click", autoSpin);
elements.resetButton.addEventListener("click", resetGame);

updateUI();
