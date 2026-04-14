const symbols = ["🤖", "🪙", "📈", "🔥", "🧠", "💸"];

const spinCost = 15;
let balance = 150;
let isSpinning = false;

const reels = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3"),
];

const tokenBalance = document.getElementById("token-balance");
const lastPayout = document.getElementById("last-payout");
const message = document.getElementById("message");
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");
const expenseList = document.getElementById("expense-list");
const expenseTemplate = document.getElementById("expense-template");

const spinMessages = [
  "Deploying another premium thought bubble to the cloud.",
  "Your prompts are entering a monetization tunnel.",
  "Calibrating confidence levels far above the evidence.",
  "Burning tokens to summon one more overexplained paragraph.",
];

const spendingReasons = [
  "Enterprise vibe alignment",
  "Premium chain-of-thought garnish",
  "A founder-branded GPU candle",
  "Context window stretching class",
  "24-hour autonomous pivot agent",
  "Synthetic keynote applause pack",
  "A deck slide with the word transformation",
  "High-frequency jargon compiler",
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function updateLedger(payout = 0) {
  tokenBalance.textContent = String(balance);
  lastPayout.textContent = payout > 0 ? `+${payout}` : String(payout);
}

function syncButtons() {
  spinButton.disabled = isSpinning || balance < spinCost;
}

function addExpense(cost) {
  const item = expenseTemplate.content.firstElementChild.cloneNode(true);
  item.querySelector(".expense-name").textContent = randomItem(spendingReasons);
  item.querySelector(".expense-cost").textContent = `-${cost}`;
  expenseList.prepend(item);

  while (expenseList.children.length > 5) {
    expenseList.removeChild(expenseList.lastElementChild);
  }
}

function getPayout(result) {
  const [a, b, c] = result;

  if (a === "🪙" && b === "🪙" && c === "🪙") {
    return {
      payout: 120,
      text: "Jackpot. The tokenomics chart went vertical for no defensible reason.",
    };
  }

  if (a === "🤖" && b === "🤖" && c === "🤖") {
    return {
      payout: 90,
      text: "Triple bot. The demo said 'revolutionary' and investors nodded anyway.",
    };
  }

  if (a === "📈" && b === "📈" && c === "📈") {
    return {
      payout: 70,
      text: "Line go up. Congratulations on your fully AI-adjacent revenue story.",
    };
  }

  if (a === b || b === c || a === c) {
    return {
      payout: 25,
      text: "Two symbols matched. That counts as product-market fit in this sector.",
    };
  }

  return {
    payout: 0,
    text: "No match. The model used all your tokens to write a polite shrug.",
  };
}

function playFeedback(payout) {
  if (!("AudioContext" in window || "webkitAudioContext" in window)) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const context = new AudioCtx();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = payout > 0 ? "triangle" : "sawtooth";
  oscillator.frequency.value = payout > 0 ? 660 : 180;
  gain.gain.value = 0.001;

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
  oscillator.stop(context.currentTime + 0.34);
}

function celebrate() {
  if ("vibrate" in navigator) {
    navigator.vibrate([80, 40, 100]);
  }
}

async function animateReels(finalSymbols) {
  const cycles = [12, 16, 20];

  await Promise.all(
    reels.map((reel, index) => {
      reel.classList.add("spinning");

      return new Promise((resolve) => {
        let tick = 0;
        const interval = window.setInterval(() => {
          reel.textContent = randomItem(symbols);
          tick += 1;

          if (tick >= cycles[index]) {
            window.clearInterval(interval);
            reel.classList.remove("spinning");
            reel.textContent = finalSymbols[index];
            resolve();
          }
        }, 90 + index * 25);
      });
    })
  );
}

async function handleSpin() {
  if (isSpinning || balance < spinCost) {
    return;
  }

  isSpinning = true;
  balance -= spinCost;
  updateLedger(0);
  addExpense(spinCost);
  message.textContent = randomItem(spinMessages);
  syncButtons();

  const result = Array.from({ length: 3 }, () => randomItem(symbols));
  await animateReels(result);

  const outcome = getPayout(result);
  balance += outcome.payout;
  updateLedger(outcome.payout);
  message.textContent = outcome.text;
  playFeedback(outcome.payout);

  if (outcome.payout > 0) {
    reels.forEach((reel) => {
      reel.classList.remove("winner");
      void reel.offsetWidth;
      reel.classList.add("winner");
    });
    celebrate();
  }

  if (balance < spinCost) {
    message.textContent += " You're out of tokens, which means you've achieved authentic AI startup realism.";
    spinButton.textContent = "Need More Hype";
  }

  isSpinning = false;
  syncButtons();
}

function resetGame() {
  balance = 150;
  isSpinning = false;
  expenseList.innerHTML = "";
  reels.forEach((reel, index) => {
    reel.textContent = symbols[index];
    reel.classList.remove("winner", "spinning");
  });
  spinButton.textContent = "Spin For Insight";
  message.textContent = "Fresh funding secured. Time to convert more venture capital into benchmark theater.";
  updateLedger(0);

  for (let index = 0; index < 3; index += 1) {
    addExpense(Math.floor(Math.random() * 9) + 3);
  }

  syncButtons();
}

spinButton.addEventListener("click", handleSpin);
resetButton.addEventListener("click", resetGame);

updateLedger();
for (let index = 0; index < 3; index += 1) {
  addExpense(Math.floor(Math.random() * 9) + 3);
}
syncButtons();
