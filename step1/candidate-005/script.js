const symbols = [
  "GPU",
  "Prompt",
  "Buzzword",
  "Token",
  "Hype",
  "Hallucination",
  "Synergy",
  "Pivot",
];

const outcomeTemplates = {
  jackpot: [
    {
      title: "Benchmark miracle",
      copy: "Three of a kind. Investors are calling this emergent value.",
      multiplier: 6,
    },
    {
      title: "Series A slot hit",
      copy: "The reels aligned and your deck somehow got funded.",
      multiplier: 5,
    },
  ],
  pair: [
    {
      title: "Partial alignment",
      copy: "Two symbols matched. Close enough for a keynote chart.",
      multiplier: 2,
    },
    {
      title: "Pilot program energy",
      copy: "Not a breakthrough, but somebody will still write a LinkedIn post.",
      multiplier: 1.5,
    },
  ],
  miss: [
    {
      title: "Inference overspend",
      copy: "No match. The tokens have been reinvested into vibes.",
      multiplier: 0,
    },
    {
      title: "Classic hallucination",
      copy: "The model sounded confident, which is basically the same as correct.",
      multiplier: 0,
    },
  ],
};

const state = {
  balance: 1200,
  spent: 0,
  jackpots: 0,
  bet: 75,
  spinning: false,
};

const reelElements = [
  document.getElementById("reel1"),
  document.getElementById("reel2"),
  document.getElementById("reel3"),
];

const balanceElement = document.getElementById("balance");
const statusPill = document.getElementById("statusPill");
const spentTokensElement = document.getElementById("spentTokens");
const jackpotCountElement = document.getElementById("jackpotCount");
const betRange = document.getElementById("betRange");
const betValue = document.getElementById("betValue");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const outcomeTitle = document.getElementById("outcomeTitle");
const outcomeCopy = document.getElementById("outcomeCopy");
const eventLog = document.getElementById("eventLog");

function rand(max) {
  return Math.floor(Math.random() * max);
}

function choose(items) {
  return items[rand(items.length)];
}

function formatTokens(value) {
  return new Intl.NumberFormat().format(Math.round(value));
}

function renderStats() {
  balanceElement.textContent = formatTokens(state.balance);
  spentTokensElement.textContent = formatTokens(state.spent);
  jackpotCountElement.textContent = String(state.jackpots);
  betValue.textContent = String(state.bet);

  spinButton.disabled = state.spinning || state.balance < state.bet;
  if (state.balance < state.bet) {
    statusPill.textContent = "Out of tokens: even the demo budget is gone";
  }
}

function addLog(message) {
  const entry = document.createElement("li");
  entry.innerHTML = message;
  eventLog.prepend(entry);

  while (eventLog.children.length > 6) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

function updateOutcome(title, copy, tone) {
  outcomeTitle.textContent = title;
  outcomeCopy.textContent = copy;

  if (tone === "win") {
    statusPill.textContent = "Model confidence: suspiciously justified";
  } else if (tone === "pair") {
    statusPill.textContent = "Model confidence: shipping anyway";
  } else {
    statusPill.textContent = "Model confidence: statistically theatrical";
  }
}

function evaluateSpin(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const maxMatch = Math.max(...Object.values(counts));
  if (maxMatch === 3) {
    return { type: "jackpot", multiplier: choose(outcomeTemplates.jackpot) };
  }
  if (maxMatch === 2) {
    return { type: "pair", multiplier: choose(outcomeTemplates.pair) };
  }
  return { type: "miss", multiplier: choose(outcomeTemplates.miss) };
}

function applyReelState(results, didWin) {
  reelElements.forEach((element, index) => {
    element.textContent = results[index];
    element.classList.remove("spinning");
    element.classList.toggle("win", didWin);
  });
}

async function spin() {
  if (state.spinning || state.balance < state.bet) {
    return;
  }

  state.spinning = true;
  state.balance -= state.bet;
  state.spent += state.bet;
  reelElements.forEach((element) => {
    element.classList.remove("win");
    element.classList.add("spinning");
  });
  renderStats();

  const spinSteps = 12;
  for (let step = 0; step < spinSteps; step += 1) {
    reelElements.forEach((element) => {
      element.textContent = choose(symbols);
    });
    // A tiny delay gives the reels a platform-native animated feel.
    await new Promise((resolve) => window.setTimeout(resolve, 70));
  }

  const results = reelElements.map(() => choose(symbols));
  const evaluation = evaluateSpin(results);
  const payout = Math.round(state.bet * evaluation.multiplier.multiplier);
  state.balance += payout;

  if (evaluation.type === "jackpot") {
    state.jackpots += 1;
  }

  applyReelState(results, evaluation.type !== "miss");
  updateOutcome(
    evaluation.multiplier.title,
    evaluation.multiplier.copy,
    evaluation.type === "jackpot" ? "win" : evaluation.type
  );

  if (payout > 0) {
    addLog(
      `<strong>+${formatTokens(payout)} tokens</strong> from ${results.join(
        " / "
      )}. Finance called it “repeatable AI revenue.”`
    );
  } else {
    addLog(
      `<strong>-${formatTokens(state.bet)} tokens</strong> on ${results.join(
        " / "
      )}. The burn rate remains beautifully on-brand.`
    );
  }

  state.spinning = false;
  renderStats();
}

function resetGame() {
  state.balance = 1200;
  state.spent = 0;
  state.jackpots = 0;
  state.bet = 75;
  state.spinning = false;

  betRange.value = String(state.bet);
  reelElements.forEach((element) => {
    element.textContent = "GPU";
    element.classList.remove("spinning", "win");
  });

  outcomeTitle.textContent = "Waiting for the first hallucination";
  outcomeCopy.textContent = "Three reels. Zero benchmarks. Endless confidence.";
  statusPill.textContent = "Model confidence: unreasonably high";
  eventLog.innerHTML = "";
  addLog("<strong>Fresh budget approved.</strong> Nobody asked what the tokens actually do.");
  renderStats();
}

betRange.addEventListener("input", (event) => {
  state.bet = Number(event.target.value);
  renderStats();
});

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

resetGame();
