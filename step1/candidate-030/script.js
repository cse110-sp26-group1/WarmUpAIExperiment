const symbols = [
  { icon: "GPU", weight: 2, payout: 80 },
  { icon: "TOK", weight: 4, payout: 45 },
  { icon: "404", weight: 5, payout: 15 },
  { icon: "LAG", weight: 4, payout: 12 },
  { icon: "BOT", weight: 3, payout: 25 },
  { icon: "VC", weight: 2, payout: 60 },
  { icon: "MEME", weight: 3, payout: 30 }
];

const defaultState = {
  tokens: 120,
  bestWin: 0,
  streak: 0,
  spinCost: 15
};

const storageKey = "token-bandit-state";

const balanceEl = document.getElementById("token-balance");
const bestWinEl = document.getElementById("best-win");
const spinCostEl = document.getElementById("spin-cost");
const statusMessageEl = document.getElementById("status-message");
const hypeFillEl = document.getElementById("hype-fill");
const streakCountEl = document.getElementById("streak-count");
const spinButton = document.getElementById("spin-button");
const cashoutButton = document.getElementById("cashout-button");
const feedListEl = document.getElementById("feed-list");
const feedItemTemplate = document.getElementById("feed-item-template");
const machineEl = document.querySelector(".machine");
const reels = Array.from(document.querySelectorAll(".reel"));

let state = loadState();
let spinning = false;
let audioContext;

render();
addFeed("Booted casino model. Safety filters are optional, billing is not.");

spinButton.addEventListener("click", handleSpin);
cashoutButton.addEventListener("click", resetRun);

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return { ...defaultState };
  }

  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function render() {
  balanceEl.textContent = state.tokens;
  bestWinEl.textContent = state.bestWin;
  spinCostEl.textContent = state.spinCost;
  streakCountEl.textContent = `${state.streak} streak`;
  hypeFillEl.style.width = `${Math.min(state.streak * 18, 100)}%`;
  spinButton.disabled = spinning || state.tokens < state.spinCost;
}

async function handleSpin() {
  if (spinning || state.tokens < state.spinCost) {
    statusMessageEl.textContent = "Insufficient tokens. The AI respectfully suggests more funding.";
    addFeed("Spin denied. Wallet empty, narrative still overconfident.");
    return;
  }

  spinning = true;
  machineEl.classList.remove("jackpot");
  state.tokens -= state.spinCost;
  render();
  statusMessageEl.textContent = "Generating strategic nonsense...";
  addFeed(`Spent ${state.spinCost} tokens to ask the machine for synergies.`);
  playTone(240, 0.05);
  vibrate([20, 40, 20]);

  const result = await spinReels();
  const evaluation = evaluateResult(result);

  state.tokens += evaluation.netWin;
  state.bestWin = Math.max(state.bestWin, evaluation.netWin);
  state.streak = evaluation.netWin > 0 ? state.streak + 1 : 0;
  state.spinCost = 15 + Math.min(state.streak * 2, 12);

  statusMessageEl.textContent = evaluation.message;
  addFeed(evaluation.feed);

  if (evaluation.isJackpot) {
    machineEl.classList.add("jackpot");
    playTone(640, 0.07);
    playTone(880, 0.1, 80);
    vibrate([40, 50, 60]);
  } else if (evaluation.netWin > 0) {
    playTone(420, 0.06);
  } else {
    playTone(160, 0.09);
  }

  saveState();
  spinning = false;
  render();
}

function spinReels() {
  const finalSymbols = reels.map(() => pickSymbol());
  const animations = reels.map((reel, index) => {
    reel.classList.add("spinning");
    return new Promise((resolve) => {
      let ticks = 0;
      const maxTicks = 10 + index * 4;
      const timer = window.setInterval(() => {
        reel.textContent = pickSymbol().icon;
        ticks += 1;
        if (ticks >= maxTicks) {
          window.clearInterval(timer);
          reel.textContent = finalSymbols[index].icon;
          reel.classList.remove("spinning");
          resolve();
        }
      }, 90);
    });
  });

  return Promise.all(animations).then(() => finalSymbols);
}

function evaluateResult(result) {
  const icons = result.map((entry) => entry.icon);
  const [first, second, third] = icons;
  const allMatch = first === second && second === third;
  const pairMatch = first === second || second === third || first === third;
  const includes404 = icons.includes("404");

  if (allMatch) {
    const win = result[0].payout + 70;
    return {
      netWin: win,
      isJackpot: true,
      message: `Jackpot. ${first} x3 triggered a GPU subsidy worth ${win} tokens.`,
      feed: `The model became profitable for six seconds. You gained ${win} tokens.`
    };
  }

  if (pairMatch) {
    const matched = mostCommonIcon(icons);
    const symbol = symbols.find((item) => item.icon === matched);
    const win = Math.round(symbol.payout * 0.75);
    const tax = 6;
    const net = Math.max(win - tax, 0);
    return {
      netWin: net,
      isJackpot: false,
      message: `Two ${matched}s matched. You earned ${win} tokens, then paid ${tax} for “premium inference.”`,
      feed: `Partial success. Gross ${win}, hidden fee ${tax}, net ${net}.`
    };
  }

  if (includes404) {
    return {
      netWin: 0,
      isJackpot: false,
      message: "The machine hallucinated a business model and kept your tokens.",
      feed: "404 appeared. Support claims this is an emergent feature."
    };
  }

  return {
    netWin: 4,
    isJackpot: false,
    message: "No clean match, but the AI sold your gameplay telemetry for 4 tokens.",
    feed: "Consolation payout issued from an unexplained data licensing program."
  };
}

function mostCommonIcon(icons) {
  const counts = new Map();
  for (const icon of icons) {
    counts.set(icon, (counts.get(icon) || 0) + 1);
  }

  let winner = icons[0];
  let max = 0;

  for (const [icon, count] of counts.entries()) {
    if (count > max) {
      winner = icon;
      max = count;
    }
  }

  return winner;
}

function pickSymbol() {
  const pool = symbols.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol));
  return pool[Math.floor(Math.random() * pool.length)];
}

function addFeed(message) {
  const item = feedItemTemplate.content.firstElementChild.cloneNode(true);
  const timestamp = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());

  item.textContent = `[${timestamp}] ${message}`;
  feedListEl.prepend(item);

  while (feedListEl.children.length > 5) {
    feedListEl.lastElementChild.remove();
  }
}

function resetRun() {
  state = { ...defaultState, bestWin: state.bestWin };
  saveState();
  render();
  statusMessageEl.textContent = "Wallet reset. The machine thanks you for your continued optimism.";
  addFeed("Cash-out requested. User recovered pride, not profits.");
  vibrate([15, 30, 15]);
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playTone(frequency, duration, delay = 0) {
  if (!("AudioContext" in window || "webkitAudioContext" in window)) {
    return;
  }

  const Context = window.AudioContext || window.webkitAudioContext;
  audioContext ??= new Context();

  const startAt = audioContext.currentTime + delay / 1000;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}
