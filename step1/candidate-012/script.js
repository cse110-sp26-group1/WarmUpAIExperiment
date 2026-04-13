const STORAGE_KEY = "token-tumbler-9000-state";
const SPIN_COST = 75;
const STARTING_BALANCE = 1200;

const symbols = [
  { label: "GPU", weight: 22, kind: "good" },
  { label: "Prompt", weight: 18, kind: "good" },
  { label: "VC", weight: 12, kind: "good" },
  { label: "Agent", weight: 15, kind: "neutral" },
  { label: "Sentience", weight: 8, kind: "wild" },
  { label: "Hallucination", weight: 10, kind: "bad" },
  { label: "Pivot", weight: 15, kind: "neutral" }
];

const snark = {
  intro: [
    "Welcome back. The machine senses a budget line item it can absorb.",
    "Spin responsibly. Your CFO certainly is not.",
    "Every pull is powered by electricity and unearned certainty."
  ],
  lowFunds: [
    "Wallet thinning. Consider replacing lunch with brand positioning.",
    "You are nearly out of tokens and entirely out of restraint."
  ],
  win: [
    "Incredible. The graph is pointing upward for reasons nobody can reproduce.",
    "Three icons aligned. Please update the pitch deck immediately.",
    "The machine approves your reckless confidence."
  ],
  smallWin: [
    "A modest payout. Enough to fund one more doomed experiment.",
    "Two matched. Somewhere, a PM calls this traction."
  ],
  loss: [
    "No payout. The machine has converted your optimism into heat.",
    "You spent premium tokens for a handcrafted disappointment.",
    "Another miss. Please describe this as a learning milestone."
  ],
  sentience: [
    "Triple Sentience. Congratulations on awakening the quarterly report.",
    "Sentience jackpot. Legal would like a quick chat."
  ],
  broke: [
    "Bankrupt. The machine suggests pivoting to 'AI for pets.'",
    "Wallet empty. Time to raise another pre-seed on vibes alone."
  ]
};

const elements = {
  balance: document.getElementById("balance"),
  cost: document.getElementById("cost"),
  message: document.getElementById("message"),
  history: document.getElementById("history"),
  spinButton: document.getElementById("spin-button"),
  resetButton: document.getElementById("reset-button"),
  reels: [
    document.getElementById("reel-0"),
    document.getElementById("reel-1"),
    document.getElementById("reel-2")
  ],
  machineBody: document.querySelector(".machine-body")
};

let state = loadState();
render();
setMessage(randomFrom(snark.intro));

elements.spinButton.addEventListener("click", handleSpin);
elements.resetButton.addEventListener("click", resetGame);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (parsed && typeof parsed.balance === "number" && Array.isArray(parsed.history)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to restore slot machine state.", error);
  }

  return {
    balance: STARTING_BALANCE,
    history: ["Session initialized. Morale inflated."],
    reels: ["GPU", "GPU", "GPU"],
    spinCount: 0
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  elements.balance.textContent = state.balance;
  elements.cost.textContent = SPIN_COST;
  elements.spinButton.textContent = `Spend ${SPIN_COST} Tokens`;
  elements.spinButton.disabled = state.balance < SPIN_COST;

  state.reels.forEach((value, index) => {
    elements.reels[index].textContent = value;
  });

  elements.history.innerHTML = "";
  state.history.slice(0, 6).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    elements.history.appendChild(item);
  });
}

async function handleSpin() {
  if (state.balance < SPIN_COST) {
    addHistory(randomFrom(snark.broke));
    setMessage(randomFrom(snark.broke));
    pulseMachine("flash-lose");
    return;
  }

  state.balance -= SPIN_COST;
  state.spinCount += 1;
  render();

  await animateReels();

  const result = Array.from({ length: 3 }, pickWeightedSymbol);
  state.reels = result.map((item) => item.label);

  const payout = calculatePayout(result);
  state.balance += payout.tokens;

  addHistory(payout.logline);
  setMessage(payout.message);
  render();
  saveState();

  if (navigator.vibrate) {
    navigator.vibrate(payout.tokens > SPIN_COST ? [80, 40, 80] : 60);
  }

  pulseMachine(payout.tokens > SPIN_COST ? "flash-win" : "flash-lose");

  if (state.balance < SPIN_COST) {
    addHistory(randomFrom(snark.lowFunds));
    if (state.balance === 0) {
      setMessage(randomFrom(snark.broke));
    }
    render();
    saveState();
  }
}

function calculatePayout(result) {
  const labels = result.map((item) => item.label);
  const unique = new Set(labels);
  const hasHallucination = labels.includes("Hallucination");
  const isSentienceJackpot = unique.size === 1 && labels[0] === "Sentience";

  if (isSentienceJackpot) {
    return {
      tokens: 9999,
      message: randomFrom(snark.sentience),
      logline: "Triple Sentience landed. Wallet boosted by 9999 tokens."
    };
  }

  if (hasHallucination) {
    return {
      tokens: 0,
      message: randomFrom(snark.loss),
      logline: `Hallucination detected in ${labels.join(" / ")}. Tokens donated to entropy.`
    };
  }

  if (unique.size === 1) {
    return {
      tokens: SPIN_COST * 6,
      message: randomFrom(snark.win),
      logline: `${labels[0]} x3. Payout delivered: ${SPIN_COST * 6} tokens.`
    };
  }

  if (unique.size === 2) {
    return {
      tokens: SPIN_COST * 2,
      message: randomFrom(snark.smallWin),
      logline: `Partial alignment on ${labels.join(" / ")}. Recovered ${SPIN_COST * 2} tokens.`
    };
  }

  if (labels.includes("Sentience")) {
    return {
      tokens: SPIN_COST + 40,
      message: "A lone Sentience slipped through. The machine tips you a chaos bonus.",
      logline: `Sentience bonus triggered. Pocketed ${SPIN_COST + 40} tokens.`
    };
  }

  return {
    tokens: 0,
    message: randomFrom(snark.loss),
    logline: `No useful pattern in ${labels.join(" / ")}. Tokens evaporated.`
  };
}

function pickWeightedSymbol() {
  const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const symbol of symbols) {
    threshold -= symbol.weight;
    if (threshold <= 0) {
      return symbol;
    }
  }

  return symbols[0];
}

function animateReels() {
  const spinPromises = elements.reels.map((reel, index) => {
    reel.classList.add("spinning");

    return new Promise((resolve) => {
      let ticks = 0;
      const timer = window.setInterval(() => {
        ticks += 1;
        reel.textContent = symbols[(ticks + index) % symbols.length].label;

        if (ticks > 9 + index * 3) {
          window.clearInterval(timer);
          reel.classList.remove("spinning");
          resolve();
        }
      }, 90);
    });
  });

  return Promise.all(spinPromises);
}

function addHistory(entry) {
  state.history.unshift(entry);
  state.history = state.history.slice(0, 12);
}

function setMessage(text) {
  elements.message.textContent = text;
}

function pulseMachine(className) {
  elements.machineBody.classList.remove("flash-win", "flash-lose");
  void elements.machineBody.offsetWidth;
  elements.machineBody.classList.add(className);
}

function resetGame() {
  state = {
    balance: STARTING_BALANCE,
    history: ["Session initialized. Morale inflated."],
    reels: ["GPU", "GPU", "GPU"],
    spinCount: 0
  };

  setMessage("Hype cycle rebooted. The machine is freshly overconfident.");
  saveState();
  render();
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
