/*
  File: script.js
  Purpose: Runs the Token Tilter 3000 slot machine, manages the token economy,
  coordinates sound effects, and updates the live activity feed.
  Notes: The logic is organized around small helpers so the satirical copy,
  gameplay rules, and platform-API audio behavior stay easy to extend.
*/

// Each symbol is encoded with Unicode escapes so the slot machine stays
// readable even in environments that do not render emoji consistently.
const symbols = [
  "\u{1FA99}",
  "\u{1F916}",
  "\u{1F4C8}",
  "\u{1F9E0}",
  "\u{1F525}",
  "\u{1F9FE}"
];

const state = {
  balance: 1200,
  baseSpinCost: 90,
  jackpot: 1500,
  isSpinning: false,
  boostMode: false,
  soundEnabled: true
};

const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2")
];

const tokenBalance = document.getElementById("tokenBalance");
const spinCost = document.getElementById("spinCost");
const jackpotValue = document.getElementById("jackpotValue");
const message = document.getElementById("message");
const eventFeed = document.getElementById("eventFeed");
const feedItemTemplate = document.getElementById("feedItemTemplate");
const spinButton = document.getElementById("spinButton");
const boostButton = document.getElementById("boostButton");
const soundToggle = document.getElementById("soundToggle");

// Track the visible reel positions so each reel advances in sequence.
const reelPositions = [1, 0, 2];

const quips = {
  nearMiss: [
    "Two matching reels. The AI says that counts as 94% accurate.",
    "You almost won, which is how enterprise pricing gets justified.",
    "So close. A dashboard will still describe this as exceptional throughput."
  ],
  noMatch: [
    "No match. Somewhere a chatbot called this an edge case.",
    "That spin burned tokens faster than a team adding agents to a slide deck.",
    "The model hallucinated a jackpot and invoiced you for confidence."
  ],
  broke: [
    "Wallet empty. Time to pivot into consulting about responsible token usage.",
    "You are out of tokens, but rich in learnings and vague product vision.",
    "Bankrupt. Finance suggests calling the loss a strategic retraining cycle."
  ]
};

let audioContext;

/**
 * Returns the current price of a spin based on whether premium mode is active.
 *
 * @returns {number} The token cost for the next spin.
 */
function currentSpinCost() {
  return state.boostMode ? state.baseSpinCost + 60 : state.baseSpinCost;
}

/**
 * Formats token values for display in the UI.
 *
 * @param {number} value - The raw token amount.
 * @returns {string} A locale-aware formatted token string.
 */
function formatTokens(value) {
  return value.toLocaleString();
}

/**
 * Updates the main game message and optional result styling.
 *
 * @param {string} text - The message shown to the player.
 * @param {string} [tone=""] - Optional visual tone modifier such as "win" or "loss".
 * @returns {void}
 */
function setMessage(text, tone = "") {
  message.textContent = text;
  message.className = `message ${tone}`.trim();
}

/**
 * Adds a new item to the live activity feed and prunes older entries.
 *
 * @param {string} text - Safe HTML content for the feed item.
 * @returns {void}
 */
function addFeedEntry(text) {
  const item = feedItemTemplate.content.firstElementChild.cloneNode(true);
  item.innerHTML = text;
  eventFeed.prepend(item);

  while (eventFeed.children.length > 7) {
    eventFeed.lastElementChild.remove();
  }
}

/**
 * Refreshes the dashboard, premium toggle label, and sound toggle state.
 *
 * @returns {void}
 */
function updateDisplay() {
  tokenBalance.textContent = formatTokens(state.balance);
  spinCost.textContent = formatTokens(currentSpinCost());
  jackpotValue.textContent = formatTokens(state.jackpot);
  boostButton.textContent = state.boostMode ? 'Disable "Pro" Spin' : 'Buy "Pro" Spin';
  soundToggle.textContent = state.soundEnabled ? "Sound On" : "Sound Off";
  soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
}

/**
 * Advances a single reel to the next symbol in its loop.
 *
 * @param {number} index - The reel index to advance.
 * @returns {void}
 */
function advanceReel(index) {
  reelPositions[index] = (reelPositions[index] + 1) % symbols.length;
  reels[index].textContent = symbols[reelPositions[index]];
}

/**
 * Selects a random quip from a provided list.
 *
 * @param {string[]} entries - Candidate strings.
 * @returns {string} A randomly selected entry.
 */
function randomFrom(entries) {
  return entries[Math.floor(Math.random() * entries.length)];
}

/**
 * Calculates the payout and result message for a finished spin.
 *
 * @param {string[]} result - The final symbol shown on each reel.
 * @returns {{payout:number,tone:string,text:string,kind:string}} The scored outcome.
 */
