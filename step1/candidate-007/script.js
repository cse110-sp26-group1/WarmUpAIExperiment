const symbols = [
  {
    icon: "🧠",
    label: "alignment deck",
    note: "cited a benchmark without being asked twice",
    weight: 6
  },
  {
    icon: "💸",
    label: "token burn",
    note: "converted budget into confidence",
    weight: 6
  },
  {
    icon: "🤖",
    label: "demo bot",
    note: "smiling through a suspicious answer",
    weight: 8
  },
  {
    icon: "🫠",
    label: "hallucination",
    note: "invented a source with conviction",
    weight: 7
  },
  {
    icon: "📈",
    label: "growth chart",
    note: "number go up, context unavailable",
    weight: 7
  },
  {
    icon: "🔥",
    label: "launch thread",
    note: "went viral with one cropped graph",
    weight: 7
  },
  {
    icon: "🪙",
    label: "premium token",
    note: "monetized the apology",
    weight: 5
  },
  {
    icon: "🧾",
    label: "compliance patch",
    note: "shipped a policy instead of a fix",
    weight: 6
  }
];

const bets = [10, 25, 40];
const storageKey = "token-laundromat-state";
const startingState = {
  balance: 180,
  selectedBet: 10,
  lastPayout: 0,
  spins: 0,
  streak: 0,
  bestWin: 0,
  history: []
};
const defaultFeed = [
  {
    tag: "Floor Note",
    text: "Wallet loaded. The machine has already drafted its keynote about disruption."
  },
  {
    tag: "Risk Desk",
    text: "Reminder: every loss is quietly rebranded as data collection."
  },
  {
    tag: "House Tip",
    text: "A smaller spend is called discipline. A larger spend is called vision."
  }
];
const weightedSymbols = symbols.flatMap((symbol) =>
  Array.from({ length: symbol.weight }, () => symbol)
);
const numberFormatter = new Intl.NumberFormat("en-US");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const reelEls = Array.from(document.querySelectorAll(".reel-symbol"));
const reelFrames = Array.from(document.querySelectorAll(".reel-frame"));
const captionEls = Array.from(document.querySelectorAll(".reel-caption"));
const betButtons = Array.from(document.querySelectorAll(".bet-chip"));
const balanceEl = document.querySelector("#balance");
const currentBetEl = document.querySelector("#current-bet");
const payoutEl = document.querySelector("#payout");
const streakEl = document.querySelector("#streak");
const spinsEl = document.querySelector("#spins");
const messageEl = document.querySelector("#message");
const headlineEl = document.querySelector("#headline");
const feedEl = document.querySelector("#feed");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const machineEl = document.querySelector(".machine");

let state = readStoredState();
let spinning = false;
let displayedBalance = state.balance;
let audioContext;
let currentSymbols = [symbols[0], symbols[6], symbols[5]];

function readStoredState() {
  const baseState = {
    ...startingState,
    history: [...defaultFeed]
  };

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return baseState;
    }

    const parsed = JSON.parse(raw);
    const balance = sanitizeNumber(parsed.balance, startingState.balance, 0);
    const selectedBet = bets.includes(parsed.selectedBet)
      ? parsed.selectedBet
      : startingState.selectedBet;

    return {
      balance,
      selectedBet,
      lastPayout: sanitizeNumber(parsed.lastPayout, 0, 0),
      spins: sanitizeNumber(parsed.spins, 0, 0),
      streak: sanitizeNumber(parsed.streak, 0, 0),
      bestWin: sanitizeNumber(parsed.bestWin, 0, 0),
      history: sanitizeHistory(parsed.history)
    };
  } catch (error) {
    return baseState;
  }
}

function sanitizeNumber(value, fallback, minimum) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < minimum) {
    return fallback;
  }

  return Math.round(parsed);
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [...defaultFeed];
  }

  const clean = history
    .filter((entry) => entry && typeof entry.tag === "string" && typeof entry.text === "string")
    .slice(0, 5);

  return clean.length > 0 ? clean : [...defaultFeed];
}

function saveState() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    // Ignore storage failures so the game still works in private browsing modes.
  }
}

