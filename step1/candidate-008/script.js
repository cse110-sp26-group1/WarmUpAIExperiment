const STORAGE_KEY = "token-tilt-save-v1";
const SPIN_COST = 12;
const MAX_LOG_ENTRIES = 6;

const SYMBOLS = [
  { key: "TOKEN", payout: 64, quip: "Straight cash for the prompt economy." },
  { key: "CACHE", payout: 42, quip: "Caching worked, so naturally we called it intelligence." },
  { key: "GPU", payout: 36, quip: "You rented hotter silicon and called it strategy." },
  { key: "PROMPT", payout: 30, quip: "A crisp prompt beat six meetings. Miracles happen." },
  { key: "BOT", payout: 24, quip: "Three bots agreed, which is almost a product signal." },
  { key: "404", payout: 10, quip: "Even total confusion gets monetized now." },
];

const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map((symbol) => [symbol.key, symbol]));
const WEIGHTED_SYMBOLS = [
  "BOT",
  "BOT",
  "BOT",
  "GPU",
  "GPU",
  "GPU",
  "PROMPT",
  "PROMPT",
  "PROMPT",
  "CACHE",
  "CACHE",
  "404",
  "404",
  "TOKEN",
];

const UPGRADES = {
  insurance: {
    name: "Hallucination Insurance",
    cost: 18,
    status: "Next losing spin refunds 6 tokens.",
  },
  reroll: {
    name: "Context Window Stretch",
    cost: 24,
    status: "Next weak spin gets a private reroll.",
  },
  bonus: {
    name: "Vibe-Coded Autocomplete",
    cost: 16,
    status: "Next winning spin gets +8 bonus tokens.",
  },
};

const confidenceLines = [
  "39% sure this is intelligence",
  "52% sure the benchmark is honest",
  "61% sure the buzzwords are doing heavy lifting",
  "74% sure the deck will say agentic",
  "28% sure the model has read the prompt",
  "83% sure someone will call this transformative",
];

const dom = {
  machine: document.querySelector("#machine"),
  reels: [...document.querySelectorAll(".reel")],
  tokenCount: document.querySelector("#tokenCount"),
  bestWin: document.querySelector("#bestWin"),
  statusText: document.querySelector("#statusText"),
  statusSubtext: document.querySelector("#statusSubtext"),
  spinCount: document.querySelector("#spinCount"),
  totalWon: document.querySelector("#totalWon"),
  totalSpent: document.querySelector("#totalSpent"),
  buffSummary: document.querySelector("#buffSummary"),
  confidenceBar: document.querySelector("#confidenceBar"),
  confidenceLabel: document.querySelector("#confidenceLabel"),
  eventLog: document.querySelector("#eventLog"),
  spinButton: document.querySelector("#spinButton"),
  bailoutButton: document.querySelector("#bailoutButton"),
  aboutButton: document.querySelector("#aboutButton"),
  aboutDialog: document.querySelector("#aboutDialog"),
  resetButton: document.querySelector("#resetButton"),
  shopCards: [...document.querySelectorAll(".shop-card")],
  buyButtons: [...document.querySelectorAll(".buy-button")],
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let audioContext;
let isSpinning = false;

function createDefaultState() {
  return {
    tokens: 120,
    bestWin: 0,
    totalWon: 0,
    totalSpent: 0,
    spinCount: 0,
    reels: ["TOKEN", "BOT", "CACHE"],
    log: [
      "Casino online. The house accepts prompt tokens and broken confidence.",
      "Tip: buy an upgrade after a win and pretend you are deploying strategy.",
    ],
    confidence: 39,
    confidenceLine: confidenceLines[0],
    buffs: {
      insurance: false,
      reroll: false,
      bonus: false,
    },
  };
}

let state = loadState();
dom.buyButtons.forEach((button) => {
  button.dataset.defaultLabel = button.textContent.trim();
});
render();

dom.spinButton.addEventListener("click", () => {
  spin();
});

dom.bailoutButton.addEventListener("click", () => {
  claimBailout();
});

dom.aboutButton.addEventListener("click", () => {
  if (typeof dom.aboutDialog.showModal === "function") {
    dom.aboutDialog.showModal();
  }
});

dom.resetButton.addEventListener("click", () => {
  if (!window.confirm("Reset the run and erase your token empire?")) {
    return;
  }

  state = createDefaultState();
  saveState();
  render({
    statusText: "Fresh run started. The house is acting supportive.",
    statusSubtext: "Local storage has politely forgotten your mistakes.",
  });
});

dom.buyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    buyUpgrade(button.dataset.upgrade);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || isSpinning) {
    return;
  }

  const targetTag = document.activeElement?.tagName;
  if (targetTag === "BUTTON") {
    return;
  }

  event.preventDefault();
  spin();
});

