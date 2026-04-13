const STORAGE_KEY = "token-burner-3000-state";
const SPIN_COST = 15;
const STARTING_TOKENS = 240;

const symbols = [
  {
    id: "prompt",
    icon: "🌀",
    name: "Prompt Spiral",
    weight: 22,
  },
  {
    id: "refund",
    icon: "🪙",
    name: "Token Refund",
    weight: 16,
  },
  {
    id: "buzz",
    icon: "📈",
    name: "VC Buzzword",
    weight: 20,
  },
  {
    id: "meltdown",
    icon: "🔥",
    name: "GPU Meltdown",
    weight: 18,
  },
  {
    id: "agent",
    icon: "🕴️",
    name: "Agent Swarm",
    weight: 16,
  },
  {
    id: "agi",
    icon: "👁️",
    name: "AGI Soon™",
    weight: 8,
  },
];

const roastLines = {
  prompt: "Three Prompt Spirals. Incredible. The machine has reinvented saying the same thing louder.",
  refund: "Token Refund jackpot. At last, a tiny rebate from the Great Compute Furnace.",
  buzz: "Triple VC Buzzword. Congratulations, you've raised money with no product again.",
  meltdown: "Three GPU Meltdowns. The datacenter glows, but at least your wallet does too.",
  agent: "Agent Swarm x3. Nobody knows who's in charge, which means it's a perfect AI startup.",
  agi: "AGI Soon™ lands across the board. The machine promises salvation in the next quarter. Maybe.",
  twoRefunds: "Two Token Refunds. Finance calls this 'a meaningful recovery.'",
  agiSingle: "An AGI Soon™ cameo. The machine rewards faith almost as much as hype.",
  loss: "No payout. The machine spent your tokens summarizing its own roadmap.",
  broke: "Wallet empty. The machine recommends new investors and a less ambitious model size.",
};

const state = loadState();
let isSpinning = false;

const tokenBalance = document.querySelector("#tokenBalance");
const spinCount = document.querySelector("#spinCount");
const bestWin = document.querySelector("#bestWin");
const resultMessage = document.querySelector("#resultMessage");
const spinButton = document.querySelector("#spinButton");
const resetButton = document.querySelector("#resetButton");
const feed = document.querySelector("#feed");
const reels = [...document.querySelectorAll(".reel")];

renderAll();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetState);

function loadState() {
  const fallback = {
    tokens: STARTING_TOKENS,
    spins: 0,
    bestWin: 0,
    feed: ["Fresh wallet detected. The machine smells optimism."],
    lastSymbols: symbols.slice(0, 3),
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      feed: Array.isArray(parsed.feed) ? parsed.feed.slice(0, 5) : fallback.feed,
    };
  } catch {
    return fallback;
  }
}

function persistState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderAll() {
  tokenBalance.textContent = `${state.tokens}`;
  spinCount.textContent = `${state.spins}`;
  bestWin.textContent = `${state.bestWin}`;
  renderFeed();

  const visibleSymbols = state.lastSymbols || symbols.slice(0, 3);
  visibleSymbols.forEach((symbol, index) => renderSymbol(index, symbol));

  spinButton.disabled = isSpinning || state.tokens < SPIN_COST;
  if (!isSpinning && state.tokens < SPIN_COST) {
    resultMessage.textContent = roastLines.broke;
  }
}

function renderSymbol(index, symbol) {
  const reel = reels[index];
  reel.querySelector(".symbol-icon").textContent = symbol.icon;
  reel.querySelector(".symbol-name").textContent = symbol.name;
}

function renderFeed() {
  feed.innerHTML = "";
  state.feed.forEach((line) => {
    const entry = document.createElement("p");
    entry.textContent = line;
    feed.append(entry);
  });
}