function formatNumber(value) {
  return numberFormatter.format(Math.max(0, Math.round(value)));
}

function sampleSymbol() {
  return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
}

function updateReel(index, symbol) {
  currentSymbols[index] = symbol;
  reelEls[index].textContent = symbol.icon;
  captionEls[index].textContent = symbol.label;
}

function animateNumber(element, fromValue, toValue, duration = 520) {
  if (fromValue === toValue || reduceMotion) {
    element.textContent = formatNumber(toValue);
    return;
  }

  const start = performance.now();
  const change = toValue - fromValue;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextValue = fromValue + change * eased;

    element.textContent = formatNumber(nextValue);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function updateMessage(text, tone = "") {
  messageEl.textContent = text;
  messageEl.className = `message ${tone}`.trim();
}

function updateHeadline(text) {
  headlineEl.textContent = text;
}

function renderFeed() {
  feedEl.replaceChildren();

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "feed-item";

    const tag = document.createElement("strong");
    tag.textContent = entry.tag;

    const text = document.createElement("p");
    text.textContent = entry.text;

    item.append(tag, text);
    feedEl.append(item);
  });
}

function renderStats({ balanceFrom = displayedBalance, animateBalance = false } = {}) {
  if (animateBalance) {
    animateNumber(balanceEl, balanceFrom, state.balance);
  } else {
    balanceEl.textContent = formatNumber(state.balance);
  }

  displayedBalance = state.balance;
  currentBetEl.textContent = formatNumber(state.selectedBet);
  payoutEl.textContent = formatNumber(state.lastPayout);
  streakEl.textContent = formatNumber(state.streak);
  spinsEl.textContent = formatNumber(state.spins);

  betButtons.forEach((button) => {
    const bet = Number(button.dataset.bet);
    const active = bet === state.selectedBet;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = spinning;
  });

  spinButton.disabled = spinning || state.balance < state.selectedBet;
  resetButton.disabled = spinning;
  saveState();
}

function flashSurface(keyframes, options) {
  if (reduceMotion || typeof machineEl.animate !== "function") {
    return;
  }

  machineEl.animate(keyframes, options);
}

function pulseReel(frame) {
  if (reduceMotion || typeof frame.animate !== "function") {
    return;
  }

  frame.animate(
    [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-3px) scale(1.01)" },
      { transform: "translateY(0) scale(1)" }
    ],
    {
      duration: 240,
      easing: "ease-out"
    }
  );
}