function loadState() {
  try {
    const defaults = createDefaultState();
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return defaults;
    }

    const parsed = JSON.parse(saved);
    return {
      ...defaults,
      ...parsed,
      buffs: {
        ...defaults.buffs,
        ...(parsed.buffs || {}),
      },
      log: Array.isArray(parsed.log) && parsed.log.length ? parsed.log.slice(0, MAX_LOG_ENTRIES) : defaults.log,
      reels: Array.isArray(parsed.reels) && parsed.reels.length === 3 ? parsed.reels : defaults.reels,
    };
  } catch (error) {
    console.warn("Could not restore saved state.", error);
    return createDefaultState();
  }
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Could not save state.", error);
  }
}

function render(overrides = {}) {
  dom.tokenCount.textContent = formatTokens(state.tokens);
  dom.bestWin.textContent = formatTokens(state.bestWin);
  dom.spinCount.textContent = formatTokens(state.spinCount);
  dom.totalWon.textContent = formatTokens(state.totalWon);
  dom.totalSpent.textContent = formatTokens(state.totalSpent);
  dom.buffSummary.textContent = describeBuffs();
  dom.confidenceBar.style.width = `${state.confidence}%`;
  dom.confidenceLabel.textContent = state.confidenceLine;
  dom.statusText.textContent = overrides.statusText || "Ready to exchange money-adjacent points for hope.";
  dom.statusSubtext.textContent = overrides.statusSubtext || "The reels are not sentient. They are just loud.";

  state.reels.forEach((symbolKey, index) => {
    paintReel(dom.reels[index], symbolKey);
  });

  dom.eventLog.replaceChildren();
  state.log.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = entry;
    dom.eventLog.append(item);
  });

  dom.shopCards.forEach((card) => {
    const key = card.dataset.upgrade;
    const isActive = Boolean(state.buffs[key]);
    card.dataset.active = isActive ? "true" : "false";
    const button = card.querySelector("button");
    button.disabled = isActive || isSpinning;
    button.textContent = isActive ? "Already Active" : button.dataset.defaultLabel;
  });

  const cannotSpin = state.tokens < SPIN_COST || isSpinning;
  dom.spinButton.disabled = cannotSpin;
  dom.bailoutButton.disabled = isSpinning || state.tokens >= SPIN_COST;
}

