const STORAGE_KEY = "token-treadmill-casino-state";
const SYMBOLS = ["🤖", "💸", "🔥", "🧠", "📉", "🪙"];
const SPIN_COST = 15;
const DEFAULT_STATE = {
  tokens: 120,
  lastPayout: 0,
};

const reelNodes = Array.from(document.querySelectorAll(".reel"));
const tokenNode = document.getElementById("tokenCount");
const costNode = document.getElementById("spinCost");
const payoutNode = document.getElementById("lastPayout");
const messageNode = document.getElementById("message");
const analysisNode = document.getElementById("analysisLine");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");

let state = loadState();
let audioContext;
let isSpinning = false;

const roastLines = [
  "Forecast: you will call this \"just one more spin\" at least six times.",
  "The model predicts a 97% chance you confuse entertainment with infrastructure.",
  "Good news: your tokens are being converted into stakeholder excitement.",
  "Latency remains low because expectations were already lowered.",
  "This machine is trained on premium casino-grade optimism.",
  "Your wallet has entered a reinforcement-learning feedback loop.",
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE };
    }

    const parsed = JSON.parse(raw);
    return {
      tokens:
        typeof parsed.tokens === "number" ? Math.max(0, parsed.tokens) : 120,
      lastPayout:
        typeof parsed.lastPayout === "number" ? Math.max(0, parsed.lastPayout) : 0,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is optional. The game still works without storage access.
  }
}

function render() {
  tokenNode.textContent = String(state.tokens);
  costNode.textContent = String(SPIN_COST);
  payoutNode.textContent = String(state.lastPayout);
  spinButton.disabled = isSpinning || state.tokens < SPIN_COST;
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCounts(result) {
  return result.reduce((counts, symbol) => {
    counts[symbol] = (counts[symbol] || 0) + 1;
    return counts;
  }, {});
}

function getPayout(result) {
  const [a, b, c] = result;
  const counts = Object.values(getCounts(result)).sort((x, y) => y - x);

  if (a === "🤖" && b === "🤖" && c === "🤖") {
    return { payout: 120, tone: "jackpot" };
  }

  if (a === "💸" && b === "💸" && c === "💸") {
    return { payout: 90, tone: "jackpot" };
  }

  if (a === "🔥" && b === "🔥" && c === "🔥") {
    return { payout: 60, tone: "hot" };
  }

  if (counts[0] === 2) {
    return { payout: 25, tone: "match" };
  }

  if (result.includes("🤖")) {
    return { payout: 8, tone: "consolation" };
  }

  return { payout: 0, tone: "loss" };
}

function getMessage(result, payout, tone) {
  const joined = result.join(" ");

  if (tone === "jackpot") {
    return `${joined} Jackpot. The AI economy briefly worked exactly as promised.`;
  }

  if (tone === "hot") {
    return `${joined} Strong thermal output. You won tokens and several compliance concerns.`;
  }

  if (tone === "match") {
    return `${joined} Two matched. The machine calls that “meaningful alignment.”`;
  }

  if (tone === "consolation") {
    return `${joined} A single robot appeared, so marketing approved a partial payout of ${payout}.`;
  }

  if (state.tokens === 0) {
    return `${joined} No payout. You are now operating in the free trial tier.`;
  }

  return `${joined} No payout. The model recommends spending more tokens to improve confidence.`;
}

function updateAnalysis(tone) {
  const map = {
    jackpot: "Signal detected: your reckless behavior has been temporarily rewarded.",
    hot: "Thermal event logged. Finance calls this a win because charts look exciting.",
    match: "Correlation found. Causation sold separately in the enterprise plan.",
    consolation: "The system generated a tiny payout to maintain user retention.",
    loss: roastLines[Math.floor(Math.random() * roastLines.length)],
  };

  analysisNode.textContent = map[tone];
}

function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;

  if (!AudioCtor) {
    return;
  }

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function beep(frequency, duration, type = "triangle", gainValue = 0.04) {
  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

async function spin() {
  if (isSpinning || state.tokens < SPIN_COST) {
    if (state.tokens < SPIN_COST) {
      messageNode.textContent =
        "You need more tokens. Unfortunately, this satire has no venture capital button.";
    }
    return;
  }

  ensureAudio();
  isSpinning = true;
  state.tokens -= SPIN_COST;
  state.lastPayout = 0;
  render();
  saveState();

  reelNodes.forEach((node) => {
    node.classList.remove("win");
    node.classList.add("spinning");
  });

  messageNode.textContent = "Processing your request with maximum monetization.";
  analysisNode.textContent =
    "Inference in progress. The machine is benchmarking your impulsiveness.";

  const finalResult = [];

  for (let reelIndex = 0; reelIndex < reelNodes.length; reelIndex += 1) {
    const reel = reelNodes[reelIndex];

    for (let step = 0; step < 12 + reelIndex * 5; step += 1) {
      reel.textContent = randomSymbol();
      beep(260 + step * 18, 0.05, "square", 0.018);
      await sleep(65);
    }

    const symbol = randomSymbol();
    finalResult.push(symbol);
    reel.textContent = symbol;
  }

  const { payout, tone } = getPayout(finalResult);
  state.tokens += payout;
  state.lastPayout = payout;

  reelNodes.forEach((node) => node.classList.remove("spinning"));

  if (payout > 0) {
    finalResult.forEach((symbol, index) => {
      if (
        tone === "jackpot" ||
        tone === "hot" ||
        finalResult.filter((item) => item === symbol).length > 1
      ) {
        reelNodes[index].classList.add("win");
      }
    });

    beep(660, 0.12, "triangle", 0.05);
    beep(880, 0.2, "sine", 0.05);
  } else if (navigator.vibrate) {
    navigator.vibrate(140);
  }

  messageNode.textContent = getMessage(finalResult, payout, tone);
  updateAnalysis(tone);

  saveState();
  isSpinning = false;
  render();
}

function resetGame() {
  state = { ...DEFAULT_STATE };
  reelNodes[0].textContent = "🤖";
  reelNodes[1].textContent = "💸";
  reelNodes[2].textContent = "🔥";
  reelNodes.forEach((node) => node.classList.remove("win", "spinning"));
  messageNode.textContent =
    "Economy reset. The board has approved another round of irresponsible experimentation.";
  analysisNode.textContent =
    "Fresh start loaded. Historical losses have been hidden for stakeholder clarity.";
  saveState();
  render();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

render();