function scoreSpin(result) {
  const counts = result.reduce((accumulator, symbol) => {
    accumulator[symbol] = (accumulator[symbol] || 0) + 1;
    return accumulator;
  }, {});

  const values = Object.values(counts).sort((left, right) => right - left);
  const isThreeMatch = values[0] === 3;
  const isTwoMatch = values[0] === 2;

  if (isThreeMatch) {
    const [symbol] = Object.keys(counts);

    if (symbol === symbols[0]) {
      return {
        payout: state.jackpot,
        tone: "win",
        text: "Triple coins. Congratulations, the casino accidentally respected your budget.",
        kind: "jackpot"
      };
    }

    if (symbol === symbols[1]) {
      return {
        payout: 650,
        tone: "win",
        text: "Three robots. The board calls this fully autonomous revenue.",
        kind: "win"
      };
    }

    if (symbol === symbols[2]) {
      return {
        payout: 400,
        tone: "win",
        text: "Triple charts. Nobody knows why the graph is up, but tokens are flowing.",
        kind: "win"
      };
    }

    return {
      payout: 250,
      tone: "win",
      text: "Three of a kind. A keynote presenter just used the word disruption.",
      kind: "win"
    };
  }

  if (isTwoMatch) {
    return {
      payout: 0,
      tone: "loss",
      text: randomFrom(quips.nearMiss),
      kind: "nearMiss"
    };
  }

  return {
    payout: 0,
    tone: "loss",
    text: randomFrom(quips.noMatch),
    kind: "loss"
  };
}

/**
 * Enables or disables the main interactive controls during a spin.
 *
 * @param {boolean} disabled - Whether the buttons should be disabled.
 * @returns {void}
 */
function setControlsDisabled(disabled) {
  spinButton.disabled = disabled;
  boostButton.disabled = disabled;
}

/**
 * Lazily creates the shared Web Audio context used for synthesized effects.
 *
 * @returns {AudioContext|null} The audio context when supported, otherwise null.
 */
function ensureAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const ContextConstructor = window.AudioContext || window.webkitAudioContext;
    audioContext = new ContextConstructor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {
      // Browsers can reject resume until they consider the interaction trusted.
    });
  }

  return audioContext;
}

/**
 * Plays a short synthesized tone using the Web Audio API.
 *
 * @param {{frequency:number,duration:number,type?:OscillatorType,gain?:number,delay?:number}} config - Tone settings.
 * @returns {void}
 */