async function spin() {
  if (isSpinning || state.tokens < SPIN_COST) {
    if (state.tokens < SPIN_COST) {
      const needed = SPIN_COST - state.tokens;
      setStatus(
        "Not enough tokens to spin.",
        `You are ${formatTokens(needed)} tokens short. Time to ask investors for feelings-based funding.`
      );
    }
    return;
  }

  isSpinning = true;
  state.tokens -= SPIN_COST;
  state.totalSpent += SPIN_COST;
  pushLog(`Spent <strong>${formatTokens(SPIN_COST)}</strong> tokens to ask the machine if probability loves you back.`);
  setStatus("Spinning the reels.", "Twelve tokens disappear into a highly polished confidence funnel.");
  touchFeedback([14, 28, 14]);
  playToneSequence([220, 196, 175], 0.06);
  render({
    statusText: "Spinning the reels.",
    statusSubtext: "Twelve tokens disappear into a highly polished confidence funnel.",
  });

  let outcome = evaluateSpin(generateSpin());

  if (state.buffs.reroll && outcome.payout < 16) {
    const upgradedOutcome = evaluateSpin(generateSpin());
    if (upgradedOutcome.payout > outcome.payout) {
      outcome = upgradedOutcome;
      pushLog("Context Window Stretch quietly rerolled a weak result and pretended it was memory.");
    } else {
      pushLog("Context Window Stretch looked busy, then produced the same flavor of uncertainty.");
    }
    state.buffs.reroll = false;
  }

  await animateReels(outcome.symbols);

  let payout = outcome.payout;
  const notes = [];

  if (state.buffs.bonus && payout > 0) {
    payout += 8;
    notes.push("Vibe-Coded Autocomplete stapled on 8 bonus tokens.");
    state.buffs.bonus = false;
  }

  if (state.buffs.insurance && payout === 0) {
    payout = 6;
    notes.push("Hallucination Insurance refunded 6 tokens after a totally confident miss.");
    state.buffs.insurance = false;
  }

  state.tokens += payout;
  state.totalWon += payout;
  state.bestWin = Math.max(state.bestWin, payout);
  state.spinCount += 1;
  state.reels = outcome.symbols;
  refreshConfidence(payout);

  const jackpot = payout >= 40;
  const message = payout > 0
    ? `Won <strong>${formatTokens(payout)}</strong> tokens with <strong>${outcome.label}</strong>. ${outcome.quip}`
    : `No payout. The model confidently returned vibes instead of value.`;

  pushLog(message);
  notes.forEach((note) => pushLog(note));
  setStatus(
    payout > 0 ? `${outcome.label} pays out ${formatTokens(payout)} tokens.` : "The house deployed another empty response.",
    notes[0] || outcome.quip || "That happened locally, which somehow makes it funnier."
  );

  if (jackpot) {
    dom.machine.classList.add("is-jackpot");
    makeBurst();
    playToneSequence([523.25, 659.25, 783.99], 0.11);
    touchFeedback([18, 36, 18, 36, 24]);
    window.setTimeout(() => dom.machine.classList.remove("is-jackpot"), 1700);
  } else if (payout > 0) {
    playToneSequence([329.63, 392, 523.25], 0.08);
    touchFeedback([18, 24, 18]);
  } else {
    playToneSequence([174.61, 155.56], 0.08);
  }

  saveState();
  isSpinning = false;
  render({
    statusText: payout > 0 ? `${outcome.label} pays out ${formatTokens(payout)} tokens.` : "The house deployed another empty response.",
    statusSubtext: notes[0] || outcome.quip || "That happened locally, which somehow makes it funnier.",
  });
}

function claimBailout() {
  if (isSpinning || state.tokens >= SPIN_COST) {
    return;
  }

  state.tokens += 20;
  state.totalWon += 20;
  refreshConfidence(20);
  pushLog("Pitch Deck Bailout secured <strong>20</strong> mercy tokens after promising the market you are agentic.");
  saveState();
  render({
    statusText: "Investors nodded at the word synergy.",
    statusSubtext: "You received 20 bailout tokens and absolutely no follow-up questions.",
  });
  touchFeedback([12, 22, 12]);
  playToneSequence([261.63, 293.66, 329.63], 0.06);
}

function buyUpgrade(key) {
  const upgrade = UPGRADES[key];
  if (!upgrade || isSpinning) {
    return;
  }

  if (state.buffs[key]) {
    setStatus(upgrade.name, "This buff is already active and overpromising.");
    return;
  }

  if (state.tokens < upgrade.cost) {
    setStatus(
      `Not enough tokens for ${upgrade.name}.`,
      `You need ${formatTokens(upgrade.cost - state.tokens)} more tokens to purchase this carefully branded feature.`
    );
    return;
  }

  state.tokens -= upgrade.cost;
  state.totalSpent += upgrade.cost;
  state.buffs[key] = true;
  pushLog(`Bought <strong>${upgrade.name}</strong> for <strong>${formatTokens(upgrade.cost)}</strong> tokens. ${upgrade.status}`);
  saveState();
  render({
    statusText: `${upgrade.name} is active.`,
    statusSubtext: upgrade.status,
  });
  playToneSequence([392, 440], 0.05);
}

