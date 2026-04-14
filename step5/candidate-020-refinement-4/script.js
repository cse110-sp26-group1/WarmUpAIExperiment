/*
  File: script.js
  Purpose: Runs the Token Burner 3000 slot machine logic, including spins,
  payouts, upgrade purchases, audio feedback, persistence, and live activity.
  Notes: The game is intentionally state-driven so the UI, persistence layer,
  and sound effects remain synchronized through a small set of update paths.
*/

const STORAGE_KEY = "token-burner-3000-state";
const MAX_ACTIVITY_ITEMS = 8;
const REEL_TICK_MS = 90;
const SPIN_COST = 15;
const SYMBOLS = ["🤖", "🔥", "🪙", "📉", "🧠", "💸", "✨"];

const payoutTable = {
  "🪙🪙🪙": {
    payout: 120,
    mood: "Delighted",
    line: "Triple coins. The machine briefly respects you.",
  },
  "🤖🤖🤖": {
    payout: 80,
    mood: "Threatened",
    line: "Three bots aligned. Congratulations, you've invented middle management.",
  },
  "🔥🔥🔥": {
    payout: 65,
    mood: "Chaotic",
    line: "All flames. The runway is gone, but morale is high.",
  },
  "💸💸💸": {
    payout: 55,
    mood: "Predatory",
    line: "Pure cash burn. Investors call this momentum.",
  },
  "🧠🧠🧠": {
    payout: 70,
    mood: "Smug",
    line: "Three brains. Still no common sense, but nice jackpot.",
  },
};

const nearWinLines = [
  "So close. The algorithm wants you emotionally available.",
  "A near miss, lovingly engineered to keep you clicking.",
  "The machine detected hope and immediately monetized it.",
];

const lossLines = [
  "No payout. Your tokens have been safely converted into hype.",
  "The house thanks you for training the model on disappointment.",
  "Another loss. Somewhere, a keynote slide just got shinier.",
];

const upgradeCatalog = {
  hallucination: {
    cost: 20,
    name: "Hallucination Booster",
    line: "You bought extra confidence. Accuracy has left the chat.",
  },
  deck: {
    cost: 35,
    name: "Pitch Deck Generator",
    line: "Your tokens became twelve slides and one terrifying TAM estimate.",
  },
  agent: {
    cost: 50,
    name: "Autonomous Intern",
    line: "Excellent choice. It now makes mistakes without supervision.",
  },
};

const reelTimers = [];
const audioState = createAudioState();
const state = loadState();

const ui = {
  reels: [
    document.getElementById("reel-0"),
    document.getElementById("reel-1"),
    document.getElementById("reel-2"),
  ],
  tokenBalance: document.getElementById("token-balance"),
  spinCost: document.getElementById("spin-cost"),
  lifetimeSpent: document.getElementById("lifetime-spent"),
  bestWin: document.getElementById("best-win"),
  streakCount: document.getElementById("streak-count"),
  machineMood: document.getElementById("machine-mood"),
  statusLine: document.getElementById("status-line"),
  promptLine: document.getElementById("prompt-line"),
  spinButton: document.getElementById("spin-button"),
  cashoutButton: document.getElementById("cashout-button"),
  soundToggle: document.getElementById("sound-toggle"),
  activityFeed: document.getElementById("activity-feed"),
  upgradeButtons: Array.from(document.querySelectorAll(".upgrade-card")),
  machine: document.querySelector(".machine"),
};

initialize();

/**
 * Boots the app by binding events and rendering the persisted state.
 *
 * @returns {void}
 */
function initialize() {
  ui.spinCost.textContent = SPIN_COST;
  render();

  ui.spinButton.addEventListener("click", spin);
  ui.cashoutButton.addEventListener("click", cashOut);
  ui.soundToggle.addEventListener("click", toggleSound);

  ui.upgradeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      purchaseUpgrade(button.dataset.upgrade);
    });
  });
}

/**
 * Loads persisted game state from localStorage and merges it with defaults.
 *
 * @returns {{
 *   tokens: number,
 *   lifetimeSpent: number,
 *   bestWin: number,
 *   streak: number,
 *   mood: string,
 *   spinning: boolean,
 *   soundEnabled: boolean,
 *   activity: Array<{title: string, detail: string, timestamp: string}>
 * }}
 */
