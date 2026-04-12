const SYMBOLS = [
  "token",
  "gpu",
  "hype",
  "glitch",
  "prompt",
  "beta",
  "vc",
  "404",
];

const STARTING_TOKENS = 40;
const SPIN_COST = 3;
const BAILOUT_AMOUNT = 12;
const STORAGE_KEY = "token-burner-9000-state";
const VISIBLE_ROWS = 3;
const CELL_HEIGHT = 64;
const REEL_GAP = 12;
const STEP_SIZE = CELL_HEIGHT + REEL_GAP;

const PAYTABLE = [
  {
    label: "TOKEN TOKEN TOKEN",
    reward: 24,
    note: "Pure token recursion. The machine loves a closed loop.",
  },
  {
    label: "GPU VC HYPE",
    reward: 18,
    note: "A funding round so loud it almost sounds like revenue.",
  },
  {
    label: "Any triple match",
    reward: 15,
    note: "Three matching buzzwords are apparently innovation now.",
  },
  {
    label: "Two matching symbols",
    reward: 6,
    note: "Strong enough for a keynote, weak for actual delivery.",
  },
];

const MACHINE_MOODS = [
  { threshold: 90, label: "Unbearably Visionary" },
  { threshold: 55, label: "Overconfident" },
  { threshold: 25, label: "Smug" },
  { threshold: 10, label: "Pitching Through It" },
  { threshold: 0, label: "Pivoting" },
];

const RESULT_LINES = {
  jackpot: [
    "Jackpot. The machine just called this alignment a foundational model.",
    "Triple match. Somewhere a keynote deck wrote itself.",
    "The reels aligned so perfectly a venture capitalist started clapping.",
  ],
  combo: [
    "GPU, VC, and HYPE. The machine has mistaken fundraising for engineering.",
    "Combo hit. The algorithm is now speaking exclusively in launch tweets.",
  ],
  pair: [
    "A respectable pair. Enough signal for a demo, not enough for truth.",
    "Two matching symbols. The machine is calling it product-market maybe.",
  ],
  miss: [
    "Miss. The machine says your prompt lacked strategic ambiguity.",
    "No payout. The reels have pivoted to enterprise sadness.",
    "Nothing lined up. This is being reframed as a research preview.",
  ],
  bailout: [
    "A nervous VC appeared and slid 12 tokens across the table.",
    "Emergency funding secured. The due diligence was just vibes.",
  ],
  broke: [
    "You are out of tokens. The machine suggests saying synergy more often.",
    "Wallet empty. Time to beg the cloud for another free trial.",
  ],
};

const elements = {
  tokenCount: document.querySelector("#tokenCount"),
  bestRun: document.querySelector("#bestRun"),
  spinCount: document.querySelector("#spinCount"),
  machineMood: document.querySelector("#machineMood"),
  meterFill: document.querySelector("#meterFill"),
  meterLabel: document.querySelector("#meterLabel"),
  spinButton: document.querySelector("#spinButton"),
  bailoutButton: document.querySelector("#bailoutButton"),
  message: document.querySelector("#message"),
  marqueeText: document.querySelector("#marqueeText"),
  logList: document.querySelector("#logList"),
  paytable: document.querySelector("#paytable"),
  reels: [
    document.querySelector("#reel0"),
    document.querySelector("#reel1"),
    document.querySelector("#reel2"),
  ],
  reelWindows: Array.from(document.querySelectorAll(".reel-window")),
};

const state = {
  tokens: STARTING_TOKENS,
  bestRun: STARTING_TOKENS,
  spins: 0,
  history: [],
  reelIndices: [0, 1, 2],
  isSpinning: false,
  audioContext: null,
};

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function titleCase(value) {
  return value.toUpperCase();
}

function pickLine(group) {
  return group[Math.floor(Math.random() * group.length)];
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const saved = JSON.parse(raw);
    state.tokens = Number.isFinite(saved.tokens)
      ? Math.max(0, Math.round(saved.tokens))
      : STARTING_TOKENS;
    state.bestRun = Number.isFinite(saved.bestRun) ? saved.bestRun : state.tokens;
    state.spins = Number.isFinite(saved.spins) ? saved.spins : 0;
    state.history = Array.isArray(saved.history) ? saved.history.slice(0, 5) : [];
    if (Array.isArray(saved.reelIndices) && saved.reelIndices.length === 3) {
      state.reelIndices = saved.reelIndices.map((value, index) =>
        Number.isFinite(value) ? ((Math.round(value) % SYMBOLS.length) + SYMBOLS.length) % SYMBOLS.length : index,
      );
    }
  } catch (error) {
    console.warn("Failed to read saved slot machine state", error);
  }
}

