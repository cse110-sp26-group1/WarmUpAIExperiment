const STORAGE_KEY = "token-tilter-3000-state";
const SPIN_COST = 15;
const startingState = {
  tokens: 120,
  bestWin: 0,
  spins: 0,
};

const symbols = [
  { icon: "🤖", name: "AI avatar", weight: 2, triple: 180 },
  { icon: "🪙", name: "token cache", weight: 3, triple: 90 },
  { icon: "🧠", name: "reasoning engine", weight: 3, triple: 70 },
  { icon: "📉", name: "rate limit", weight: 4, triple: 45 },
  { icon: "🧾", name: "fabricated citation", weight: 4, triple: 35 },
  { icon: "🫠", name: "hallucination", weight: 5, triple: 20 },
  { icon: "🔋", name: "GPU battery", weight: 4, triple: 50 },
];

const moodMessages = [
  "Model mood: dangerously optimistic",
  "Model mood: pretending the benchmark matters",
  "Model mood: one prompt away from improv",
  "Model mood: statistically overconfident",
  "Model mood: warmed by venture funding",
];

const lossLines = [
  "No payout. The model used your tokens to summarize a paragraph you already wrote.",
  "Miss. Those credits were redirected to a very important sycophancy routine.",
  "Nothing matched. Please enjoy this complimentary cloud bill.",
  "Cold spin. The reels confidently produced nonsense at production scale.",
];

const pairLines = [
  "Two matched. The machine calls that 'emergent reasoning' and pays a little.",
  "Pair landed. Not great, not terrible, very on-brand for AI output.",
  "Two of a kind. The model insists this counts as alignment.",
];

const tripleLines = {
  "🤖": "Three AI avatars. Jackpot. The machine has become self-funding and deeply annoying.",
  "🪙": "Three token caches. Congratulations, you found the mythical efficient inference path.",
  "🧠": "Three reasoning engines. The app now believes it deserves a keynote slot.",
  "📉": "Three rate limits. Weirdly, that still paid out better than most startups.",
  "🧾": "Three fabricated citations. Academic-looking nonsense is still a premium product.",
  "🫠": "Three hallucinations. Catastrophic for truth, decent for entertainment.",
  "🔋": "Three GPU batteries. The datacenter lights are flickering with respect.",
};

const tokenCount = document.querySelector("#token-count");
const bestWin = document.querySelector("#best-win");
const spinCostLabel = document.querySelector("#spin-cost");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const message = document.querySelector("#message");
const moodDisplay = document.querySelector("#mood-display");
const floatingChipTemplate = document.querySelector("#floating-chip-template");
const machineCard = document.querySelector(".machine-card");
const reelEls = [0, 1, 2].map((index) => ({
  symbol: document.querySelector(`#reel-${index}`),
  label: document.querySelector(`#label-${index}`),
  reel: document.querySelector(`.reel[data-reel="${index}"]`),
}));

spinCostLabel.textContent = SPIN_COST;

const numberFormatter = new Intl.NumberFormat("en-US");

let state = loadState();
let spinning = false;

render();
seedReels();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...startingState };
    return { ...startingState, ...JSON.parse(raw) };
  } catch {
    return { ...startingState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  tokenCount.textContent = numberFormatter.format(state.tokens);
  bestWin.textContent = numberFormatter.format(state.bestWin);
  spinButton.disabled = spinning || state.tokens < SPIN_COST;
  spinButton.textContent = state.tokens < SPIN_COST
    ? "Out Of Tokens"
    : `Spin For ${SPIN_COST} Tokens`;
}

function seedReels() {
  const initial = [drawSymbol(), drawSymbol(), drawSymbol()];
  updateReels(initial);
}

function drawSymbol() {
  const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const symbol of symbols) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol;
  }
  return symbols[symbols.length - 1];
}

