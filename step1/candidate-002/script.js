const symbols = [
  {
    label: "Token Rain",
    payout: 140,
    quip: "The machine briefly mistakes you for a unicorn startup.",
  },
  {
    label: "Prompt Gold",
    payout: 90,
    quip: "A consultant just called that outcome synergistic.",
  },
  {
    label: "Hallucination",
    payout: 0,
    quip: "The reels cite a benchmark that does not exist.",
  },
  {
    label: "Rate Limit",
    payout: 0,
    quip: "Success was possible, just not at your pricing tier.",
  },
  {
    label: "GPU Fire",
    payout: 0,
    quip: "Somewhere a datacenter fan starts screaming.",
  },
  {
    label: "Vibe Coding",
    payout: 0,
    quip: "No tests, just confidence and a launch thread.",
  },
];

const state = {
  balance: 120,
  spinCost: 15,
  streak: 0,
  spinning: false,
  log: [],
};

const reelElements = [...document.querySelectorAll(".reel")];
const balanceElement = document.getElementById("token-balance");
const spinCostElement = document.getElementById("spin-cost");
const streakElement = document.getElementById("win-streak");
const statusElement = document.getElementById("status-message");
const eventLogElement = document.getElementById("event-log");
const spinButton = document.getElementById("spin-button");
const refillButton = document.getElementById("refill-button");
const machineElement = document.querySelector(".machine");

function updateDashboard() {
  balanceElement.textContent = state.balance;
  spinCostElement.textContent = state.spinCost;
  streakElement.textContent = state.streak;
  spinButton.disabled = state.spinning || state.balance < state.spinCost;
}

function setStatus(message) {
  statusElement.textContent = message;
}

function pushLog(message, tone = "neutral") {
  state.log.unshift({ message, tone });
  state.log = state.log.slice(0, 6);

  eventLogElement.innerHTML = "";

  state.log.forEach((entry) => {
    const item = document.createElement("li");
    const label = toneLabel(entry.tone);
    item.innerHTML = `<strong>${label}</strong> ${entry.message}`;
    eventLogElement.appendChild(item);
  });
}

function toneLabel(tone) {
  if (tone === "win") return "Jackpot:";
  if (tone === "loss") return "Oof:";
  if (tone === "refill") return "Funding:";
  return "System:";
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function calculateOutcome(results) {
  const labels = results.map((result) => result.label);
  const counts = labels.reduce((map, label) => {
    map[label] = (map[label] || 0) + 1;
    return map;
  }, {});

  const duplicates = Object.values(counts).sort((a, b) => b - a)[0];
  const allSame = duplicates === 3;
  const pair = duplicates === 2;

  if (allSame && labels[0] === "Token Rain") {
    return {
      winnings: 140,
      tone: "win",
      message: "Three Token Rain. The VC deck writes itself.",
    };
  }

  if (allSame && labels[0] === "Prompt Gold") {
    return {
      winnings: 90,
      tone: "win",
      message: "Three Prompt Gold. Enterprise sales just applauded.",
    };
  }

  if (allSame) {
    return {
      winnings: 55,
      tone: "win",
      message: `Triple ${labels[0]}. Weirdly profitable.`,
    };
  }

  if (pair) {
    const pairedLabel = Object.keys(counts).find((label) => counts[label] === 2);
    return {
      winnings: 20,
      tone: "win",
      message: `A pair of ${pairedLabel}. Barely enough to cover the inference bill.`,
    };
  }

  return {
    winnings: 0,
    tone: "loss",
    message: "No match. The machine converts your tokens into a keynote about disruption.",
  };
}

function animateResult(results) {
  reelElements.forEach((reel, index) => {
    reel.classList.add("spinning");
    let ticks = 0;

    const intervalId = window.setInterval(() => {
      reel.textContent = randomSymbol().label;
      ticks += 1;

      if (ticks > 8 + index * 3) {
        window.clearInterval(intervalId);
        reel.classList.remove("spinning");
        reel.textContent = results[index].label;
      }
    }, 90 + index * 20);
  });

  return new Promise((resolve) => {
    window.setTimeout(resolve, 1300);
  });
}

function flashMachine(tone) {
  const className = tone === "win" ? "flash-win" : "flash-loss";
  machineElement.classList.remove("flash-win", "flash-loss");
  machineElement.classList.add(className);

  window.setTimeout(() => {
    machineElement.classList.remove(className);
  }, 520);
}

async function handleSpin() {
  if (state.spinning || state.balance < state.spinCost) {
    return;
  }

  const spent = state.spinCost;
  state.spinning = true;
  state.balance -= spent;
  setStatus("Spinning. The model is reallocating compute from somewhere ethically ambiguous.");
  pushLog(`Spent ${spent} tokens to see if satire can become a business model.`);
  updateDashboard();

  const results = [randomSymbol(), randomSymbol(), randomSymbol()];
  await animateResult(results);

  const outcome = calculateOutcome(results);
  state.balance += outcome.winnings;
  state.streak = outcome.winnings > 0 ? state.streak + 1 : 0;
  state.spinCost = Math.min(40, 15 + state.streak * 2);
  state.spinning = false;

  const resultsText = results.map((result) => result.label).join(" | ");
  const flavor = results[Math.floor(Math.random() * results.length)].quip;
  setStatus(`${outcome.message} Reels: ${resultsText}. ${flavor}`);
  const netChange = outcome.winnings - spent;
  pushLog(`${outcome.message} Net change: ${netChange >= 0 ? "+" : ""}${netChange} tokens.`, outcome.tone);
  flashMachine(outcome.tone);
  updateDashboard();

  if (state.balance < state.spinCost) {
    setStatus("You are out of spend. Time to beg the imaginary board for more credits.");
  }
}

function handleRefill() {
  if (state.spinning) {
    return;
  }

  const bailout = 60 + Math.floor(Math.random() * 41);
  state.balance += bailout;
  state.streak = 0;
  state.spinCost = 15;
  setStatus(`Emergency funding secured: +${bailout} tokens. The board calls it disciplined capital deployment.`);
  pushLog(`Raised ${bailout} tokens after promising the machine would definitely become AGI-adjacent.`, "refill");
  updateDashboard();
}

spinButton.addEventListener("click", handleSpin);
refillButton.addEventListener("click", handleRefill);

pushLog("Machine booted. All satire systems nominal.");
updateDashboard();
