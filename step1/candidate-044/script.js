const symbols = [
  { icon: "🪙", name: "Token", triple: 80, line: "Three tokens. The machine just invented a currency again." },
  { icon: "🤖", name: "Bot", triple: 60, line: "Robot jackpot. Somewhere a demo just called itself sentient." },
  { icon: "🔥", name: "GPU", triple: 50, line: "Triple GPU. Heat output now exceeds product value." },
  { icon: "💸", name: "Burn Rate", triple: 40, line: "Triple burn rate. Venture capital has entered the chat." },
  { icon: "🧠", name: "Overfit", triple: 35, line: "Triple brain. It memorized the prompt and billed you extra." },
  { icon: "📉", name: "Benchmark", triple: 30, line: "Benchmark sweep. Accuracy up, usefulness still pending." }
];

const startingTokens = 120;
const spinCost = 10;
const storageKey = "token-burner-3000-state";

const state = {
  tokens: startingTokens,
  spins: 0,
  bestWin: 0,
  net: 0,
  isSpinning: false
};

const tokenCount = document.querySelector("#token-count");
const resultTitle = document.querySelector("#result-title");
const resultDetail = document.querySelector("#result-detail");
const spinCount = document.querySelector("#spin-count");
const bestWin = document.querySelector("#best-win");
const netTotal = document.querySelector("#net-total");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const reels = Array.from(document.querySelectorAll(".reel"));

function loadState() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    const saved = JSON.parse(raw);
    if (
      typeof saved.tokens === "number" &&
      typeof saved.spins === "number" &&
      typeof saved.bestWin === "number" &&
      typeof saved.net === "number"
    ) {
      state.tokens = saved.tokens;
      state.spins = saved.spins;
      state.bestWin = saved.bestWin;
      state.net = saved.net;
    }
  } catch {
    // Ignore corrupt local storage and continue with defaults.
  }
}

function persistState() {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        tokens: state.tokens,
        spins: state.spins,
        bestWin: state.bestWin,
        net: state.net
      })
    );
  } catch {
    // Ignore persistence failures in restricted environments.
  }
}

function chooseSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function evaluate(result) {
  const icons = result.map((entry) => entry.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topIcon, topCount] = entries[0];

  if (topCount === 3) {
    const matched = result[0];
    return {
      payout: matched.triple,
      title: "Jackpot",
      detail: matched.line
    };
  }

  if (topCount === 2) {
    const matched = symbols.find((symbol) => symbol.icon === topIcon);
    return {
      payout: 15,
      title: "Pair Detected",
      detail: `${matched.name} pair. Enough validation to launch a keynote, not enough to help anyone.`
    };
  }

  return {
    payout: 0,
    title: "Rug Pull",
    detail: "No match. Your tokens were reclassified as inference overhead."
  };
}

function render() {
  tokenCount.textContent = String(state.tokens);
  spinCount.textContent = String(state.spins);
  bestWin.textContent = String(state.bestWin);
  netTotal.textContent = state.net > 0 ? `+${state.net}` : String(state.net);
  spinButton.disabled = state.isSpinning || state.tokens < spinCost;

  if (state.tokens < spinCost) {
    spinButton.textContent = "Out of Tokens";
    resultTitle.textContent = "Liquidity Crisis";
    resultDetail.textContent = "The AI startup can no longer afford another spin. Reboot the hype cycle.";
  } else if (!state.isSpinning) {
    spinButton.textContent = `Spend ${spinCost} Tokens`;
  }

  persistState();
}

async function animateSpin() {
  for (const reel of reels) {
    reel.classList.add("spinning");
  }

  const result = [];

  for (let index = 0; index < reels.length; index += 1) {
    const reel = reels[index];
    for (let tick = 0; tick < 9 + index * 4; tick += 1) {
      reel.textContent = chooseSymbol().icon;
      await delay(75);
    }
    const finalSymbol = chooseSymbol();
    reel.textContent = finalSymbol.icon;
    reel.classList.remove("spinning");
    result.push(finalSymbol);
    await delay(120);
  }

  return result;
}

async function spin() {
  if (state.isSpinning || state.tokens < spinCost) {
    return;
  }

  state.isSpinning = true;
  state.tokens -= spinCost;
  state.spins += 1;
  state.net -= spinCost;
  resultTitle.textContent = "Inference Running";
  resultDetail.textContent = "Generating statistically expensive nonsense...";
  render();

  const result = await animateSpin();
  const outcome = evaluate(result);

  state.tokens += outcome.payout;
  state.net += outcome.payout;
  state.bestWin = Math.max(state.bestWin, outcome.payout);
  state.isSpinning = false;

  resultTitle.textContent = outcome.title;
  resultDetail.textContent = outcome.detail;
  render();
}

function resetGame() {
  state.tokens = startingTokens;
  state.spins = 0;
  state.bestWin = 0;
  state.net = 0;
  state.isSpinning = false;

  reels.forEach((reel, index) => {
    reel.classList.remove("spinning");
    reel.textContent = symbols[index].icon;
  });

  resultTitle.textContent = "Rebooted";
  resultDetail.textContent = "Fresh tokens loaded. The machine is ready to monetize your curiosity again.";
  render();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

loadState();
render();