function nudgeDevice(pattern) {
  if (reduceMotion || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(pattern);
}

function ensureAudioContext() {
  if (audioContext) {
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    return audioContext;
  }

  const Context = window.AudioContext || window.webkitAudioContext;

  if (!Context) {
    return null;
  }

  try {
    audioContext = new Context();
    return audioContext;
  } catch (error) {
    return null;
  }
}

function playTone(frequency, duration = 0.08, type = "triangle", gainValue = 0.024) {
  const context = ensureAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(gainValue, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playOutcomeSound(outcome) {
  if (outcome.payout > 0) {
    playTone(420, 0.1, "sine", 0.03);
    window.setTimeout(() => playTone(620, 0.14, "triangle", 0.028), 75);
    window.setTimeout(() => playTone(860, 0.18, "sine", 0.026), 150);
    return;
  }

  playTone(230, 0.12, "sawtooth", 0.022);
}

function setWinningFrames(outcome, result) {
  reelFrames.forEach((frame) => frame.classList.remove("is-winning"));

  if (outcome.highlightAll) {
    reelFrames.forEach((frame) => {
      frame.classList.add("is-winning");
      pulseReel(frame);
    });
    return;
  }

  if (!outcome.highlightIcons) {
    return;
  }

  result.forEach((symbol, index) => {
    if (outcome.highlightIcons.includes(symbol.icon)) {
      reelFrames[index].classList.add("is-winning");
      pulseReel(reelFrames[index]);
    }
  });
}

function evaluateSpin(result, bet) {
  const icons = result.map((symbol) => symbol.icon);
  const counts = icons.reduce((bucket, icon) => {
    bucket[icon] = (bucket[icon] || 0) + 1;
    return bucket;
  }, {});
  const occurrences = Object.values(counts).sort((a, b) => b - a);
  const uniqueIcons = new Set(icons);

  if (icons.every((icon) => icon === "🧠")) {
    return {
      payout: bet * 12,
      tone: "win",
      headline: "House bulletin: the benchmark gods have smiled.",
      message:
        "Alignment jackpot. The model cited something real, nobody panicked, and the tokens came back.",
      log: `Hit triple brains for ${formatNumber(
        bet * 12
      )} tokens. The house is calling it evidence-based magic.`,
      highlightAll: true
    };
  }

  if (icons.every((icon) => icon === "💸")) {
    return {
      payout: bet * 10,
      tone: "win",
      headline: "House bulletin: cash burn has been reclassified as momentum.",
      message:
        "Token bonfire. You lost so efficiently that a venture fund decided it counts as traction.",
      log: `Hit triple burn for ${formatNumber(
        bet * 10
      )} tokens. Pure combustion, beautifully monetized.`,
      highlightAll: true
    };
  }

  if (
    uniqueIcons.size === 3 &&
    ["📈", "🔥", "💸"].every((icon) => uniqueIcons.has(icon))
  ) {
    return {
      payout: bet * 4,
      tone: "win",
      headline: "House bulletin: a Series A mirage has materialized on the floor.",
      message:
        "Growth, hype, and burn appeared together. That is not sustainability, but it is definitely a slide deck.",
      log: `Series A mirage paid ${formatNumber(
        bet * 4
      )} tokens. Loud enough chaos apparently counts as product-market fit.`,
      highlightAll: true
    };
  }

  if (occurrences[0] === 3) {
    return {
      payout: bet * 7,
      tone: "win",
      headline: "House bulletin: the machine has mistaken repetition for intelligence.",
      message: `Triple ${
        result[0].label
      }. The floor has declared it "general intelligence" and released a teaser trailer.`,
      log: `Triple ${result[0].label} paid ${formatNumber(
        bet * 7
      )} tokens. Rebranding is doing most of the work.`,
      highlightAll: true
    };
  }

  if (occurrences[0] === 2) {
    const pairedIcon = Object.keys(counts).find((icon) => counts[icon] === 2);
    const payoutMultiplier = icons.includes("🪙") ? 3 : 2;

    return {
      payout: bet * payoutMultiplier,
      tone: "win",
      headline: icons.includes("🪙")
        ? "House bulletin: premium pricing has rescued an otherwise normal spin."
        : "House bulletin: a pair matched, which is practically a product launch.",
      message: icons.includes("🪙")
        ? "A premium token got involved, so the refund was upgraded to a luxury narrative."
        : "A pair matched. Not intelligence, not profit, but absolutely enough to impress a conference crowd.",
      log: `Matched ${pairedIcon} for ${formatNumber(
        bet * payoutMultiplier
      )} tokens. The demo remains technically solvent.`,
      highlightIcons: [pairedIcon]
    };
  }

  return {
    payout: 0,
    tone: "loss",
    headline: "House bulletin: confidence remains high, evidence remains optional.",
    message:
      "No match. Your spend has been transformed into a keynote about agents talking to other agents.",
    log: `Lost ${formatNumber(
      bet
    )} tokens. The machine has converted it into a fresh privacy addendum.`
  };
}

function addFeed(tag, text) {
  state.history.unshift({ tag, text });
  state.history = state.history.slice(0, 5);
}

function setBet(nextBet) {
  if (spinning || !bets.includes(nextBet)) {
    return;
  }

  state.selectedBet = nextBet;
  renderStats();
  updateHeadline(`Model mood: ready to waste ${formatNumber(nextBet)} tokens with style.`);
}

function animateReel(index, duration) {
  return new Promise((resolve) => {
    const reelEl = reelEls[index];
    const frame = reelFrames[index];
    const captionEl = captionEls[index];

    frame.classList.remove("is-winning");

    if (reduceMotion) {
      const finalSymbol = sampleSymbol();
      updateReel(index, finalSymbol);
      resolve(finalSymbol);
      return;
    }

    reelEl.classList.add("is-spinning");
    captionEl.textContent = "sampling hype...";

    const ticker = window.setInterval(() => {
      updateReel(index, sampleSymbol());
    }, 82);

    window.setTimeout(() => {
      window.clearInterval(ticker);
      reelEl.classList.remove("is-spinning");
      const finalSymbol = sampleSymbol();
      updateReel(index, finalSymbol);
      playTone(300 + index * 90, 0.06, "triangle", 0.02);
      pulseReel(frame);
      resolve(finalSymbol);
    }, duration);
  });
}

async function spin() {
  if (spinning) {
    return;
  }

  if (state.balance < state.selectedBet) {
    updateMessage(
      "Wallet dry. Refill the account before the machine starts selling you a masterclass.",
      "loss"
    );
    updateHeadline("Model mood: deeply interested in your remaining credit card limit.");
    return;
  }

  const bet = state.selectedBet;
  const previousBalance = state.balance;

  spinning = true;
  state.balance -= bet;
  state.lastPayout = 0;
  state.spins += 1;

  updateMessage(
    `Buying compute for ${formatNumber(
      bet
    )} tokens. The model is rehearsing a very confident answer.`,
    ""
  );
  updateHeadline("House briefing: spinning up three synchronized nonsense engines.");
  renderStats({ balanceFrom: previousBalance, animateBalance: true });
  nudgeDevice([15, 25, 15]);

  const result = await Promise.all(
    reelEls.map((_, index) => animateReel(index, 780 + index * 260))
  );

  const outcome = evaluateSpin(result, bet);
  const balanceBeforePayout = state.balance;

  state.balance += outcome.payout;
  state.lastPayout = outcome.payout;
  state.streak = outcome.payout > 0 ? state.streak + 1 : 0;
  state.bestWin = Math.max(state.bestWin, outcome.payout);

  addFeed(outcome.payout > 0 ? "Win Log" : "Loss Log", outcome.log);
  updateMessage(outcome.message, outcome.tone);
  updateHeadline(outcome.headline);
  setWinningFrames(outcome, result);
  renderFeed();
  renderStats({ balanceFrom: balanceBeforePayout, animateBalance: true });

  playOutcomeSound(outcome);

  if (outcome.payout > 0) {
    nudgeDevice([20, 50, 20, 70, 30]);
    flashSurface(
      [
        { boxShadow: "0 28px 90px rgba(0, 0, 0, 0.42)" },
        { boxShadow: "0 30px 110px rgba(247, 179, 76, 0.28)" },
        { boxShadow: "0 28px 90px rgba(0, 0, 0, 0.42)" }
      ],
      {
        duration: 480,
        easing: "ease-out"
      }
    );
  } else {
    flashSurface(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(4px)" },
        { transform: "translateX(0)" }
      ],
      {
        duration: 260,
        easing: "ease-out"
      }
    );
  }

  spinning = false;
  renderStats();
}

function resetGame() {
  if (spinning) {
    return;
  }

  const previousBalance = state.balance;

  spinning = false;
  state = {
    ...startingState,
    history: [...defaultFeed]
  };
  currentSymbols = [symbols[0], symbols[6], symbols[5]];

  currentSymbols.forEach((symbol, index) => updateReel(index, symbol));
  reelFrames.forEach((frame) => frame.classList.remove("is-winning"));

  updateMessage(
    "Wallet refilled. The machine is rested, rebranded, and ready to oversell again."
  );
  updateHeadline("Model mood: freshly capitalized and emotionally detached.");
  renderFeed();
  renderStats({ balanceFrom: previousBalance, animateBalance: true });
  nudgeDevice([18]);
}

betButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setBet(Number(button.dataset.bet));
  });
});

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

currentSymbols.forEach((symbol, index) => updateReel(index, symbol));
renderFeed();
renderStats();
updateMessage("The floor is open. Please gamble responsibly with fake AI money.");
updateHeadline("Model mood: cautiously profitable nonsense.");
