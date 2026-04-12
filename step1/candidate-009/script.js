const STORAGE_KEY = "ai-token-casino-state";
const STARTING_TOKENS = 120;
const SPIN_COST = 15;
const BAILOUT_AMOUNT = 90;

const symbols = [
  {
    key: "token",
    label: "TOKEN",
    weight: 3,
    payout: 110,
    blurb: "Triple TOKEN. Congratulations, you have successfully monetized vibes."
  },
  {
    key: "gpu",
    label: "GPU",
    weight: 3,
    payout: 85,
    blurb: "Triple GPU. The cluster is humming and accounting is crying."
  },
  {
    key: "vc",
    label: "VC",
    weight: 3,
    payout: 70,
    blurb: "Triple VC. A pitch deck has mistaken your losses for momentum."
  },
  {
    key: "agent",
    label: "AGENT",
    weight: 2,
    payout: 95,
    blurb: "Triple AGENT. Nobody knows what it does, but it definitely has a roadmap."
  },
  {
    key: "hype",
    label: "HYPE",
    weight: 4,
    payout: 55,
    blurb: "Triple HYPE. The demo glows. The margins do not."
  },
  {
    key: "ethics",
    label: "ETHICS",
    weight: 2,
    payout: 45,
    blurb: "Triple ETHICS. A panel discussion has broken out. Somehow this still paid."
  },
  {
    key: "prompt",
    label: "PROMPT",
    weight: 4,
    payout: 50,
    blurb: "Triple PROMPT. You have engineered precisely one useful sentence."
  },
  {
    key: "404",
    label: "404",
    weight: 2,
    payout: 20,
    blurb: "Triple 404. Failure has been productized and sold back to you."
  }
];

const consolationMessages = [
  "No match. Your startup pivoted directly into a crater.",
  "No match. The model confidently predicted absolutely nothing.",
  "No match. You spent tokens to generate a premium shrug.",
  "No match. Another benchmark was gamed, but sadly not this one.",
  "No match. The deck says breakout growth. The reels say not today.",
  "No match. Your autonomous agent achieved a fully self-directed loss."
];

const nearMissMessages = [
  "Two symbols matched. So close to profit, just like most AI demos.",
  "Near miss. The machine produced 80% of a good idea and 100% of the invoice.",
  "Near miss. You almost reached escape velocity before reentering the burn rate."
];

const bailoutMessages = [
  "Fresh capital acquired. Nobody asked what the product does.",
  "A venture capitalist has wired more tokens after hearing the words enterprise AI.",
  "Emergency funding approved. Your losses have been rebranded as aggressive learning."
];

const reelElements = [...document.querySelectorAll(".reel")];
const tokenBalanceEl = document.querySelector("#token-balance");
const tokensSpentEl = document.querySelector("#tokens-spent");
const bestBalanceEl = document.querySelector("#best-balance");
const lastWinEl = document.querySelector("#last-win");
const spinCostEl = document.querySelector("#spin-cost");
const spinCountEl = document.querySelector("#spin-count");
const messageEl = document.querySelector("#message");
const sessionNoteEl = document.querySelector("#session-note");
const spinButton = document.querySelector("#spin-button");
const bailoutButton = document.querySelector("#bailout-button");
const soundButton = document.querySelector("#sound-button");
const payoutGrid = document.querySelector("#payout-grid");
const machineFace = document.querySelector(".machine-face");

const formatter = new Intl.NumberFormat("en-US");
const weightedSymbols = symbols.flatMap((symbol) =>
  Array.from({ length: symbol.weight }, () => symbol)
);
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let isSpinning = false;

const state = loadState();

spinCostEl.textContent = formatter.format(SPIN_COST);
renderPayouts();
initializeReels();
render();

spinButton.addEventListener("click", spin);
bailoutButton.addEventListener("click", requestBailout);
soundButton.addEventListener("click", toggleSound);

function renderPayouts() {
  payoutGrid.innerHTML = symbols
    .map(
      (symbol) => `
        <article class="payout-card">
          <strong>${symbol.label} ×3</strong>
          <span>+${formatter.format(symbol.payout)} tokens</span>
        </article>
      `
    )
    .join("");
}

function loadState() {
  const fallback = {
    tokens: STARTING_TOKENS,
    spent: 0,
    best: STARTING_TOKENS,
    lastWin: 0,
    spins: 0,
    soundEnabled: true,
    bailouts: 0
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") {
      return fallback;
    }

    return {
      ...fallback,
      ...saved
    };
  } catch (error) {
    return fallback;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore storage failures so the game remains playable in stricter browsers.
  }
}

function render() {
  tokenBalanceEl.textContent = formatTokens(state.tokens);
  tokensSpentEl.textContent = formatTokens(state.spent);
  bestBalanceEl.textContent = formatTokens(state.best);
  lastWinEl.textContent = formatTokens(state.lastWin);
  spinCountEl.textContent = formatter.format(state.spins);
  soundButton.textContent = state.soundEnabled ? "Sound: On" : "Sound: Off";
  soundButton.setAttribute("aria-pressed", String(state.soundEnabled));

  const broke = state.tokens < SPIN_COST;
  spinButton.disabled = broke || isSpinning;
  spinButton.textContent = isSpinning
    ? "Spinning..."
    : broke
      ? "Out of Tokens"
      : `Spend ${formatTokens(SPIN_COST)} Tokens`;
  bailoutButton.disabled = isSpinning;
  bailoutButton.textContent = state.bailouts === 0 ? "Beg Venture Capital" : "Raise Another Round";
  sessionNoteEl.textContent = buildSessionNote();
}

