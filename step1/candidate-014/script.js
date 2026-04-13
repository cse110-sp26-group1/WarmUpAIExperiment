const symbols = ["🪙", "🤖", "📈", "🧠", "🔥", "🧾"];

const state = {
  balance: 1200,
  baseSpinCost: 90,
  jackpot: 1500,
  isSpinning: false,
  boostMode: false
};

const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2")
];

const tokenBalance = document.getElementById("tokenBalance");
const spinCost = document.getElementById("spinCost");
const jackpotValue = document.getElementById("jackpotValue");
const message = document.getElementById("message");
const eventFeed = document.getElementById("eventFeed");
const feedItemTemplate = document.getElementById("feedItemTemplate");
const spinButton = document.getElementById("spinButton");
const boostButton = document.getElementById("boostButton");

const quips = {
  nearMiss: [
    "Two matching reels. The AI says that counts as 94% accurate.",
    "You almost won, which is how enterprise pricing gets justified.",
    "So close. A dashboard will still describe this as exceptional throughput."
  ],
  noMatch: [
    "No match. Somewhere a chatbot called this an edge case.",
    "That spin burned tokens faster than a team adding agents to a slide deck.",
    "The model hallucinated a jackpot and invoiced you for confidence."
  ],
  broke: [
    "Wallet empty. Time to pivot into consulting about responsible token usage.",
    "You are out of tokens, but rich in learnings and vague product vision.",
    "Bankrupt. Finance suggests calling the loss a strategic retraining cycle."
  ]
};

function currentSpinCost() {
  return state.boostMode ? state.baseSpinCost + 60 : state.baseSpinCost;
}

function formatTokens(value) {
  return value.toLocaleString();
}

function setMessage(text, tone = "") {
  message.textContent = text;
  message.className = `message ${tone}`.trim();
}

function addFeedEntry(text) {
  const item = feedItemTemplate.content.firstElementChild.cloneNode(true);
  item.innerHTML = text;
  eventFeed.prepend(item);

  while (eventFeed.children.length > 6) {
    eventFeed.lastElementChild.remove();
  }
}

function updateDisplay() {
  tokenBalance.textContent = formatTokens(state.balance);
  spinCost.textContent = formatTokens(currentSpinCost());
  jackpotValue.textContent = formatTokens(state.jackpot);
  boostButton.textContent = state.boostMode ? 'Disable "Pro" Spin' : 'Buy "Pro" Spin';
}

function pickRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function scoreSpin(result) {
  const counts = result.reduce((acc, symbol) => {
    acc[symbol] = (acc[symbol] || 0) + 1;
    return acc;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const isThreeMatch = values[0] === 3;
  const isTwoMatch = values[0] === 2;

  if (isThreeMatch) {
    const [symbol] = Object.keys(counts);

    if (symbol === "🪙") {
      return {
        payout: state.jackpot,
        tone: "win",
        text: "Triple coins. Congratulations, the casino accidentally respected your budget."
      };
    }

    if (symbol === "🤖") {
      return {
        payout: 650,
        tone: "win",
        text: "Three robots. The board calls this fully autonomous revenue."
      };
    }

    if (symbol === "📈") {
      return {
        payout: 400,
        tone: "win",
        text: "Triple charts. Nobody knows why the graph is up, but tokens are flowing."
      };
    }

    return {
      payout: 250,
      tone: "win",
      text: "Three of a kind. A keynote presenter just used the word disruption."
    };
  }

  if (isTwoMatch) {
    return {
      payout: 0,
      tone: "loss",
      text: quips.nearMiss[Math.floor(Math.random() * quips.nearMiss.length)]
    };
  }

  return {
    payout: 0,
    tone: "loss",
    text: quips.noMatch[Math.floor(Math.random() * quips.noMatch.length)]
  };
}

function setControlsDisabled(disabled) {
  spinButton.disabled = disabled;
  boostButton.disabled = disabled;
}

async function spin() {
  const cost = currentSpinCost();

  if (state.isSpinning) {
    return;
  }

  if (state.balance < cost) {
    setMessage(quips.broke[Math.floor(Math.random() * quips.broke.length)], "loss");
    addFeedEntry("<strong>Billing Update:</strong> insufficient tokens for another act of courage.");
    return;
  }

  state.isSpinning = true;
  state.balance -= cost;
  updateDisplay();
  setControlsDisabled(true);
  setMessage("Spinning... please wait while the model monetizes suspense.");

  reels.forEach((reel) => reel.classList.add("spinning"));

  const result = [];

  for (let index = 0; index < reels.length; index += 1) {
    await new Promise((resolve) => {
      let ticks = 0;
      const interval = setInterval(() => {
        reels[index].textContent = pickRandomSymbol();
        ticks += 1;

        if (ticks > 7 + index * 4) {
          clearInterval(interval);
          const finalSymbol = pickRandomSymbol();
          result[index] = finalSymbol;
          reels[index].textContent = finalSymbol;
          reels[index].classList.remove("spinning");
          resolve();
        }
      }, 90);
    });
  }

  const outcome = scoreSpin(result);
  state.balance += outcome.payout;

  if (outcome.payout === state.jackpot) {
    state.jackpot += 250;
  }

  if (state.boostMode) {
    state.jackpot += 50;
  }

  setMessage(outcome.text, outcome.tone);
  updateDisplay();
  addFeedEntry(
    `<strong>${result.join(" ")}</strong> paid <strong>${formatTokens(outcome.payout)}</strong> tokens. ${outcome.text}`
  );

  setControlsDisabled(false);
  state.isSpinning = false;
}

function toggleBoost() {
  if (state.isSpinning) {
    return;
  }

  state.boostMode = !state.boostMode;
  setMessage(
    state.boostMode
      ? 'Pro spin enabled. Costs more, sounds smarter, and reassures management.'
      : "Pro spin disabled. Back to regular-grade speculative computing."
  );
  addFeedEntry(
    state.boostMode
      ? '<strong>Monetization:</strong> "Pro" mode enabled for premium confidence.'
      : "<strong>Monetization:</strong> reverted to baseline token combustion."
  );
  updateDisplay();
}

spinButton.addEventListener("click", spin);
boostButton.addEventListener("click", toggleBoost);

addFeedEntry("<strong>Launch:</strong> Token Tilter 3000 is live and fiscally irresponsible.");
addFeedEntry("<strong>Advice:</strong> if you win big, call it emergent intelligence.");
updateDisplay();
