const symbols = [
  { icon: "🤖", name: "Model", value: 90 },
  { icon: "🪙", name: "Token", value: 60 },
  { icon: "🧾", name: "Invoice", value: 45 },
  { icon: "🧠", name: "Prompt", value: 35 },
  { icon: "🔥", name: "GPU", value: 30 },
  { icon: "🙃", name: "Hallucination", value: 10 },
];

const roastLines = {
  triple: [
    "Three of a kind. Investors call this product-market fit.",
    "Jackpot. The AI has successfully monetized autocomplete.",
    "Perfect alignment achieved for several legally non-binding seconds.",
  ],
  pair: [
    "Two matched. That counts as a benchmark in this sector.",
    "A pair. Enough confidence to ship, not enough to verify.",
    "Respectable output. Nobody asked where the training data came from.",
  ],
  loss: [
    "No match. The model consumed your budget and generated vibes.",
    "Another miss. Please upgrade to Premium Delusion Plus.",
    "Loss detected. Finance has rebranded it as aggressive inference.",
  ],
};

const balanceEl = document.querySelector("#balance");
const costEl = document.querySelector("#cost");
const bestWinEl = document.querySelector("#best-win");
const betRangeEl = document.querySelector("#bet-range");
const spinButtonEl = document.querySelector("#spin-button");
const resetButtonEl = document.querySelector("#reset-button");
const soundToggleEl = document.querySelector("#sound-toggle");
const historyEl = document.querySelector("#history");
const statusEl = document.querySelector("#status");
const marqueeEl = document.querySelector("#marquee");
const reelEls = Array.from(document.querySelectorAll(".reel"));

const state = {
  balance: 120,
  cost: 15,
  bestWin: 0,
  spinning: false,
  soundEnabled: true,
  audioContext: null,
};

function updateScoreboard() {
  balanceEl.textContent = state.balance;
  costEl.textContent = state.cost;
  bestWinEl.textContent = state.bestWin;
  spinButtonEl.disabled = state.spinning || state.balance < state.cost;
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function pickRoast(type) {
  const lines = roastLines[type];
  return lines[Math.floor(Math.random() * lines.length)];
}

function setStatus(message) {
  statusEl.textContent = message;
  marqueeEl.textContent = message;
}

function addHistory(message, payout) {
  const item = document.createElement("li");
  const label = payout > 0 ? `+${payout}` : `${payout}`;
  item.innerHTML = `<strong>${label} tokens</strong> ${message}`;
  historyEl.prepend(item);

  while (historyEl.children.length > 6) {
    historyEl.removeChild(historyEl.lastChild);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAudioContext() {
  if (!state.soundEnabled) {
    return null;
  }

  if (!state.audioContext) {
    state.audioContext = new window.AudioContext();
  }

  return state.audioContext;
}

function beep(frequency, duration, type = "square", gainValue = 0.03) {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + duration / 1000);
}

function evaluateSpin(result) {
  const [a, b, c] = result;
  const icons = result.map((symbol) => symbol.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});
  const maxCount = Math.max(...Object.values(counts));

  if (maxCount === 3) {
    return {
      payout: a.value,
      type: "triple",
      message: `${pickRoast("triple")} ${a.name} loop engaged.`,
    };
  }

  if (maxCount === 2) {
    return {
      payout: 20,
      type: "pair",
      message: `${pickRoast("pair")} Pair detected in ${icons.join(" ")}.`,
    };
  }

  return {
    payout: 0,
    type: "loss",
    message: `${pickRoast("loss")} Reels showed ${icons.join(" ")}.`,
  };
}

async function animateReels(finalResult) {
  reelEls.forEach((reel) => {
    reel.classList.remove("win");
    reel.classList.add("spinning");
  });

  for (let step = 0; step < 10; step += 1) {
    reelEls.forEach((reel) => {
      reel.textContent = randomSymbol().icon;
    });

    beep(260 + step * 25, 70, "square");
    await sleep(90);
  }

  for (let index = 0; index < reelEls.length; index += 1) {
    reelEls[index].textContent = finalResult[index].icon;
    beep(420 + index * 90, 110, "triangle", 0.04);
    await sleep(180);
  }

  reelEls.forEach((reel) => reel.classList.remove("spinning"));
}

async function handleSpin() {
  if (state.spinning || state.balance < state.cost) {
    return;
  }

  state.spinning = true;
  state.balance -= state.cost;
  updateScoreboard();
  setStatus("Charging your card for experimental intelligence...");

  const result = [randomSymbol(), randomSymbol(), randomSymbol()];
  await animateReels(result);

  const outcome = evaluateSpin(result);
  state.balance += outcome.payout;
  state.bestWin = Math.max(state.bestWin, outcome.payout);

  if (outcome.payout > 0) {
    reelEls.forEach((reel) => reel.classList.add("win"));
    beep(740, 120, "sine", 0.05);
    beep(940, 180, "sine", 0.04);
  } else {
    beep(180, 220, "sawtooth", 0.035);
  }

  setStatus(outcome.message);
  addHistory(outcome.message, outcome.payout - state.cost);
  state.spinning = false;
  updateScoreboard();
}

function handleReset() {
  state.balance = 120;
  state.cost = 15;
  state.bestWin = 0;
  state.spinning = false;
  betRangeEl.value = String(state.cost);
  historyEl.innerHTML = "";
  reelEls.forEach((reel, index) => {
    reel.textContent = symbols[index].icon;
    reel.classList.remove("win", "spinning");
  });
  setStatus("Fresh tokens loaded. Ethics still unavailable.");
  updateScoreboard();
}

betRangeEl.addEventListener("input", () => {
  state.cost = Number(betRangeEl.value);
  updateScoreboard();
  setStatus(`Spin cost updated to ${state.cost} tokens. Confidence increased without evidence.`);
});

spinButtonEl.addEventListener("click", handleSpin);
resetButtonEl.addEventListener("click", handleReset);

soundToggleEl.addEventListener("click", async () => {
  state.soundEnabled = !state.soundEnabled;

  if (state.soundEnabled && state.audioContext?.state === "suspended") {
    await state.audioContext.resume();
  }

  soundToggleEl.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
  soundToggleEl.setAttribute("aria-pressed", String(state.soundEnabled));
  setStatus(
    state.soundEnabled
      ? "Audio restored. The casino now hums like a funded startup."
      : "Audio muted. Even the hype cycle needed a break."
  );
});

handleReset();
