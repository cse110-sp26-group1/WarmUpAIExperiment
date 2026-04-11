const symbols = ["🤖", "🪙", "🔥", "🧠", "📉", "💸"];
const spinCost = 15;

const reels = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3"),
];

const balanceEl = document.getElementById("balance");
const lastPayoutEl = document.getElementById("last-payout");
const statusMessageEl = document.getElementById("status-message");
const spinButton = document.getElementById("spin-button");
const refillButton = document.getElementById("refill-button");

let balance = 120;
let isSpinning = false;

const quips = {
  jackpot: [
    "Three coins. The board now believes the AI strategy is working.",
    "Synthetic riches detected. Someone will absolutely call this product-market fit.",
  ],
  bots: [
    "Three robots. The chatbot union demands a larger compute budget.",
    "The bot stack aligned. Investors are calling this agentic revenue.",
  ],
  fire: [
    "Three fires. You somehow monetized the server meltdown.",
    "The GPUs are overheating, but the margin story sounds incredible.",
  ],
  match: [
    "Two icons matched. The demo looked just convincing enough.",
    "Minor payout. A founder somewhere said 'we'll scale with inference optimizations.'",
  ],
  miss: [
    "No match. The tokens were consumed by enterprise vaporware.",
    "Nothing landed. The roadmap now includes 'more autonomous agents' for no reason.",
    "Total miss. You burned tokens to generate confidence, not value.",
  ],
  broke: [
    "Token balance critical. Even the AI can hear the cash runway ending.",
    "You are out of tokens. Time to pivot to a new acronym and raise again.",
  ],
  refill: [
    "Fresh funding secured. The pitch deck used the phrase 'transformative moat' 11 times.",
    "VC refill complete. Nobody asked about unit economics.",
  ],
};

function setMessage(message) {
  statusMessageEl.textContent = message;
}

function pulse(elements) {
  elements.forEach((element) => {
    if (!element.animate) {
      return;
    }

    element.animate(
      [
        { transform: "translateY(0) scale(1)", offset: 0 },
        { transform: "translateY(-6px) scale(1.04)", offset: 0.45 },
        { transform: "translateY(0) scale(1)", offset: 1 },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    );
  });
}

function buzz(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function updateDisplay(payout = 0) {
  balanceEl.textContent = balance;
  lastPayoutEl.textContent = payout;
  spinButton.disabled = isSpinning || balance < spinCost;
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function scoreSpin(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, topCount] = entries[0];

  if (topCount === 3) {
    if (topSymbol === "🪙") {
      return { payout: 90, message: sample(quips.jackpot), celebrate: true };
    }

    if (topSymbol === "🤖") {
      return { payout: 65, message: sample(quips.bots), celebrate: true };
    }

    if (topSymbol === "🔥") {
      return { payout: 45, message: sample(quips.fire), celebrate: true };
    }

    return {
      payout: 35,
      message: "Three matching symbols. The machine declares an AI breakthrough by coincidence.",
      celebrate: true,
    };
  }

  if (topCount === 2) {
    return { payout: 20, message: sample(quips.match), celebrate: true };
  }

  return { payout: 0, message: sample(quips.miss), celebrate: false };
}

function animateReel(reel, duration) {
  reel.classList.add("spinning");

  return new Promise((resolve) => {
    const intervalId = window.setInterval(() => {
      reel.textContent = randomSymbol();
    }, 90);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      reel.classList.remove("spinning");
      resolve();
    }, duration);
  });
}

async function spin() {
  if (isSpinning || balance < spinCost) {
    if (balance < spinCost) {
      setMessage(sample(quips.broke));
    }
    return;
  }

  isSpinning = true;
  balance -= spinCost;
  updateDisplay(0);
  setMessage("Allocating compute budget. Please ignore the smell of burning tokens.");
  reels.forEach((reel) => reel.classList.remove("win"));

  const result = symbols.map(() => randomSymbol()).slice(0, reels.length);
  const animations = reels.map((reel, index) => animateReel(reel, 700 + index * 220));
  await Promise.all(animations);

  reels.forEach((reel, index) => {
    reel.textContent = result[index];
  });

  const outcome = scoreSpin(result);
  balance += outcome.payout;
  lastPayoutEl.textContent = outcome.payout;
  setMessage(outcome.message);

  if (outcome.celebrate) {
    reels.forEach((reel) => reel.classList.add("win"));
    pulse(reels);
    buzz([80, 40, 120]);
  }

  isSpinning = false;
  updateDisplay(outcome.payout);

  if (balance < spinCost) {
    setMessage(`${statusMessageEl.textContent} ${sample(quips.broke)}`);
  }
}

function refill() {
  if (isSpinning) {
    return;
  }

  balance += 60;
  updateDisplay(0);
  setMessage(sample(quips.refill));
  pulse([balanceEl, lastPayoutEl]);
  buzz([60, 30, 60]);
}

spinButton.addEventListener("click", spin);
refillButton.addEventListener("click", refill);
updateDisplay(0);
