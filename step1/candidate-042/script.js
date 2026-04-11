const STORAGE_KEY = "token-tumbler-save";
const SPIN_COST = 15;
const symbols = [
  { icon: "🤖", name: "bot" },
  { icon: "🪙", name: "token" },
  { icon: "💸", name: "burn" },
  { icon: "🧠", name: "brain" },
  { icon: "📉", name: "pivot" },
  { icon: "🌀", name: "loop" },
  { icon: "🫠", name: "hallucination" }
];

const payoutTable = {
  bot: { triple: 140, pair: 30 },
  token: { triple: 220, pair: 45 },
  burn: { triple: 20, pair: 0 },
  brain: { triple: 110, pair: 20 },
  pivot: { triple: 75, pair: 18 },
  loop: { triple: 60, pair: 10 },
  hallucination: { triple: 5, pair: -25 }
};

const snark = {
  jackpot: [
    "Three tokens. Venture capital has mistaken you for infrastructure.",
    "Perfect alignment. The machine has briefly become profitable.",
    "You hit the premium training run. Please enjoy your synthetic fortune."
  ],
  win: [
    "The model emitted a monetizable sentence by accident.",
    "A pair matched. Somewhere, a keynote slide called this disruption.",
    "Compute spent, value vaguely implied. Net positive."
  ],
  loss: [
    "No match. The machine converted your wallet into investor optimism.",
    "Tokens gone. In return you received a confident wrong answer.",
    "Classic AI outcome: huge spend, decorative output."
  ],
  broke: [
    "You are out of tokens. Even the machine recommends touching grass.",
    "Wallet empty. The future of AI remains expensive and underwhelming.",
    "Bankrupt on synthetic hype. Reset if you need more imaginary runway."
  ],
  reset: [
    "Fresh funding secured. The machine is ready to waste it responsibly."
  ]
};

const els = {
  tokenCount: document.querySelector("#tokenCount"),
  lastPayout: document.querySelector("#lastPayout"),
  spinCount: document.querySelector("#spinCount"),
  jackpotCount: document.querySelector("#jackpotCount"),
  spentCount: document.querySelector("#spentCount"),
  messageText: document.querySelector("#messageText"),
  spinButton: document.querySelector("#spinButton"),
  resetButton: document.querySelector("#resetButton"),
  machine: document.querySelector(".machine"),
  reels: Array.from(document.querySelectorAll(".reel"))
};

let state = loadState();

render();

els.spinButton.addEventListener("click", spin);
els.resetButton.addEventListener("click", () => {
  state = defaultState();
  persist();
  render(pick(snark.reset));
});

function defaultState() {
  return {
    tokens: 120,
    lastPayout: 0,
    spins: 0,
    jackpots: 0,
    spent: 0
  };
}

function loadState() {
  const fallback = defaultState();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      return fallback;
    }

    return {
      tokens: Number.isFinite(saved.tokens) ? saved.tokens : fallback.tokens,
      lastPayout: Number.isFinite(saved.lastPayout) ? saved.lastPayout : fallback.lastPayout,
      spins: Number.isFinite(saved.spins) ? saved.spins : fallback.spins,
      jackpots: Number.isFinite(saved.jackpots) ? saved.jackpots : fallback.jackpots,
      spent: Number.isFinite(saved.spent) ? saved.spent : fallback.spent
    };
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function spin() {
  if (state.tokens < SPIN_COST) {
    render(pick(snark.broke));
    buzz([80, 40, 80]);
    return;
  }

  state.tokens -= SPIN_COST;
  state.spent += SPIN_COST;
  state.spins += 1;
  state.lastPayout = 0;
  render("Burning tokens to simulate insight...");

  els.spinButton.disabled = true;
  els.machine.classList.remove("win", "jackpot");
  playTone(180, 0.05, "sawtooth");

  const result = await animateSpin();
  const outcome = score(result);

  state.tokens += outcome.payout;
  state.lastPayout = outcome.payout;
  if (outcome.jackpot) {
    state.jackpots += 1;
  }

  persist();
  render(outcome.message);
  celebrate(outcome);
  els.spinButton.disabled = false;
}

async function animateSpin() {
  const result = [];

  for (let index = 0; index < els.reels.length; index += 1) {
    const reel = els.reels[index];
    reel.classList.add("spinning");

    for (let step = 0; step < 10 + index * 3; step += 1) {
      reel.textContent = pick(symbols).icon;
      await delay(70);
    }

    const finalSymbol = pick(symbols);
    reel.textContent = finalSymbol.icon;
    reel.classList.remove("spinning");
    result.push(finalSymbol);
    playTone(260 + index * 70, 0.04, "triangle");
  }

  return result;
}

function score(result) {
  const names = result.map((symbol) => symbol.name);
  const counts = names.reduce((map, name) => {
    map[name] = (map[name] || 0) + 1;
    return map;
  }, {});

  const [bestName, bestCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  if (bestCount === 3) {
    const payout = payoutTable[bestName].triple;
    return {
      payout,
      jackpot: payout >= 100,
      message: `${pick(snark.jackpot)} (+${payout} tokens)`
    };
  }

  if (bestCount === 2) {
    const payout = payoutTable[bestName].pair;
    const total = payout >= 0 ? `+${payout}` : `${payout}`;
    return {
      payout,
      jackpot: false,
      message: `${pick(snark.win)} (${total} tokens)`
    };
  }

  return {
    payout: 0,
    jackpot: false,
    message: pick(snark.loss)
  };
}

function celebrate(outcome) {
  if (outcome.jackpot) {
    els.machine.classList.add("jackpot");
    playTone(520, 0.08, "square");
    playTone(780, 0.08, "square", 80);
    buzz([120, 60, 160]);
    return;
  }

  if (outcome.payout > 0) {
    els.machine.classList.add("win");
    playTone(420, 0.07, "sine");
    buzz([70]);
    return;
  }

  playTone(150, 0.08, "sawtooth");
}

function render(message = "Insert tokens and let the machine hallucinate value.") {
  els.tokenCount.textContent = state.tokens;
  els.lastPayout.textContent = state.lastPayout;
  els.spinCount.textContent = state.spins;
  els.jackpotCount.textContent = state.jackpots;
  els.spentCount.textContent = state.spent;
  els.messageText.textContent = message;
  els.spinButton.disabled = state.tokens < SPIN_COST;
  els.spinButton.textContent = state.tokens < SPIN_COST ? "Need More Hype Capital" : "Spin For Compute";
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buzz(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playTone(frequency, duration, type, offset = 0) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  window.setTimeout(() => {
    const ctx = playTone.ctx || new AudioContextClass();
    playTone.ctx = ctx;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }, offset);
}