function formatTokens(value) {
  return formatter.format(value);
}

function randomSymbol() {
  return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
}

function initializeReels() {
  reelElements.forEach((_, index) => {
    setReelSymbol(index, randomSymbol());
  });
}

async function spin() {
  if (isSpinning) {
    setMessage("Easy. The reels are still busy pretending to do inference.");
    return;
  }

  if (state.tokens < SPIN_COST) {
    setMessage("You are out of tokens. The machine recommends new funding and lower standards.");
    animateOutcome("loss");
    return;
  }

  isSpinning = true;
  state.tokens -= SPIN_COST;
  state.spent += SPIN_COST;
  state.spins += 1;
  state.lastWin = 0;
  saveState();
  render();

  try {
    setMessage("Processing your request. Please enjoy this premium suspense.");
    await animateSpin();

    const result = reelElements.map((_, index) => {
      const symbol = randomSymbol();
      setReelSymbol(index, symbol);
      return symbol;
    });

    const outcome = evaluateResult(result);
    state.tokens += outcome.payout;
    state.lastWin = outcome.payout;
    state.best = Math.max(state.best, state.tokens);
    saveState();
    setMessage(outcome.message);
    animateOutcome(outcome.payout > 0 ? "win" : "loss");
    playResultTone(outcome.payout > 0 ? "win" : "loss");
  } finally {
    isSpinning = false;
    render();
  }
}

function requestBailout() {
  state.tokens += BAILOUT_AMOUNT;
  state.bailouts += 1;
  state.best = Math.max(state.best, state.tokens);
  saveState();
  render();
  setMessage(pickRandom(bailoutMessages));
  animateOutcome("win");
  playResultTone("bailout");
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveState();
  render();
  setMessage(
    state.soundEnabled
      ? "Sound enabled. The machine may now beep with renewed confidence."
      : "Sound disabled. Even the casino has agreed to stop talking."
  );
}

function evaluateResult(result) {
  const keys = result.map((symbol) => symbol.key);
  const uniqueKeys = new Set(keys);

  if (uniqueKeys.size === 1) {
    const [match] = result;
    return {
      payout: match.payout,
      message: match.blurb
    };
  }

  if (uniqueKeys.size === 2) {
    return {
      payout: 12,
      message: pickRandom(nearMissMessages)
    };
  }

  return {
    payout: 0,
    message: pickRandom(consolationMessages)
  };
}

function setReelSymbol(index, symbol) {
  const reel = reelElements[index];
  reel.className = `reel symbol-${symbol.key}`;
  reel.innerHTML = `<span class="reel__label">${symbol.label}</span>`;
}

function setMessage(message) {
  messageEl.textContent = message;
}

async function animateSpin() {
  playSpinTone();
  const spinFrames = [240, 520, 760];

  const animations = reelElements.map((reel, index) => animateReel(reel, spinFrames[index]));
  await Promise.all(animations);
}

function animateReel(reel, duration) {
  reel.classList.add("spinning");

  return new Promise((resolve) => {
    const flicker = window.setInterval(() => {
      const symbol = randomSymbol();
      reel.className = `reel spinning symbol-${symbol.key}`;
      reel.innerHTML = `<span class="reel__label">${symbol.label}</span>`;
    }, 90);

    window.setTimeout(() => {
      window.clearInterval(flicker);
      reel.classList.remove("spinning");
      resolve();
    }, duration);
  });
}

function animateOutcome(type) {
  machineFace.classList.remove("flash-win", "flash-loss");
  void machineFace.offsetWidth;
  machineFace.classList.add(type === "win" ? "flash-win" : "flash-loss");

  if ("vibrate" in navigator) {
    navigator.vibrate(type === "win" ? [60, 40, 120] : [100]);
  }
}

function buildSessionNote() {
  if (state.tokens < SPIN_COST) {
    return "Wallet depleted. The machine suggests another round of visionary fundraising.";
  }

  if (state.tokens >= 250) {
    return "Your token pile is getting loud enough to attract an accelerator.";
  }

  if (state.spins === 0) {
    return "Latest forecast: irrational confidence with a 98% chance of buzzwords.";
  }

  if (state.lastWin >= 80) {
    return "Momentum detected. Please misuse the word exponential responsibly.";
  }

  if (state.bailouts > 0) {
    return "Outside capital is currently doing most of the heavy lifting.";
  }

  return "Model status: still burning tokens faster than it explains itself.";
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

let audioContext;

function getAudioContext() {
  if (!state.soundEnabled) {
    return null;
  }

  if (!audioContext) {
    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playSpinTone() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const notes = [250, 300, 360];

  notes.forEach((frequency, index) => {
    scheduleTone(context, {
      frequency,
      start: context.currentTime + index * 0.07,
      duration: 0.08,
      gain: 0.025,
      type: "square"
    });
  });
}

function playResultTone(type) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const patterns = {
    win: [440, 590, 780],
    loss: [220, 180],
    bailout: [330, 415, 523]
  };

  patterns[type].forEach((frequency, index) => {
    scheduleTone(context, {
      frequency,
      start: context.currentTime + index * 0.1,
      duration: type === "loss" ? 0.12 : 0.16,
      gain: 0.04,
      type: type === "loss" ? "sawtooth" : "triangle"
    });
  });
}

function scheduleTone(context, options) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, options.start);

  gainNode.gain.setValueAtTime(0.001, options.start);
  gainNode.gain.exponentialRampToValueAtTime(options.gain, options.start + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, options.start + options.duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration);
}
