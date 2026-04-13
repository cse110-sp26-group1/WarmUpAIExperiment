const symbols = [
  { label: "Hallucination", payout: 10, mood: "Confidently incorrect" },
  { label: "Synergy", payout: 25, mood: "Speaking in decks" },
  { label: "Unicorn", payout: 80, mood: "Pitching at sunrise" },
  { label: "Prompt", payout: 15, mood: "Prompt-maxxing" },
  { label: "GPU", payout: 20, mood: "Thermally optimistic" },
  { label: "Pivot", payout: 18, mood: "Changing the roadmap" },
  { label: "Tokens", payout: 12, mood: "Metering your dreams" },
  { label: "Benchmark", payout: 22, mood: "Cherry-picking numbers" },
];

const pairReward = 5;
const startingTokens = 120;
const spinCost = 15;

const reels = [...document.querySelectorAll(".reel")];
const tokenCount = document.getElementById("tokenCount");
const spinCostLabel = document.getElementById("spinCost");
const aiMood = document.getElementById("aiMood");
const spinButton = document.getElementById("spinButton");
const refillButton = document.getElementById("refillButton");
const resultLine = document.getElementById("resultLine");
const subLine = document.getElementById("subLine");
const soundToggle = document.getElementById("soundToggle");
const toastTemplate = document.getElementById("toastTemplate");

let tokens = startingTokens;
let soundEnabled = true;
let audioContext;
let isSpinning = false;

spinCostLabel.textContent = spinCost;

function updateTokens() {
  tokenCount.textContent = tokens;
  spinButton.textContent = `Spin For ${spinCost} Tokens`;
  spinButton.disabled = isSpinning || tokens < spinCost;
}

function chooseSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function getPayout(results) {
  const labels = results.map((item) => item.label);
  const uniqueCount = new Set(labels).size;

  if (uniqueCount === 1) {
    const [hit] = results;
    return {
      amount: hit.payout,
      headline: `Triple ${hit.label}!`,
      detail: `The machine proudly shipped three copies of "${hit.label}" and called it innovation.`,
      mood: hit.mood,
      type: "jackpot",
    };
  }

  if (uniqueCount === 2) {
    const repeated = labels.find((label, index) => labels.indexOf(label) !== index);
    return {
      amount: pairReward,
      headline: `Pair of ${repeated}!`,
      detail: `Two reels agreed. In AI terms, that counts as peer review.`,
      mood: "Statistically hand-wavy",
      type: "pair",
    };
  }

  return {
    amount: 0,
    headline: "Zero alignment.",
    detail: "The model burned your tokens to generate a five-paragraph apology and a vague roadmap.",
    mood: "Reframing the miss",
    type: "miss",
  };
}

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }
  return audioContext;
}

function beep({ frequency, duration, type = "sine", gain = 0.035 }) {
  const context = ensureAudio();
  if (!context) return;

  const oscillator = context.createOscillator();
  const volume = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  volume.gain.setValueAtTime(gain, now);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(volume);
  volume.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playSpinSound() {
  beep({ frequency: 240, duration: 0.12, type: "triangle" });
  setTimeout(() => beep({ frequency: 310, duration: 0.12, type: "triangle" }), 120);
  setTimeout(() => beep({ frequency: 390, duration: 0.14, type: "triangle" }), 250);
}

function playOutcomeSound(type) {
  if (type === "jackpot") {
    [523, 659, 784].forEach((note, index) => {
      setTimeout(() => beep({ frequency: note, duration: 0.24, type: "square", gain: 0.045 }), index * 120);
    });
    return;
  }

  if (type === "pair") {
    beep({ frequency: 440, duration: 0.18, type: "sine" });
    setTimeout(() => beep({ frequency: 554, duration: 0.18, type: "sine" }), 120);
    return;
  }

  beep({ frequency: 180, duration: 0.25, type: "sawtooth", gain: 0.025 });
}

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2400);
}

function setMachineText(outcome) {
  resultLine.textContent = `${outcome.headline} ${outcome.amount > 0 ? `+${outcome.amount} tokens.` : "No refund."}`;
  subLine.textContent = outcome.detail;
  aiMood.textContent = outcome.mood;
}

function updateReelStyles(outcomeType) {
  reels.forEach((reel) => {
    reel.classList.remove("hit", "miss");
    reel.classList.add(outcomeType === "miss" ? "miss" : "hit");
  });
}

function spinOneReel(reel, finalSymbol, delay) {
  reel.classList.add("spinning");
  let ticks = 0;

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      reel.textContent = chooseSymbol().label;
      ticks += 1;
    }, 70);

    setTimeout(() => {
      clearInterval(interval);
      reel.textContent = finalSymbol.label;
      reel.classList.remove("spinning");
      resolve();
    }, 700 + delay + ticks * 3);
  });
}

async function handleSpin() {
  if (isSpinning || tokens < spinCost) {
    if (tokens < spinCost) {
      showToast("Out of tokens. Time to invent a monetization layer.");
    }
    return;
  }

  isSpinning = true;
  tokens -= spinCost;
  updateTokens();
  playSpinSound();
  resultLine.textContent = "Consulting the stochastic prophet...";
  subLine.textContent = "Please wait while the machine remixes investor buzzwords.";

  const results = reels.map(() => chooseSymbol());
  await Promise.all(results.map((symbol, index) => spinOneReel(reels[index], symbol, index * 220)));

  const outcome = getPayout(results);
  tokens += outcome.amount;
  updateReelStyles(outcome.type);
  setMachineText(outcome);
  playOutcomeSound(outcome.type);
  updateTokens();

  if (outcome.type === "jackpot") {
    showToast("Jackpot. The AI is now requesting a keynote slot.");
  } else if (outcome.type === "pair") {
    showToast("Minor win. The demo almost survived the Q&A.");
  } else {
    showToast("Loss recorded. The AI blamed your prompt.");
  }

  isSpinning = false;
  updateTokens();
}

function refillTokens() {
  const grant = Math.floor(Math.random() * 41) + 30;
  tokens += grant;
  aiMood.textContent = "Fresh off a funding round";
  resultLine.textContent = `A venture capitalist spotted the word "platform." +${grant} tokens.`;
  subLine.textContent = "Your runway improved, but now the roadmap includes a blockchain slide for no reason.";
  updateTokens();
  showToast(`Emergency refill secured: +${grant} tokens.`);
  beep({ frequency: 620, duration: 0.2, type: "triangle" });
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
}

spinButton.addEventListener("click", handleSpin);
refillButton.addEventListener("click", refillTokens);
soundToggle.addEventListener("click", toggleSound);

updateTokens();