async function spin() {
  if (spinning || state.tokens < SPIN_COST) {
    if (state.tokens < SPIN_COST) {
      setMessage("You're broke. Reset the wallet and continue your irresponsible token economy.");
    }
    return;
  }

  spinning = true;
  state.tokens -= SPIN_COST;
  state.spins += 1;
  render();
  setMood();
  setMessage("Spinning the reels. The machine is monetizing your curiosity...");

  const results = [drawSymbol(), drawSymbol(), drawSymbol()];

  for (let index = 0; index < reelEls.length; index += 1) {
    await animateReel(reelEls[index], results[index], index);
  }

  const payout = calculatePayout(results);
  state.tokens += payout.amount;
  state.bestWin = Math.max(state.bestWin, payout.amount);
  saveState();
  render();
  announceResult(results, payout);
  spinning = false;
  render();
}

function calculatePayout(results) {
  const icons = results.map((entry) => entry.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});

  const [topIcon, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (topCount === 3) {
    const symbol = symbols.find((entry) => entry.icon === topIcon);
    return { amount: symbol.triple, tier: "triple", icon: topIcon };
  }

  if (topCount === 2) {
    return { amount: 25, tier: "pair", icon: topIcon };
  }

  return { amount: 0, tier: "loss", icon: null };
}

function announceResult(results, payout) {
  if (payout.tier === "triple") {
    setMessage(`${tripleLines[payout.icon]} You earned ${payout.amount} tokens.`);
    celebrate(payout.amount, true);
    return;
  }

  if (payout.tier === "pair") {
    const line = pairLines[Math.floor(Math.random() * pairLines.length)];
    setMessage(`${line} You recovered ${payout.amount} tokens.`);
    celebrate(payout.amount, false);
    return;
  }

  const lossLine = lossLines[Math.floor(Math.random() * lossLines.length)];
  setMessage(lossLine);
}

async function animateReel(reelParts, finalSymbol, index) {
  const cycles = 10 + index * 4;
  for (let step = 0; step < cycles; step += 1) {
    const fake = drawSymbol();
    reelParts.symbol.textContent = fake.icon;
    reelParts.label.textContent = fake.name;
    reelParts.reel.animate(
      [
        { transform: "translateY(-8px)" },
        { transform: "translateY(8px)" },
        { transform: "translateY(0)" },
      ],
      {
        duration: 120,
        easing: "ease-out",
      },
    );
    await wait(70 + step * 4);
  }

  reelParts.symbol.textContent = finalSymbol.icon;
  reelParts.label.textContent = finalSymbol.name;
}

function updateReels(resultSet) {
  resultSet.forEach((symbol, index) => {
    reelEls[index].symbol.textContent = symbol.icon;
    reelEls[index].label.textContent = symbol.name;
  });
}

function celebrate(amount, isJackpot) {
  const chip = floatingChipTemplate.content.firstElementChild.cloneNode(true);
  chip.textContent = `+${amount} TOKENS`;
  document.body.appendChild(chip);
  chip.animate(
    [
      { transform: "translateY(0) scale(0.95)", opacity: 0 },
      { transform: "translateY(-24px) scale(1)", opacity: 1, offset: 0.2 },
      { transform: "translateY(-120px) scale(1.04)", opacity: 0 },
    ],
    {
      duration: 1500,
      easing: "cubic-bezier(.2,.8,.2,1)",
    },
  ).finished.finally(() => chip.remove());

  if (isJackpot) {
    machineCard.classList.remove("jackpot-flash");
    void machineCard.offsetWidth;
    machineCard.classList.add("jackpot-flash");
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 160, 50, 220]);
    }
  }
}

function setMessage(text) {
  message.textContent = text;
}

function setMood() {
  moodDisplay.textContent = moodMessages[Math.floor(Math.random() * moodMessages.length)];
}

function resetGame() {
  state = { ...startingState };
  saveState();
  seedReels();
  render();
  setMood();
  setMessage("Wallet reset. Venture capital has re-entered the chat.");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