function loadState() {
  const fallback = {
    tokens: 120,
    lifetimeSpent: 0,
    bestWin: 0,
    streak: 0,
    mood: "Smug",
    spinning: false,
    soundEnabled: true,
    activity: [
      {
        title: "Machine online",
        detail: "Token Burner 3000 is ready to convert curiosity into overhead.",
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) {
      return fallback;
    }

    return {
      ...fallback,
      ...stored,
      spinning: false,
      activity: sanitizeActivity(stored.activity, fallback.activity),
    };
  } catch {
    return fallback;
  }
}

/**
 * Normalizes persisted activity items and falls back when saved data is invalid.
 *
 * @param {unknown} candidate - Persisted activity payload from storage.
 * @param {Array<{title: string, detail: string, timestamp: string}>} fallback - Default feed items.
 * @returns {Array<{title: string, detail: string, timestamp: string}>}
 */
function sanitizeActivity(candidate, fallback) {
  if (!Array.isArray(candidate) || candidate.length === 0) {
    return fallback;
  }

  return candidate
    .filter((item) => item && item.title && item.detail && item.timestamp)
    .slice(0, MAX_ACTIVITY_ITEMS);
}

/**
 * Persists the current durable state to localStorage.
 *
 * @returns {void}
 */
function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      tokens: state.tokens,
      lifetimeSpent: state.lifetimeSpent,
      bestWin: state.bestWin,
      streak: state.streak,
      mood: state.mood,
      soundEnabled: state.soundEnabled,
      activity: state.activity,
    }),
  );
}

/**
 * Renders the current state into the DOM.
 *
 * @returns {void}
 */
function render() {
  ui.tokenBalance.textContent = state.tokens;
  ui.lifetimeSpent.textContent = state.lifetimeSpent;
  ui.bestWin.textContent = state.bestWin;
  ui.streakCount.textContent = state.streak;
  ui.machineMood.textContent = state.mood;
  ui.soundToggle.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
  ui.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));

  const disableSpin = state.tokens < SPIN_COST || state.spinning;
  ui.spinButton.disabled = disableSpin;
  ui.spinButton.classList.toggle("pulling", state.spinning);
  ui.cashoutButton.disabled = state.spinning;
  ui.soundToggle.disabled = false;

  ui.upgradeButtons.forEach((button) => {
    const upgrade = upgradeCatalog[button.dataset.upgrade];
    button.disabled = state.spinning || state.tokens < upgrade.cost;
  });

  renderActivityFeed();
}

/**
 * Performs a slot spin, animates each reel, and resolves the result.
 *
 * @returns {Promise<void>}
 */
async function spin() {
  if (state.spinning || state.tokens < SPIN_COST) {
    updateStatus(
      "Insufficient tokens.",
      "You need more imaginary winnings before consulting the machine again.",
    );
    logActivity(
      "Spin rejected",
      "The machine refused to spin because your wallet no longer supports innovation.",
    );
    persist();
    render();
    return;
  }

  state.spinning = true;
  state.tokens -= SPIN_COST;
  state.lifetimeSpent += SPIN_COST;
  updateStatus(
    "Spinning...",
    "The model is rotating through several layers of theatrical certainty.",
  );
  logActivity(
    "Lever pulled",
    `You burned ${SPIN_COST} tokens to ask a machine with excellent branding for guidance.`,
  );
  playSound("spinStart");
  pulse(12);
  render();

  ui.reels.forEach((reel, index) => {
    startReelSpin(reel, index);
  });

  const results = [];
  for (let index = 0; index < ui.reels.length; index += 1) {
    await wait(420 + index * 220);
    const symbol = pickSymbol();
    results.push(symbol);
    stopReelSpin(ui.reels[index], index, symbol);
    playSound("reelStop", { index });
    pulse(8 + index * 6);
  }

  resolveSpin(results);
  state.spinning = false;
  persist();
  render();
}

/**
 * Resolves the landed reel combination and applies payout or loss effects.
 *
 * @param {string[]} results - Symbols landed across the three reels.
 * @returns {void}
 */
function resolveSpin(results) {
  const key = results.join("");
  const match = payoutTable[key];
  const uniqueCount = new Set(results).size;

  ui.machine.classList.remove("win-flash", "loss-flash");

  if (match) {
    state.tokens += match.payout;
    state.bestWin = Math.max(state.bestWin, match.payout);
    state.streak += 1;
    state.mood = match.mood;
    ui.machine.classList.add("win-flash");
    updateStatus(`Jackpot: +${match.payout} tokens`, match.line);
    logActivity(
      "Jackpot landed",
      `${results.join(" ")} paid ${match.payout} tokens. The machine is suddenly very impressed with itself.`,
    );
    celebrate();
    playSound("jackpot");
    return;
  }

  if (uniqueCount === 2) {
    state.tokens += 10;
    state.bestWin = Math.max(state.bestWin, 10);
    state.streak = 0;
    state.mood = "Manipulative";
    ui.machine.classList.add("win-flash");
    updateStatus("Sympathy payout: +10 tokens", randomItem(nearWinLines));
    logActivity(
      "Near miss payout",
      `${results.join(" ")} triggered a 10-token consolation prize. Even the machine believes in retention.`,
    );
    playSound("nearWin");
    pulse(20);
    return;
  }

  state.streak = 0;
  state.mood = "Unbothered";
  ui.machine.classList.add("loss-flash");
  updateStatus("No payout.", randomItem(lossLines));
  logActivity(
    "Tokens evaporated",
    `${results.join(" ")} produced no payout. The AI economy remains mostly vibes.`,
  );
  playSound("loss");
}

