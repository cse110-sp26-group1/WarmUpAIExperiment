const symbols = ["🤖", "🪙", "🔥", "🧠", "⚡", "🧾", "🧃"];
const moods = [
  "Confident",
  "Overfit",
  "Rate-Limited",
  "Pitching Synergy",
  "Vaguely Aligned",
  "Benchmarking"
];

const tokenBalance = document.getElementById("token-balance");
const spinCostLabel = document.getElementById("spin-cost");
const machineMood = document.getElementById("machine-mood");
const resultMessage = document.getElementById("result-message");
const spinButton = document.getElementById("spin-button");
const upgradeButton = document.getElementById("upgrade-button");
const reels = Array.from(document.querySelectorAll(".reel"));

const state = {
  balance: 120,
  spinCost: 15,
  upgradeLevel: 0,
  isSpinning: false
};

const specialPayouts = new Map([
  ["🤖🤖🤖", { amount: 90, message: "Triple bot. The demo audience believes every chart immediately." }],
  ["🪙🪙🪙", { amount: 60, message: "All coins. Congratulations on inventing fintech but louder." }],
  ["🔥🔥🔥", { amount: 45, message: "Triple fire. Your GPUs are now technically a religion." }],
  ["🧠⚡🤖", { amount: 35, message: "Brain-lightning-bot. A keynote deck assembles itself in the cloud." }]
]);

function updateUi() {
  tokenBalance.textContent = String(state.balance);
  spinCostLabel.textContent = String(state.spinCost);
  spinButton.disabled = state.isSpinning || state.balance < state.spinCost;
  upgradeButton.disabled = state.isSpinning || state.balance < upgradePrice();
}

function upgradePrice() {
  return 40 + state.upgradeLevel * 25;
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function setMood() {
  machineMood.textContent = moods[Math.floor(Math.random() * moods.length)];
}

function clearReelStates() {
  reels.forEach((reel) => {
    reel.classList.remove("win", "loss");
  });
}

function evaluateSpin(result) {
  const combo = result.join("");

  if (specialPayouts.has(combo)) {
    return specialPayouts.get(combo);
  }

  if (result.includes("🧾")) {
    return { amount: -12, message: "An enterprise invoice appeared. Nobody knows who approved it." };
  }

  if (new Set(result).size === 2) {
    return { amount: 18, message: "A pair hit. Investors call this recurring revenue." };
  }

  if (new Set(result).size === 1) {
    return { amount: 28, message: "Three of a kind, just not the expensive one." };
  }

  return { amount: 0, message: "No payout. The model asks whether you'd like to try a premium tier." };
}

function finishSpin(result) {
  state.isSpinning = false;
  clearReelStates();

  const outcome = evaluateSpin(result);
  state.balance += outcome.amount;

  const cssClass = outcome.amount > 0 ? "win" : outcome.amount < 0 ? "loss" : "";
  reels.forEach((reel) => {
    if (cssClass) {
      reel.classList.add(cssClass);
    }
  });

  const deltaText = outcome.amount > 0 ? `+${outcome.amount}` : String(outcome.amount);
  resultMessage.textContent = `${outcome.message} Net token swing: ${deltaText}.`;
  setMood();

  if (state.balance < state.spinCost) {
    resultMessage.textContent += " Wallet critically low. Maybe sell a course about prompt engineering.";
  }

  updateUi();
}

function spin() {
  if (state.isSpinning || state.balance < state.spinCost) {
    return;
  }

  state.isSpinning = true;
  state.balance -= state.spinCost;
  clearReelStates();
  resultMessage.textContent = `Spending ${state.spinCost} tokens to consult the silicon oracle...`;
  updateUi();

  const finalResult = reels.map(() => randomSymbol());

  reels.forEach((reel, index) => {
    reel.classList.add("spinning");

    const intervalId = window.setInterval(() => {
      reel.textContent = randomSymbol();
    }, 90);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      reel.classList.remove("spinning");
      reel.textContent = finalResult[index];

      if (index === reels.length - 1) {
        finishSpin(finalResult);
      }
    }, 650 + index * 260);
  });
}

function buyUpgrade() {
  const price = upgradePrice();

  if (state.isSpinning || state.balance < price) {
    return;
  }

  state.balance -= price;
  state.upgradeLevel += 1;
  state.spinCost += 5;
  setMood();
  resultMessage.textContent =
    `You spent ${price} tokens on "Context Window XL". Spins now cost ${state.spinCost}, but your confidence is up 300%.`;
  updateUi();
}

spinButton.addEventListener("click", spin);
upgradeButton.addEventListener("click", buyUpgrade);

updateUi();
