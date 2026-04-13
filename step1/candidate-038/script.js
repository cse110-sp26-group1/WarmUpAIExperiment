const symbols = [
  "404 Hype",
  "Hallucination",
  "GPU Tears",
  "Prompt Juice",
  "Venture Fog",
  "Data Exhaust",
  "Synergy Slop",
  "Token Rain"
];

const modelMoods = [
  "Feeling aggressively overconfident",
  "Benchmarking vibes instead of facts",
  "Politely consuming your runway",
  "Optimizing for investor applause",
  "Pretending the context window is infinite"
];

const state = {
  tokens: 120,
  spinCost: 15,
  spinning: false,
  paletteIndex: 0
};

const storageKey = "token-goblin-3000-save";

const palettes = [
  {
    bg: "linear-gradient(135deg, #f4e7d3 0%, #efb86f 45%, #c95f32 100%)",
    accent: "#ff9f1c",
    accent2: "#ffd166",
    panel: "rgba(55, 20, 7, 0.88)"
  },
  {
    bg: "linear-gradient(135deg, #d9f0ff 0%, #83c5be 48%, #275d7a 100%)",
    accent: "#ffddd2",
    accent2: "#e9c46a",
    panel: "rgba(17, 43, 57, 0.88)"
  },
  {
    bg: "linear-gradient(135deg, #fcefe3 0%, #f4978e 44%, #7c3aed 100%)",
    accent: "#f07167",
    accent2: "#fed9b7",
    panel: "rgba(57, 24, 81, 0.88)"
  }
];

const reelNodes = [...document.querySelectorAll(".reel")];
const tokenBalanceNode = document.getElementById("tokenBalance");
const spinCostNode = document.getElementById("spinCost");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const themeButton = document.getElementById("themeButton");
const messageLog = document.getElementById("messageLog");
const modelStatus = document.getElementById("modelStatus");
const machineCard = document.querySelector(".machine-card");

function render() {
  tokenBalanceNode.textContent = state.tokens;
  spinCostNode.textContent = state.spinCost;
  spinButton.textContent = `Spend ${state.spinCost} tokens`;
  spinButton.disabled = state.spinning || state.tokens < state.spinCost;

  if (state.tokens < state.spinCost) {
    messageLog.textContent = "Your token balance has entered the dignity-free zone. Hit emergency bailout to re-inflate the bubble.";
  }
}

function setMessage(text) {
  messageLog.textContent = text;
  saveState();
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function randomMood() {
  return modelMoods[Math.floor(Math.random() * modelMoods.length)];
}

function applyPalette(index) {
  const palette = palettes[index];
  document.documentElement.style.setProperty("--bg", palette.bg);
  document.documentElement.style.setProperty("--accent", palette.accent);
  document.documentElement.style.setProperty("--accent-2", palette.accent2);
  document.documentElement.style.setProperty("--panel", palette.panel);
  saveState();
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({
    tokens: state.tokens,
    spinCost: state.spinCost,
    paletteIndex: state.paletteIndex,
    message: messageLog.textContent,
    mood: modelStatus.textContent,
    reels: reelNodes.map((node) => node.firstElementChild.textContent)
  }));
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.tokens = typeof parsed.tokens === "number" ? parsed.tokens : state.tokens;
    state.spinCost = typeof parsed.spinCost === "number" ? parsed.spinCost : state.spinCost;
    state.paletteIndex = typeof parsed.paletteIndex === "number" ? parsed.paletteIndex % palettes.length : 0;
    applyPalette(state.paletteIndex);

    if (Array.isArray(parsed.reels)) {
      parsed.reels.slice(0, reelNodes.length).forEach((symbol, index) => {
        reelNodes[index].firstElementChild.textContent = symbol;
      });
    }

    if (parsed.message) {
      messageLog.textContent = parsed.message;
    }

    if (parsed.mood) {
      modelStatus.textContent = parsed.mood;
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function flashMachine(className) {
  machineCard.classList.remove("flash-win", "flash-lose");
  void machineCard.offsetWidth;
  machineCard.classList.add(className);

  if ("vibrate" in navigator) {
    navigator.vibrate(className === "flash-win" ? [60, 40, 120] : [80, 30, 80]);
  }
}

function evaluateSpin(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const matchCounts = Object.values(counts).sort((a, b) => b - a);
  const bestMatch = matchCounts[0];

  if (bestMatch === 3) {
    state.tokens += 90;
    state.spinCost = Math.min(state.spinCost + 5, 40);
    flashMachine("flash-win");
    setMessage(`Jackpot. Three ${results[0]}s in a row. The machine declares you a thought leader and refunds 90 tokens.`);
    saveState();
    return;
  }

  if (bestMatch === 2) {
    state.tokens += 35;
    flashMachine("flash-win");
    setMessage(`Two symbols matched. The model calls that "near-human reasoning" and tosses you 35 tokens.`);
    saveState();
    return;
  }

  state.spinCost = Math.max(10, state.spinCost - 1);
  flashMachine("flash-lose");
  setMessage(`No match. Your tokens have been converted into executive optimism and low-latency excuses.`);
  saveState();
}

function animateReel(reelNode, finalSymbol, delay) {
  return new Promise((resolve) => {
    reelNode.classList.add("spinning");
    let ticks = 0;
    const spinner = setInterval(() => {
      reelNode.firstElementChild.textContent = randomSymbol();
      ticks += 1;
      if (ticks > 8 + delay) {
        clearInterval(spinner);
        reelNode.firstElementChild.textContent = finalSymbol;
        reelNode.classList.remove("spinning");
        resolve();
      }
    }, 90);
  });
}

async function spin() {
  if (state.spinning || state.tokens < state.spinCost) {
    return;
  }

  state.spinning = true;
  state.tokens -= state.spinCost;
  modelStatus.textContent = randomMood();
  setMessage("Inference in progress. Please remain calm while the machine monetizes suspense.");
  render();

  const results = [randomSymbol(), randomSymbol(), randomSymbol()];
  await Promise.all(results.map((symbol, index) => animateReel(reelNodes[index], symbol, index * 2)));

  evaluateSpin(results);
  state.spinning = false;
  render();
  saveState();
}

function resetGame() {
  state.tokens = 120;
  state.spinCost = 15;
  state.spinning = false;
  reelNodes.forEach((reelNode, index) => {
    reelNode.firstElementChild.textContent = symbols[index];
    reelNode.classList.remove("spinning");
  });
  modelStatus.textContent = "Feeling aggressively overconfident";
  setMessage("Bubble restored. Fresh tokens minted from pure narrative momentum.");
  render();
  saveState();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);
themeButton.addEventListener("click", () => {
  state.paletteIndex = (state.paletteIndex + 1) % palettes.length;
  applyPalette(state.paletteIndex);
  setMessage("Brand refresh complete. The machine now looks even more confident about unverified claims.");
});

loadState();
render();
