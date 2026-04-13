const SYMBOLS = ["🤖", "🪙", "🧠", "🔥", "🧻", "📉", "✨"];
const INITIAL_STATE = {
  tokens: 120,
  bet: 15,
  streak: 0,
};

const reels = [...document.querySelectorAll(".reel")];
const machine = document.querySelector(".machine");
const tokenBalance = document.querySelector("#token-balance");
const betDisplay = document.querySelector("#bet-display");
const streakDisplay = document.querySelector("#streak-display");
const messageText = document.querySelector("#message-text");
const spendText = document.querySelector("#spend-text");
const betRange = document.querySelector("#bet-range");
const spinButton = document.querySelector("#spin-button");

let state = loadState();
let isSpinning = false;

render();

betRange.addEventListener("input", (event) => {
  state.bet = Number(event.target.value);
  render();
  saveState();
});

spinButton.addEventListener("click", async () => {
  if (isSpinning) return;

  if (state.tokens < state.bet) {
    state.tokens += 40;
    state.streak = 0;
    messageText.textContent =
      "You were out of tokens, so the machine sold your browsing history to buy 40 more.";
    spendText.textContent =
      "Emergency refill: 0 tokens spent, but your dignity took a measurable hit.";
    render();
    saveState();
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  state.tokens -= state.bet;
  render();

  const result = await animateSpin();
  const round = evaluateSpin(result, state.bet);
  const spend = calculateSpend(round.payout, result);

  state.tokens += round.payout;
  state.tokens = Math.max(0, state.tokens - spend.cost);
  state.streak = round.payout > state.bet ? state.streak + 1 : 0;

  updateMessages(round, spend, result);
  render(result, round.payout > state.bet);
  saveState();

  if ("vibrate" in navigator) {
    navigator.vibrate(round.payout > state.bet ? [90, 50, 140] : [35]);
  }

  isSpinning = false;
  spinButton.disabled = false;
});

function render(result = SYMBOLS.slice(0, 3), won = false) {
  reels.forEach((reel, index) => {
    reel.textContent = result[index];
    reel.classList.toggle("spinning", false);
  });

  tokenBalance.textContent = state.tokens;
  betDisplay.textContent = state.bet;
  streakDisplay.textContent = state.streak;
  betRange.value = String(state.bet);
  spinButton.textContent =
    state.tokens < state.bet
      ? "Beg For More Tokens"
      : `Spin For ${state.bet} Tokens`;

  machine.classList.toggle("is-winning", won);
}

async function animateSpin() {
  const result = randomSymbols();

  const revealPromises = reels.map((reel, index) => {
    reel.classList.add("spinning");

    return new Promise((resolve) => {
      const duration = 500 + index * 220;
      const intervalId = window.setInterval(() => {
        reel.textContent = pickSymbol();
      }, 90);

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        reel.classList.remove("spinning");
        reel.textContent = result[index];
        resolve();
      }, duration);
    });
  });

  await Promise.all(revealPromises);
  return result;
}

function randomSymbols() {
  return Array.from({ length: 3 }, () => pickSymbol());
}

function pickSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function evaluateSpin(result, bet) {
  const counts = countSymbols(result);
  const values = Object.values(counts);
  const [first] = result;
  const allSame = values.includes(3);
  const anyPair = values.includes(2);

  if (allSame && first === "🔥") {
    return {
      payout: bet * 6,
      message:
        "Triple fire. Congratulations, your vaporware demo just raised a chaotic amount of fake capital.",
    };
  }

  if (allSame && first === "🪙") {
    return {
      payout: bet * 5,
      message:
        "Triple tokens. A venture capitalist nodded solemnly and called this sustainable.",
    };
  }

  if (allSame && first === "🤖") {
    return {
      payout: bet * 4,
      message:
        "Three bots aligned. They have formed a committee and accidentally paid you.",
    };
  }

  if (allSame) {
    return {
      payout: bet * 3,
      message:
        "A full match. The machine believes this was intentional and is rewarding your confidence.",
    };
  }

  if (anyPair) {
    return {
      payout: bet * 2,
      message:
        "You hit a pair. That is more than enough evidence for an AI startup pitch deck.",
    };
  }

  return {
    payout: 0,
    message:
      "No meaningful pattern detected. Please rephrase your ambition and try again.",
  };
}

function calculateSpend(payout, result) {
  if (payout === 0) {
    return {
      cost: 0,
      description: "No winnings, so even the fake consultants left you alone this round.",
    };
  }

  const spendEvents = [
    "Spent <cost> tokens on 'Enterprise Prompt Governance'. It is just a renamed checklist.",
    "Burned <cost> tokens generating a 40-slide deck titled 'Why The Bot Feels Synergistic'.",
    "Donated <cost> tokens to an accelerator for AI-powered sandwich forecasting.",
    "Lost <cost> tokens to premium autocomplete because typing whole words is apparently legacy behavior.",
    "Spent <cost> tokens on GPU incense and an ergonomic mechanical keyboard for the model.",
  ];

  let tier = payout >= 60 ? 0.42 : payout >= 30 ? 0.28 : 0.18;

  if (result.includes("🧻")) {
    tier = Math.max(0.08, tier - 0.12);
  }

  const cost = Math.min(payout, Math.max(1, Math.round(payout * tier)));
  const template = spendEvents[Math.floor(Math.random() * spendEvents.length)];

  return {
    cost,
    description: template.replace("<cost>", String(cost)),
  };
}

function updateMessages(round, spend, result) {
  const symbolFlavor = flavorText(result);
  messageText.textContent = `${round.message} ${symbolFlavor}`;
  spendText.textContent = spend.description;
}

function flavorText(result) {
  if (result.includes("📉")) {
    return "A tiny line chart appeared, which investors found weirdly reassuring.";
  }

  if (result.includes("🧠")) {
    return "One reel insisted it was reasoning, which is not the same as being correct.";
  }

  if (result.includes("✨")) {
    return "At least one symbol sparkled hard enough to count as product strategy.";
  }

  return "The machine made a startup noise and called it intelligence.";
}

function countSymbols(result) {
  return result.reduce((accumulator, symbol) => {
    accumulator[symbol] = (accumulator[symbol] || 0) + 1;
    return accumulator;
  }, {});
}

function loadState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem("token-gobbler-state"));
    if (!saved) return { ...INITIAL_STATE };
    return {
      tokens: Number(saved.tokens) || INITIAL_STATE.tokens,
      bet: Number(saved.bet) || INITIAL_STATE.bet,
      streak: Number(saved.streak) || INITIAL_STATE.streak,
    };
  } catch {
    return { ...INITIAL_STATE };
  }
}

function saveState() {
  window.localStorage.setItem("token-gobbler-state", JSON.stringify(state));
}