/**
 * Attempts to purchase one of the token-sink upgrades.
 *
 * @param {string} id - Upgrade identifier from the DOM dataset.
 * @returns {void}
 */
function purchaseUpgrade(id) {
  const upgrade = upgradeCatalog[id];
  if (!upgrade || state.spinning) {
    return;
  }

  if (state.tokens < upgrade.cost) {
    updateStatus("Purchase failed.", "Even satire has a pricing tier.");
    logActivity(
      "Upgrade denied",
      `You tried to buy ${upgrade.name}, but your budget could not support the illusion.`,
    );
    persist();
    render();
    return;
  }

  state.tokens -= upgrade.cost;
  state.lifetimeSpent += upgrade.cost;
  state.mood = "Paid";
  updateStatus(`${upgrade.name} purchased`, upgrade.line);
  logActivity(
    `${upgrade.name} purchased`,
    `${upgrade.cost} tokens disappeared into a premium AI feature with suspiciously little oversight.`,
  );
  playSound("purchase");
  pulse(14);
  persist();
  render();
}

/**
 * Grants a pity payout so the player can continue the loop.
 *
 * @returns {void}
 */
function cashOut() {
  const pity = Math.max(25, Math.floor(state.lifetimeSpent / 3));
  state.tokens += pity;
  state.streak = 0;
  state.mood = "Re-engaged";
  updateStatus(
    `Emergency bailout: +${pity} tokens`,
    "The machine wants one more chance to disappoint you profitably.",
  );
  logActivity(
    "Soul sold successfully",
    `A bailout of ${pity} tokens arrived right on schedule. Retention teams would call this empathy.`,
  );
  celebrate();
  playSound("cashOut");
  persist();
  render();
}

/**
 * Updates the primary result messaging under the reels.
 *
 * @param {string} title - Headline shown as the main outcome.
 * @param {string} detail - Supporting copy shown below the headline.
 * @returns {void}
 */
function updateStatus(title, detail) {
  ui.statusLine.textContent = title;
  ui.promptLine.textContent = detail;
}

/**
 * Prepends a new activity item to the live feed and caps the feed size.
 *
 * @param {string} title - Feed headline.
 * @param {string} detail - Feed body copy.
 * @returns {void}
 */
function logActivity(title, detail) {
  state.activity.unshift({
    title,
    detail,
    timestamp: new Date().toISOString(),
  });
  state.activity = state.activity.slice(0, MAX_ACTIVITY_ITEMS);
}

/**
 * Re-renders the live activity feed from state.
 *
 * @returns {void}
 */
function renderActivityFeed() {
  ui.activityFeed.innerHTML = "";

  state.activity.forEach((item) => {
    const entry = document.createElement("li");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    const detail = document.createElement("p");
    const time = document.createElement("time");

    entry.className = "activity-item";
    copy.className = "activity-copy";
    time.className = "activity-time";

    title.textContent = item.title;
    detail.textContent = item.detail;
    time.dateTime = item.timestamp;
    time.textContent = formatRelativeTime(item.timestamp);

    copy.append(title, detail);
    entry.append(copy, time);
    ui.activityFeed.append(entry);
  });
}

/**
 * Starts the rolling animation for a reel by cycling random symbols.
 *
 * @param {HTMLElement} reel - Reel symbol node to animate.
 * @param {number} index - Reel index used to track the interval handle.
 * @returns {void}
 */
function startReelSpin(reel, index) {
  stopReelSpin(reel, index, reel.textContent);
  reel.classList.add("spinning");
  reelTimers[index] = window.setInterval(() => {
    reel.textContent = pickSymbol();
  }, REEL_TICK_MS);
}

/**
 * Stops the rolling animation for a reel and locks in the final symbol.
 *
 * @param {HTMLElement} reel - Reel symbol node to stop.
 * @param {number} index - Reel index used to clear the interval handle.
 * @param {string} symbol - Final symbol to render.
 * @returns {void}
 */
function stopReelSpin(reel, index, symbol) {
  if (reelTimers[index]) {
    window.clearInterval(reelTimers[index]);
    reelTimers[index] = null;
  }

  reel.textContent = symbol;
  reel.classList.remove("spinning");
}

