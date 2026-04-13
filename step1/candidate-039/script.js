const symbols = ["🤖", "🪙", "🔥", "📉", "🧠", "🤡"];
const spinCost = 15;
const startingBalance = 120;

const reels = Array.from(document.querySelectorAll(".reel"));
const balanceNode = document.getElementById("balance");
const payoutNode = document.getElementById("last-payout");
const messageNode = document.getElementById("message");
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");

let balance = startingBalance;
let spinning = false;

function updateDisplay(lastPayout = 0) {
  balanceNode.textContent = String(balance);
  payoutNode.textContent = String(lastPayout);
  spinButton.disabled = spinning || balance < spinCost;
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function countMatches(result) {
  return result.reduce((counts, symbol) => {
    counts[symbol] = (counts[symbol] || 0) + 1;
    return counts;
  }, {});
}

function evaluateSpin(result) {
  const counts = countMatches(result);

  if (counts["🪙"] === 3) {
    return {
      payout: 90,
      message: "Jackpot. The machine briefly admits tokens might be a fake economy."
    };
  }

  if (counts["🤖"] === 3) {
    return {
      payout: 65,
      message: "Three bots aligned. Somewhere a startup just added 'agentic' to its homepage."
    };
  }

  if (counts["🔥"] === 3) {
    return {
      payout: 40,
      message: "All flames. Incredible engagement, questionable revenue."
    };
  }

  if (Object.values(counts).includes(3)) {
    return {
      payout: 30,
      message: "Triple match. A less marketable miracle, but still profitable."
    };
  }

  if (Object.values(counts).includes(2)) {
    return {
      payout: 20,
      message: "A pair. The algorithm calls that a 'meaningful signal.'"
    };
  }

  if (counts["🤡"]) {
    return {
      payout: 5,
      message: "A clown appeared. The system issues pity tokens and a vague roadmap."
    };
  }

  return {
    payout: 0,
    message: "No match. Your tokens have been successfully converted into executive optimism."
  };
}

function setMessage(text) {
  messageNode.textContent = text;
}

function animateSpin(finalSymbols) {
  return Promise.all(
    reels.map((reel, index) => new Promise((resolve) => {
      reel.classList.remove("win");
      reel.classList.add("spinning");

      const intervalId = window.setInterval(() => {
        reel.textContent = randomSymbol();
      }, 90);

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        reel.classList.remove("spinning");
        reel.textContent = finalSymbols[index];
        resolve();
      }, 700 + index * 320);
    }))
  );
}

async function spin() {
  if (spinning || balance < spinCost) {
    return;
  }

  spinning = true;
  balance -= spinCost;
  updateDisplay(0);
  setMessage("Spinning up three proprietary inference engines. Accountability disabled.");

  const result = Array.from({ length: 3 }, randomSymbol);
  await animateSpin(result);

  const outcome = evaluateSpin(result);
  balance += outcome.payout;
  updateDisplay(outcome.payout);
  setMessage(`${result.join(" ")} - ${outcome.message}`);

  if (outcome.payout > 0) {
    reels.forEach((reel) => reel.classList.add("win"));
  }

  spinning = false;
  updateDisplay(outcome.payout);

  if (balance < spinCost) {
    setMessage(
      `${result.join(" ")} — ${outcome.message} You are out of tokens. Even the AI thinks this monetization went too far.`
      `${result.join(" ")} - ${outcome.message} You are out of tokens. Even the AI thinks this monetization went too far.`
    );
  }
}

function resetGame() {
  balance = startingBalance;
  spinning = false;
  reels.forEach((reel, index) => {
    reel.classList.remove("spinning", "win");
    reel.textContent = symbols[index];
  });
  updateDisplay(0);
  setMessage("Fresh funding round secured. The token stash has been restored to 120.");
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

updateDisplay(0);