async function spin() {
  if (isSpinning) return;
  if (state.tokens < SPIN_COST) {
    resultMessage.textContent = roastLines.broke;
    addFeed(roastLines.broke);
    maybeVibrate([100, 50, 100]);
    return;
  }

  isSpinning = true;
  state.tokens -= SPIN_COST;
  state.spins += 1;
  resultMessage.textContent = "The reels are consulting the latent space...";
  spinButton.disabled = true;
  reels.forEach((reel) => reel.classList.add("spinning"));
  renderAll();
  playSpinTone();

  const results = [];
  for (let i = 0; i < reels.length; i += 1) {
    await delay(280 + i * 220);
    const symbol = getRandomSymbol();
    results.push(symbol);
    renderSymbol(i, symbol);
    playStopTone(320 + i * 80);
  }

  reels.forEach((reel) => reel.classList.remove("spinning", "winner"));
  state.lastSymbols = results;

  const outcome = scoreResults(results);
  state.tokens += outcome.payout;
  state.bestWin = Math.max(state.bestWin, outcome.payout);
  resultMessage.textContent = outcome.message;

  if (outcome.winningIndexes.length) {
    outcome.winningIndexes.forEach((index) => reels[index].classList.add("winner"));
    maybeVibrate([120, 40, 120, 40, 200]);
    playWinTone(outcome.payout);
  } else {
    maybeVibrate(80);
  }

  addFeed(`Spin ${state.spins}: ${outcome.feedLine}`);
  persistState();
  isSpinning = false;
  renderAll();
}

function scoreResults(results) {
  const ids = results.map((symbol) => symbol.id);
  const counts = ids.reduce((map, id) => {
    map[id] = (map[id] || 0) + 1;
    return map;
  }, {});

  const allMatch = ids.every((id) => id === ids[0]);
  if (allMatch) {
    const payout = ids[0] === "agi" ? 250 : ids[0] === "refund" ? 120 : 80;
    return {
      payout,
      message: `${roastLines[ids[0]]} +${payout} tokens.`,
      feedLine: `${results.map((symbol) => symbol.name).join(" / ")} -> +${payout} tokens`,
      winningIndexes: [0, 1, 2],
    };
  }

  if ((counts.refund || 0) >= 2) {
    return {
      payout: 35,
      message: `${roastLines.twoRefunds} +35 tokens.`,
      feedLine: "Two Token Refunds prevented immediate financial comedy -> +35 tokens",
      winningIndexes: indexesForId(ids, "refund"),
    };
  }

  if ((counts.agi || 0) >= 1) {
    return {
      payout: 20,
      message: `${roastLines.agiSingle} +20 tokens.`,
      feedLine: "AGI Soon™ appeared and the valuation briefly doubled -> +20 tokens",
      winningIndexes: indexesForId(ids, "agi"),
    };
  }

  return {
    payout: 0,
    message: roastLines.loss,
    feedLine: `${results.map((symbol) => symbol.name).join(" / ")} -> 0 tokens`,
    winningIndexes: [],
  };
}

function indexesForId(ids, id) {
  return ids.flatMap((value, index) => (value === id ? [index] : []));
}

function addFeed(message) {
  state.feed = [message, ...state.feed].slice(0, 5);
}

function resetState() {
  isSpinning = false;
  state.tokens = STARTING_TOKENS;
  state.spins = 0;
  state.bestWin = 0;
  state.feed = ["Wallet reset. The machine respectfully forgets your previous mistakes."];
  state.lastSymbols = symbols.slice(0, 3);
  resultMessage.textContent = "Fresh tokens loaded. Time to finance more artificial confidence.";
  reels.forEach((reel) => reel.classList.remove("winner", "spinning"));
  persistState();
  renderAll();
}

function getRandomSymbol() {
  const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const symbol of symbols) {
    roll -= symbol.weight;
    if (roll <= 0) {
      return symbol;
    }
  }

  return symbols[symbols.length - 1];
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

let audioContext;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

function playTone(frequency, duration, type = "sine", gainValue = 0.03) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.stop(ctx.currentTime + duration);
}

function playSpinTone() {
  playTone(220, 0.18, "triangle", 0.035);
}

function playStopTone(frequency) {
  playTone(frequency, 0.12, "square", 0.025);
}

function playWinTone(payout) {
  const tone = payout >= 100 ? 760 : 560;
  playTone(tone, 0.15, "triangle", 0.04);
  window.setTimeout(() => playTone(tone * 1.25, 0.2, "triangle", 0.035), 120);
  window.setTimeout(() => playTone(tone * 1.5, 0.25, "triangle", 0.03), 260);
}

function maybeVibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