function generateSpin() {
  return Array.from({ length: 3 }, () => pickWeightedSymbol());
}

function evaluateSpin(symbols) {
  const counts = symbols.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const unique = new Set(symbols);

  if (unique.size === 1) {
    const symbol = SYMBOL_MAP[symbols[0]];
    return {
      symbols,
      payout: symbol.payout,
      label: `Triple ${symbol.key}`,
      quip: symbol.quip,
    };
  }

  if ((counts.TOKEN || 0) === 2) {
    return {
      symbols,
      payout: 20,
      label: "Double Token Leak",
      quip: "Two token reels lined up and the platform billing team started breathing heavier.",
    };
  }

  if (unique.has("BOT") && unique.has("GPU") && unique.has("PROMPT")) {
    return {
      symbols,
      payout: 26,
      label: "Startup Trinity",
      quip: "Bot, GPU, prompt. That is practically a funding round.",
    };
  }

  if (unique.has("404") && (counts["404"] || 0) === 2) {
    return {
      symbols,
      payout: 8,
      label: "Soft Failure",
      quip: "Two 404s counts as resilience when the press release is polished enough.",
    };
  }

  return {
    symbols,
    payout: 0,
    label: "No Match",
    quip: "The system generated confidence but skipped utility.",
  };
}

function pickWeightedSymbol() {
  return WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)];
}

function paintReel(reel, symbolKey) {
  reel.textContent = symbolKey;
  reel.dataset.symbol = symbolKey;
}

async function animateReels(symbols) {
  if (prefersReducedMotion.matches) {
    symbols.forEach((symbol, index) => paintReel(dom.reels[index], symbol));
    return;
  }

  const tasks = dom.reels.map((reel, index) => {
    return new Promise((resolve) => {
      reel.classList.add("is-spinning");
      const interval = window.setInterval(() => {
        paintReel(reel, pickWeightedSymbol());
      }, 80);

      window.setTimeout(() => {
        window.clearInterval(interval);
        paintReel(reel, symbols[index]);
        reel.classList.remove("is-spinning");
        resolve();
      }, 880 + index * 220);
    });
  });

  await Promise.all(tasks);
}

function pushLog(entry) {
  state.log = [entry, ...state.log].slice(0, MAX_LOG_ENTRIES);
}

function describeBuffs() {
  const active = Object.entries(state.buffs)
    .filter(([, value]) => value)
    .map(([key]) => UPGRADES[key].name);

  return active.length ? active.join(" / ") : "None";
}

function setStatus(text, subtext) {
  dom.statusText.textContent = text;
  dom.statusSubtext.textContent = subtext;
}

function refreshConfidence(payout) {
  const base = Math.max(18, Math.min(91, 31 + Math.floor(Math.random() * 44) + Math.round(payout / 4)));
  state.confidence = base;
  state.confidenceLine = confidenceLines[Math.floor(Math.random() * confidenceLines.length)];
}

function formatTokens(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function touchFeedback(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function playToneSequence(frequencies, durationSeconds) {
  const context = ensureAudio();
  if (!context) {
    return;
  }

  let when = context.currentTime;
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index % 2 === 0 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.07, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + durationSeconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(when);
    oscillator.stop(when + durationSeconds);
    when += durationSeconds * 0.85;
  });
}

function makeBurst() {
  if (prefersReducedMotion.matches) {
    return;
  }

  for (let index = 0; index < 16; index += 1) {
    const token = document.createElement("span");
    token.className = "token-burst";
    token.style.left = `${12 + Math.random() * 76}%`;
    token.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    token.style.animationDelay = `${Math.random() * 120}ms`;
    dom.machine.append(token);
    window.setTimeout(() => token.remove(), 1300);
  }
}
