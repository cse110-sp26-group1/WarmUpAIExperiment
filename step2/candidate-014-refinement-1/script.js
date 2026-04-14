// Each symbol is encoded with Unicode escapes so the slot machine stays
// readable even in editors or terminals that do not display emoji cleanly.
const symbols = [
  "\u{1FA99}",
  "\u{1F916}",
  "\u{1F4C8}",
  "\u{1F9E0}",
  "\u{1F525}",
  "\u{1F9FE}"
];

const state = {
  balance: 1200,
  baseSpinCost: 90,
  jackpot: 1500,
  isSpinning: false,
  boostMode: false
};

// Cache the reel elements once so each spin only updates text content.
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

// Remember where each reel is so the animation can advance in order instead of
// swapping to unrelated random symbols every tick.
const reelPositions = [1, 0, 2];

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

  // Trim older messages so the feed stays punchy instead of growing forever.
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

function advanceReel(index) {
  reelPositions[index] = (reelPositions[index] + 1) % symbols.length;
  reels[index].textContent = symbols[reelPositions[index]];
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

    if (symbol === symbols[0]) {
      return {
        payout: state.jackpot,
        tone: "win",
        text: "Triple coins. Congratulations, the casino accidentally respected your budget."
      };
    }

    if (symbol === symbols[1]) {
      return {
        payout: 650,
        tone: "win",
        text: "Three robots. The board calls this fully autonomous revenue."
      };
    }

    if (symbol === symbols[2]) {
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

function spinReel(index, steps, delay) {
  return new Promise((resolve) => {
    let remainingSteps = steps;
    const interval = setInterval(() => {
      advanceReel(index);
      remainingSteps -= 1;

      if (remainingSteps <= 0) {
        clearInterval(interval);
        reels[index].classList.remove("spinning");
        resolve(reels[index].textContent);
      }
    }, delay);
  });
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

  // Fire all reels together, then let them stop one after another to make the
  // motion feel like a real cabinet instead of three isolated text swaps.
  reels.forEach((reel) => reel.classList.add("spinning"));
  const result = await Promise.all(
    reels.map((_, index) => spinReel(index, 16 + index * 7, 70 + index * 10))
  );

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

// Sync the initial screen with the known reel order before the first spin.
reels.forEach((reel, index) => {
  reel.textContent = symbols[reelPositions[index]];
});

addFeedEntry("<strong>Launch:</strong> Token Tilter 3000 is live and fiscally irresponsible.");
addFeedEntry("<strong>Advice:</strong> if you win big, call it emergent intelligence.");
updateDisplay();