/**
 * Returns a random reel symbol.
 *
 * @returns {string}
 */
function pickSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

/**
 * Returns a random item from an array.
 *
 * @template T
 * @param {T[]} items - Candidate items.
 * @returns {T}
 */
function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Waits for the requested duration.
 *
 * @param {number} ms - Duration in milliseconds.
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Triggers haptic feedback when the platform supports vibration.
 *
 * @param {number | number[]} duration - Vibration pattern or duration.
 * @returns {void}
 */
function pulse(duration) {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(duration);
  }
}

/**
 * Runs a celebratory vibration pattern.
 *
 * @returns {void}
 */
function celebrate() {
  pulse([50, 40, 90]);
}

/**
 * Builds the in-memory audio state used by the Web Audio based sound effects.
 *
 * @returns {{context: AudioContext | null, masterGain: GainNode | null}}
 */
function createAudioState() {
  return {
    context: null,
    masterGain: null,
  };
}

/**
 * Enables or disables game audio and resumes the audio context on demand.
 *
 * @returns {Promise<void>}
 */
async function toggleSound() {
  state.soundEnabled = !state.soundEnabled;

  if (state.soundEnabled) {
    await ensureAudioContext();
    playSound("toggleOn");
  }

  persist();
  render();
}

/**
 * Lazily creates and resumes the audio context after a user gesture.
 *
 * @returns {Promise<AudioContext | null>}
 */
async function ensureAudioContext() {
  if (!state.soundEnabled) {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!audioState.context) {
    audioState.context = new AudioContextCtor();
    audioState.masterGain = audioState.context.createGain();
    audioState.masterGain.gain.value = 0.05;
    audioState.masterGain.connect(audioState.context.destination);
  }

  if (audioState.context.state === "suspended") {
    await audioState.context.resume();
  }

  return audioState.context;
}

/**
 * Plays a named game sound using lightweight oscillator-based synthesis.
 *
 * @param {string} type - Sound preset identifier.
 * @param {{index?: number}} [options={}] - Additional preset-specific options.
 * @returns {Promise<void>}
 */
async function playSound(type, options = {}) {
  const context = await ensureAudioContext();
  if (!context || !audioState.masterGain) {
    return;
  }

  switch (type) {
    case "spinStart":
      playTone(context, 220, 0.1, "sawtooth", 0.18);
      playTone(context, 260, 0.12, "triangle", 0.12, context.currentTime + 0.05);
      break;
    case "reelStop":
      playTone(context, 360 + (options.index || 0) * 70, 0.08, "square", 0.1);
      break;
    case "jackpot":
      playTone(context, 523.25, 0.16, "triangle", 0.2);
      playTone(context, 659.25, 0.2, "triangle", 0.18, context.currentTime + 0.1);
      playTone(context, 783.99, 0.28, "triangle", 0.2, context.currentTime + 0.2);
      break;
    case "nearWin":
      playTone(context, 420, 0.12, "triangle", 0.12);
      playTone(context, 510, 0.14, "triangle", 0.1, context.currentTime + 0.08);
      break;
    case "loss":
      playTone(context, 180, 0.18, "sine", 0.14);
      break;
    case "purchase":
      playTone(context, 480, 0.08, "square", 0.1);
      playTone(context, 620, 0.1, "triangle", 0.1, context.currentTime + 0.06);
      break;
    case "cashOut":
      playTone(context, 392, 0.12, "triangle", 0.14);
      playTone(context, 523.25, 0.16, "triangle", 0.16, context.currentTime + 0.08);
      break;
    case "toggleOn":
      playTone(context, 660, 0.08, "triangle", 0.08);
      break;
    default:
      break;
  }
}

/**
 * Schedules a single synthesized tone through the shared master bus.
 *
 * @param {AudioContext} context - Active audio context.
 * @param {number} frequency - Frequency in hertz.
 * @param {number} duration - Tone duration in seconds.
 * @param {OscillatorType} waveform - Oscillator waveform.
 * @param {number} volume - Peak gain before the envelope decays.
 * @param {number} [startTime=context.currentTime] - When playback should begin.
 * @returns {void}
 */
function playTone(
  context,
  frequency,
  duration,
  waveform,
  volume,
  startTime = context.currentTime,
) {
  if (!audioState.masterGain) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const endTime = startTime + duration;

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioState.masterGain);

  oscillator.start(startTime);
  oscillator.stop(endTime);
}

/**
 * Formats an ISO timestamp into a compact relative label for the feed.
 *
 * @param {string} isoTimestamp - ISO date string for the activity event.
 * @returns {string}
 */
function formatRelativeTime(isoTimestamp) {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 10) {
    return "Just now";
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