function saveState() {
  try {
    const snapshot = {
      tokens: state.tokens,
      bestRun: state.bestRun,
      spins: state.spins,
      history: state.history,
      reelIndices: state.reelIndices,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Failed to save slot machine state", error);
  }
}

function renderPaytable() {
  elements.paytable.innerHTML = "";

  for (const item of PAYTABLE) {
    const row = document.createElement("div");
    row.className = "paytable-item";
    row.innerHTML = `
      <div>
        <strong>${item.label}</strong>
        <small>${item.note}</small>
      </div>
      <b>+${item.reward}</b>
    `;
    elements.paytable.append(row);
  }
}

function buildReelTrack(activeIndex) {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < SYMBOLS.length + VISIBLE_ROWS + 2; row += 1) {
    const symbol = document.createElement("div");
    symbol.className = "symbol";
    symbol.textContent = titleCase(SYMBOLS[(activeIndex + row) % SYMBOLS.length]);
    fragment.append(symbol);
  }

  return fragment;
}

function paintReels() {
  state.reelIndices.forEach((symbolIndex, reelIndex) => {
    const reel = elements.reels[reelIndex];
    reel.innerHTML = "";
    reel.append(buildReelTrack(symbolIndex));
    reel.style.transform = "translateY(0)";
  });
}

function getMoodLabel() {
  return MACHINE_MOODS.find((mood) => state.tokens >= mood.threshold)?.label ?? "Smug";
}

