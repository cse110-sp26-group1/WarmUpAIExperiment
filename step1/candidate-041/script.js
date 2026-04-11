const symbols = ["🤖", "🪙", "🧠", "🔥", "📉", "🧾", "💸", "🛰️"];
const spinCost = 15;
const startingTokens = 120;

const reelElements = [
  document.getElementById("reel1"),
  document.getElementById("reel2"),
  document.getElementById("reel3"),
];

const tokenBalance = document.getElementById("tokenBalance");
const hypeMeter = document.getElementById("hypeMeter");
const statusMessage = document.getElementById("statusMessage");
const subMessage = document.getElementById("subMessage");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");

let tokens = startingTokens;
let spinning = false;

const pairMessages = [
  "Two matching symbols. The pitch deck calls this product-market fit.",
  "A pair landed. Congratulations on discovering synthetic traction.",
  "Not quite a jackpot, but close enough for a conference keynote.",
];

const missMessages = [
  "No match. The machine reframed your loss as an innovation investment.",
  "Nothing aligned. Classic AI launch: impressive animation, no margin.",
  "Total miss. Your tokens were successfully converted into GPU warmth.",
];

const jackpotMessages = {
  "🤖": "Triple bots. The agents unionized and demanded a revenue share.",
  "🪙": "Triple tokens. Nobody knows what they do, which boosted sentiment.",
  "🧠": "Triple brains. You sold autocomplete as destiny and someone bought it.",
  "🔥": "Triple fire. The data center is gone, but engagement is up.",
  "📉": "Triple chart collapse. Somehow the market called this a buying opportunity.",
  "🧾": "Triple receipts. Audit trail complete: the hype was definitely billable.",
  "💸": "Triple cash burn. You lost money so confidently it looped into profit.",
  "🛰️": "Triple satellites. You put a chatbot in orbit for no operational reason.",
};

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function updateDisplay() {
  tokenBalance.textContent = String(tokens);

  if (tokens >= 100) {
    hypeMeter.textContent = "overfit";
  } else if (tokens >= 45) {
    hypeMeter.textContent = "seeded";
  } else if (tokens > 0) {
    hypeMeter.textContent = "pivoting";
  } else {
    hypeMeter.textContent = "bankrupt";
  }

  spinButton.disabled = spinning || tokens < spinCost;
}

function evaluateSpin(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, highestCount] = entries[0];

  if (highestCount === 3) {
    switch (topSymbol) {
      case "🤖":
        return { payout: 90, headline: jackpotMessages[topSymbol], detail: "The model demanded equity, stock options, and a podcast studio." };
      case "🪙":
        return { payout: 75, headline: jackpotMessages[topSymbol], detail: "Speculation remains undefeated against practical use cases." };
      case "🧠":
        return { payout: 60, headline: jackpotMessages[topSymbol], detail: "Enterprise buyers applauded the exact same feature with a new name." };
      case "🔥":
        return { payout: 10, headline: jackpotMessages[topSymbol], detail: "The outage was repositioned as a scarcity event." };
      default:
        return { payout: 45, headline: jackpotMessages[topSymbol], detail: "Absurd outcome accepted. The market refuses to learn." };
    }
  }

  if (highestCount === 2) {
    return {
      payout: 20,
      headline: pairMessages[Math.floor(Math.random() * pairMessages.length)],
      detail: "One analyst called it momentum. Nobody asked a follow-up question.",
    };
  }

  return {
    payout: 0,
    headline: missMessages[Math.floor(Math.random() * missMessages.length)],
    detail: "Try again after rebranding the same model as an AI operating system.",
  };
}

async function animateSpin() {
  spinning = true;
  updateDisplay();
  statusMessage.textContent = "Spinning the monetization engine...";
  subMessage.textContent = "Please wait while the algorithm extracts value from vibes.";

  const results = [];

  for (let i = 0; i < reelElements.length; i += 1) {
    const reel = reelElements[i];
    reel.classList.add("spinning");

    for (let tick = 0; tick < 11 + i * 3; tick += 1) {
      reel.textContent = randomSymbol();
      await sleep(70);
    }

    const finalSymbol = randomSymbol();
    results.push(finalSymbol);
    reel.textContent = finalSymbol;
    reel.classList.remove("spinning");
    await sleep(120);
  }

  const outcome = evaluateSpin(results);
  tokens += outcome.payout;

  statusMessage.textContent = outcome.headline;
  subMessage.textContent = outcome.payout > 0
    ? `Net result: -${spinCost} + ${outcome.payout} tokens. ${outcome.detail}`
    : `Net result: -${spinCost} tokens. ${outcome.detail}`;

  if (tokens <= 0) {
    tokens = 0;
    statusMessage.textContent = "Token reserves depleted. The startup is now a thought leadership newsletter.";
    subMessage.textContent = "Reset the game to solicit another round of unquestioning capital.";
  }

  spinning = false;
  updateDisplay();
}

spinButton.addEventListener("click", async () => {
  if (spinning || tokens < spinCost) {
    return;
  }

  tokens -= spinCost;
  await animateSpin();
});

resetButton.addEventListener("click", () => {
  tokens = startingTokens;
  spinning = false;
  reelElements.forEach((reel, index) => {
    reel.classList.remove("spinning");
    reel.textContent = symbols[index];
  });
  statusMessage.textContent = "Fresh funding secured. The machine is ready to waste capital again.";
  subMessage.textContent = "You are back to 120 tokens and one irresponsible amount of optimism.";
  updateDisplay();
});

updateDisplay();
