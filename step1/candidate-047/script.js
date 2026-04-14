const symbols = [
  "PROMPT",
  "GPU",
  "HYPE",
  "TOKEN",
  "BLOB",
  "AGENT",
  "VIBE",
  "MOAT",
];

const payouts = {
  TOKEN: 60,
  GPU: 45,
  AGENT: 38,
  HYPE: 32,
  PROMPT: 28,
  VIBE: 25,
  BLOB: 22,
  MOAT: 20,
};

const state = {
  balance: 120,
  spins: 0,
  spinning: false,
  soundOn: true,
};

const spinCost = 15;

const reels = [...document.querySelectorAll(".reel")];
const balanceEl = document.getElementById("tokenBalance");
const spinCountEl = document.getElementById("spinCount");
const messageEl = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const cashoutButton = document.getElementById("cashoutButton");
const soundToggle = document.getElementById("soundToggle");
const shopItems = [...document.querySelectorAll(".shop-item")];

const audioContext =
  "AudioContext" in window || "webkitAudioContext" in window
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function setMessage(text) {
  messageEl.textContent = text;
}

function updateUi() {
  balanceEl.textContent = state.balance;
  spinCountEl.textContent = state.spins;
  spinButton.disabled = state.spinning || state.balance < spinCost;
  cashoutButton.disabled = state.spinning || state.balance < 10;

  for (const item of shopItems) {
    const cost = Number(item.dataset.cost);
    item.disabled = state.spinning || state.balance < cost;
  }
}

function beep(frequency, duration, type = "square", gainValue = 0.02) {
  if (!audioContext || !state.soundOn) {
    return;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function playSpinSound() {
  beep(240, 0.05, "sawtooth", 0.015);
  setTimeout(() => beep(320, 0.05, "sawtooth", 0.015), 70);
  setTimeout(() => beep(420, 0.05, "sawtooth", 0.015), 140);
}

function playWinSound() {
  beep(440, 0.08, "triangle", 0.03);
  setTimeout(() => beep(554, 0.1, "triangle", 0.03), 90);
  setTimeout(() => beep(659, 0.12, "triangle", 0.03), 180);
}

function playLossSound() {
  beep(180, 0.15, "sine", 0.02);
}

function calculateOutcome(results) {
  const [a, b, c] = results;

  if (a === b && b === c) {
    return {
      payout: payouts[a] ?? 25,
      text: `Jackpot. Three ${a}s. The board has declared you a thought leader.`,
    };
  }

  if (a === b || b === c || a === c) {
    return {
      payout: 12,
      text: "Two of a kind. The machine calls this a seed round.",
    };
  }

  return {
    payout: 0,
    text: "No match. Your tokens were reinvested into executive optimism.",
  };
}

function animateReel(reel, finalSymbol, delay) {
  reel.classList.add("spinning");

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      reel.textContent = randomSymbol();
    }, 90);

    setTimeout(() => {
      clearInterval(interval);
      reel.classList.remove("spinning");
      reel.textContent = finalSymbol;
      resolve();
    }, delay);
  });
}

async function spin() {
  if (state.spinning || state.balance < spinCost) {
    if (state.balance < spinCost) {
      setMessage("Insufficient tokens. Please consider monetizing your personality.");
    }
    return;
  }

  state.spinning = true;
  state.balance -= spinCost;
  state.spins += 1;
  updateUi();
  setMessage("Spinning reels and laundering expectations...");
  playSpinSound();

  const results = [randomSymbol(), randomSymbol(), randomSymbol()];
  await Promise.all(
    reels.map((reel, index) => animateReel(reel, results[index], 650 + index * 250))
  );

  const outcome = calculateOutcome(results);
  state.balance += outcome.payout;
  state.spinning = false;
  updateUi();
  setMessage(outcome.text);

  if (outcome.payout > 0) {
    playWinSound();
  } else {
    playLossSound();
  }
}

function spendTokens(cost, item) {
  if (state.spinning) {
    return;
  }

  if (state.balance < cost) {
    setMessage("Not enough tokens. The grift economy remains paywalled.");
    return;
  }

  state.balance -= cost;
  updateUi();
  playLossSound();
  setMessage(`Purchased: ${item}. Excellent news for absolutely nobody.`);
}

spinButton.addEventListener("click", spin);

cashoutButton.addEventListener("click", () => {
  spendTokens(10, "a commemorative PDF proving your prompt was enterprise-grade");
});

soundToggle.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = `Sound: ${state.soundOn ? "On" : "Off"}`;
  soundToggle.setAttribute("aria-pressed", String(state.soundOn));
});

for (const item of shopItems) {
  item.addEventListener("click", () => {
    spendTokens(Number(item.dataset.cost), item.dataset.item);
  });
}

updateUi();