function renderLog() {
  elements.logList.innerHTML = "";

  if (state.history.length === 0) {
    const empty = document.createElement("li");
    empty.innerHTML = "<strong>No hype yet</strong><span>Your future overpromises will appear here.</span>";
    elements.logList.append(empty);
    return;
  }

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${entry.title}</strong><span>${entry.delta}</span>`;
    elements.logList.append(item);
  });
}

function updateStatus(message) {
  elements.tokenCount.textContent = String(state.tokens);
  elements.bestRun.textContent = String(state.bestRun);
  elements.spinCount.textContent = String(state.spins);
  elements.machineMood.textContent = getMoodLabel();
  elements.meterFill.style.width = `${Math.min((state.tokens / 120) * 100, 100)}%`;
  elements.meterLabel.textContent = `${state.tokens} / 120`;
  elements.message.textContent = message;
  elements.marqueeText.textContent = `Wallet ${state.tokens} tokens. Mood level: ${getMoodLabel()}.`;
  elements.spinButton.disabled = state.isSpinning || state.tokens < SPIN_COST;
  elements.bailoutButton.disabled = state.isSpinning || state.tokens > 12;

  renderLog();
  saveState();
}

function addHistory(title, delta) {
  state.history.unshift({ title, delta });
  state.history = state.history.slice(0, 5);
}

function ensureAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!state.audioContext) {
    const AudioAPI = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioAPI();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }

  return state.audioContext;
}

function playTone(frequency, duration, type = "triangle", volume = 0.03) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function evaluateSpin(symbols) {
  const counts = symbols.reduce((map, symbol) => {
    map[symbol] = (map[symbol] ?? 0) + 1;
    return map;
  }, {});

  const uniqueCount = Object.keys(counts).length;
  const isJackpot = uniqueCount === 1;
  const isFundingCombo = [...symbols].sort().join("-") === "gpu-hype-vc";
  const hasPair = Object.values(counts).some((count) => count === 2);

  if (symbols.join("-") === "token-token-token") {
    return {
      reward: 24,
      title: "Recursive windfall",
      message: pickLine(RESULT_LINES.jackpot),
      effect: "jackpot",
    };
  }

  if (isFundingCombo) {
    return {
      reward: 18,
      title: "Funding combo",
      message: pickLine(RESULT_LINES.combo),
      effect: "combo",
    };
  }

  if (isJackpot) {
    return {
      reward: 15,
      title: "Buzzword triple",
      message: pickLine(RESULT_LINES.jackpot),
      effect: "jackpot",
    };
  }

  if (hasPair) {
    return {
      reward: 6,
      title: "Mildly convincing pair",
      message: pickLine(RESULT_LINES.pair),
      effect: "pair",
    };
  }

  return {
    reward: 0,
    title: "Strategic miss",
    message: pickLine(RESULT_LINES.miss),
    effect: "miss",
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function animateReel(reel, nextIndex, duration) {
  const startIndex = state.reelIndices[Number(reel.dataset.index)];
  reel.innerHTML = "";

  const spinRows = SYMBOLS.length * 2 + VISIBLE_ROWS;
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < spinRows; row += 1) {
    const symbol = document.createElement("div");
    symbol.className = "symbol";
    symbol.textContent = titleCase(SYMBOLS[(startIndex + row) % SYMBOLS.length]);
    fragment.append(symbol);
  }

  for (let row = 0; row < VISIBLE_ROWS + 2; row += 1) {
    const symbol = document.createElement("div");
    symbol.className = "symbol";
    symbol.textContent = titleCase(SYMBOLS[(nextIndex + row) % SYMBOLS.length]);
    fragment.append(symbol);
  }

  reel.append(fragment);

  const distance = -STEP_SIZE * (spinRows - 2);
  const animation = reel.animate(
    [{ transform: "translateY(0)" }, { transform: `translateY(${distance}px)` }],
    {
      duration,
      easing: "cubic-bezier(.12,.8,.18,1)",
      fill: "forwards",
    },
  );

  await animation.finished.catch(() => {});
  state.reelIndices[Number(reel.dataset.index)] = nextIndex;
  reel.innerHTML = "";
  reel.append(buildReelTrack(nextIndex));
  reel.style.transform = "translateY(0)";
}

async function spin() {
  if (state.isSpinning || state.tokens < SPIN_COST) {
    if (state.tokens < SPIN_COST) {
      updateStatus(pickLine(RESULT_LINES.broke));
    }
    return;
  }

  state.isSpinning = true;
  state.tokens -= SPIN_COST;
  state.spins += 1;
  elements.reelWindows.forEach((windowEl) => windowEl.classList.remove("is-winning"));
  updateStatus("Spinning the reels. The machine is monetizing your curiosity.");
  playTone(320, 0.08, "square", 0.04);
  vibrate([20, 16, 20]);

  const nextSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];
  const nextIndices = nextSymbols.map((symbol) => SYMBOLS.indexOf(symbol));

  const animations = elements.reels.map((reel, reelIndex) =>
    animateReel(reel, nextIndices[reelIndex], 850 + reelIndex * 180),
  );

  await Promise.all(animations);
  await wait(120);

  const outcome = evaluateSpin(nextSymbols);
  state.tokens += outcome.reward;
  state.bestRun = Math.max(state.bestRun, state.tokens);
  addHistory(outcome.title, `${outcome.reward > 0 ? "+" : ""}${outcome.reward - SPIN_COST}`);

  if (outcome.effect === "jackpot") {
    elements.reelWindows.forEach((windowEl) => windowEl.classList.add("is-winning"));
    playTone(640, 0.16, "triangle", 0.06);
    playTone(880, 0.24, "sine", 0.05);
    vibrate([40, 30, 80]);
  } else if (outcome.effect === "combo") {
    playTone(540, 0.14, "triangle", 0.05);
  } else if (outcome.effect === "pair") {
    playTone(460, 0.12, "triangle", 0.04);
  } else {
    playTone(180, 0.16, "sawtooth", 0.025);
  }

  state.isSpinning = false;
  updateStatus(outcome.message);

  if (state.tokens < SPIN_COST) {
    updateStatus(`${outcome.message} ${pickLine(RESULT_LINES.broke)}`);
  }
}

function requestBailout() {
  if (state.isSpinning || state.tokens > 12) {
    updateStatus("The VC only answers when the runway is visibly on fire.");
    return;
  }

  state.tokens += BAILOUT_AMOUNT;
  state.bestRun = Math.max(state.bestRun, state.tokens);
  addHistory("Emergency funding", `+${BAILOUT_AMOUNT}`);
  playTone(520, 0.12, "triangle", 0.04);
  updateStatus(pickLine(RESULT_LINES.bailout));
}

function init() {
  loadState();
  elements.reels.forEach((reel, reelIndex) => {
    reel.dataset.index = String(reelIndex);
  });
  renderPaytable();
  paintReels();
  renderLog();
  updateStatus("Pull the lever and let the machine hallucinate value.");

  elements.spinButton.addEventListener("click", spin);
  elements.bailoutButton.addEventListener("click", requestBailout);
}

init();