function playTone(config) {
  if (!state.soundEnabled) {
    return;
  }

  const context = ensureAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + (config.delay || 0);
  const endTime = startTime + config.duration;

  oscillator.type = config.type || "sine";
  oscillator.frequency.setValueAtTime(config.frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(config.gain || 0.06, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

/**
 * Plays the clicky spin-start effect for a new round.
 *
 * @returns {void}
 */
function playSpinStartSound() {
  [220, 330, 440].forEach((frequency, index) => {
    playTone({
      frequency,
      duration: 0.08,
      type: "square",
      gain: 0.045,
      delay: index * 0.045
    });
  });
}

/**
 * Plays the reel stop effect for an individual reel.
 *
 * @param {number} index - The zero-based reel index that has stopped.
 * @returns {void}
 */
function playReelStopSound(index) {
  playTone({
    frequency: 260 + index * 70,
    duration: 0.1,
    type: "triangle",
    gain: 0.035
  });
}

/**
 * Plays the outcome sound for the completed spin.
 *
 * @param {"jackpot"|"win"|"nearMiss"|"loss"} kind - The outcome category to sonify.
 * @returns {void}
 */
function playOutcomeSound(kind) {
  if (kind === "jackpot") {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      playTone({
        frequency,
        duration: 0.22,
        type: "triangle",
        gain: 0.065,
        delay: index * 0.09
      });
    });
    return;
  }

  if (kind === "win") {
    [440, 554.37, 659.25].forEach((frequency, index) => {
      playTone({
        frequency,
        duration: 0.16,
        type: "sine",
        gain: 0.05,
        delay: index * 0.07
      });
    });
    return;
  }

  if (kind === "nearMiss") {
    [392, 349.23].forEach((frequency, index) => {
      playTone({
        frequency,
        duration: 0.12,
        type: "sawtooth",
        gain: 0.028,
        delay: index * 0.08
      });
    });
    return;
  }

  playTone({
    frequency: 196,
    duration: 0.18,
    type: "sawtooth",
    gain: 0.03
  });
}

/**
 * Spins a single reel for a fixed number of steps before settling on a symbol.
 *
 * @param {number} index - The reel index to animate.
 * @param {number} steps - The number of symbol advances to perform.
 * @param {number} delay - Milliseconds between advances.
 * @returns {Promise<string>} The symbol shown when the reel stops.
 */
function spinReel(index, steps, delay) {
  return new Promise((resolve) => {
    let remainingSteps = steps;
    const interval = window.setInterval(() => {
      advanceReel(index);
      remainingSteps -= 1;

      if (remainingSteps <= 0) {
        window.clearInterval(interval);
        reels[index].classList.remove("spinning");
        playReelStopSound(index);
        resolve(reels[index].textContent);
      }
    }, delay);
  });
}

/**
 * Runs a complete spin, including balance updates, reel animation, feed updates,
 * and sound playback.
 *
 * @returns {Promise<void>}
 */
async function spin() {
  const cost = currentSpinCost();

  if (state.isSpinning) {
    return;
  }

  if (state.balance < cost) {
    setMessage(randomFrom(quips.broke), "loss");
    addFeedEntry("<strong>Billing Update:</strong> insufficient tokens for another act of courage.");
    playOutcomeSound("loss");
    return;
  }

  ensureAudioContext();

  state.isSpinning = true;
  state.balance -= cost;
  updateDisplay();
  setControlsDisabled(true);
  setMessage("Spinning... please wait while the model monetizes suspense.");
  addFeedEntry(
    `<strong>Spin Started:</strong> burned <strong>${formatTokens(cost)}</strong> tokens to interrogate the revenue engine.`
  );
  playSpinStartSound();

  reels.forEach((reel) => reel.classList.add("spinning"));
  const result = await Promise.all(
    reels.map((_, index) => spinReel(index, 16 + index * 7, 70 + index * 10))
  );

  const outcome = scoreSpin(result);
  state.balance += outcome.payout;

  if (outcome.kind === "jackpot") {
    state.jackpot += 250;
  }

  if (state.boostMode) {
    state.jackpot += 50;
  }

  setMessage(outcome.text, outcome.tone);
  updateDisplay();
  addFeedEntry(
    `<strong>${result.join(" ")}</strong> paid <strong>${formatTokens(outcome.payout)}</strong> tokens. ${outcome.text}`
  );
  playOutcomeSound(outcome.kind);

  setControlsDisabled(false);
  state.isSpinning = false;
}

/**
 * Toggles the premium spin mode and records the change in the activity feed.
 *
 * @returns {void}
 */
function toggleBoost() {
  if (state.isSpinning) {
    return;
  }

  state.boostMode = !state.boostMode;
  setMessage(
    state.boostMode
      ? 'Pro spin enabled. Costs more, sounds smarter, and reassures management.'
      : "Pro spin disabled. Back to regular-grade speculative computing."
  );
  addFeedEntry(
    state.boostMode
      ? '<strong>Monetization:</strong> "Pro" mode enabled for premium confidence.'
      : "<strong>Monetization:</strong> reverted to baseline token combustion."
  );
  playTone({
    frequency: state.boostMode ? 620 : 280,
    duration: 0.14,
    type: state.boostMode ? "triangle" : "square",
    gain: 0.04
  });
  updateDisplay();
}

/**
 * Toggles synthesized game sound effects on or off.
 *
 * @returns {void}
 */
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  updateDisplay();
  setMessage(
    state.soundEnabled
      ? "Sound restored. The casino may now chirp at your budget again."
      : "Sound muted. The tokens still disappear, just more respectfully."
  );
  addFeedEntry(
    state.soundEnabled
      ? "<strong>Audio:</strong> reactive casino noises re-enabled."
      : "<strong>Audio:</strong> muted the synthetic celebration layer."
  );

  if (state.soundEnabled) {
    playTone({
      frequency: 510,
      duration: 0.1,
      type: "triangle",
      gain: 0.045
    });
  }
}

/**
 * Initializes the UI, binds event handlers, and seeds the opening feed entries.
 *
 * @returns {void}
 */
function initializeGame() {
  reels.forEach((reel, index) => {
    reel.textContent = symbols[reelPositions[index]];
  });

  spinButton.addEventListener("click", spin);
  boostButton.addEventListener("click", toggleBoost);
  soundToggle.addEventListener("click", toggleSound);

  addFeedEntry("<strong>Launch:</strong> Token Tilter 3000 is live and fiscally irresponsible.");
  addFeedEntry("<strong>Advice:</strong> if you win big, call it emergent intelligence.");
  updateDisplay();
}

initializeGame();
