const symbols = ["GPU", "404", "LOL", "BEEP", "TOKEN", "NERD"];
const spinCost = 15;
const startingTokens = 120;

const reels = Array.from(document.querySelectorAll(".reel"));
const tokenBalance = document.getElementById("token-balance");
const machineMood = document.getElementById("machine-mood");
const lastPayout = document.getElementById("last-payout");
const hypeLevel = document.getElementById("hype-level");
const message = document.getElementById("message");
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");

const moods = [
  "Smug",
  "Overfitted",
  "Investor-ready",
  "Rate-limited",
  "Suspiciously confident",
];

const outcomes = {
  jackpot: {
    payout: 120,
    hype: "Series A hallucination",
    message:
      "Triple match. The machine calls this alignment, accountants call it a miracle.",
  },
  triple404: {
    payout: 45,
    hype: "Graceful failure theater",
    message:
      "Three 404s. You lost the prompt but gained a deeply branded apology credit.",
  },
  match: {
    payout: 25,
    hype: "Demo day optimism",
    message:
      "A pair matched. Congratulations on monetizing a partial autocomplete.",
  },
  none: {
    payout: 0,
    hype: "Burn rate realism",
    message:
      "No match. Your tokens have been reinvested into a tasteful cluster of hot GPUs.",
  },
  broke: {
    payout: 0,
    hype: "Bootstrapped",
    message:
      "You’re out of tokens. Even the fake AI economy demands liquidity.",
  },
};

let tokens = startingTokens;
let spinning = false;

function randomSymbol() {
  const index = Math.floor(Math.random() * symbols.length);
  return symbols[index];
}

function chooseMood() {
  machineMood.textContent = moods[Math.floor(Math.random() * moods.length)];
}

function updateWallet() {
  tokenBalance.textContent = `${tokens} tokens`;
  spinButton.disabled = spinning || tokens < spinCost;
}

function describeOutcome(result) {
  lastPayout.textContent = `${result.payout} tokens`;
  hypeLevel.textContent = result.hype;
  message.textContent = result.message;
}

function evaluateSpin(resultSymbols) {
  const counts = resultSymbols.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts);
  const isTriple = values.includes(3);
  const isPair = values.includes(2);

  if (isTriple && resultSymbols.every((symbol) => symbol === "404")) {
    return outcomes.triple404;
  }

  if (isTriple) {
    return outcomes.jackpot;
  }

  if (isPair) {
    return outcomes.match;
  }

  return outcomes.none;
}

function flashWin() {
  reels.forEach((reel) => {
    reel.classList.remove("win-flash");
    void reel.offsetWidth;
    reel.classList.add("win-flash");
  });
}

function spinOnce() {
  if (spinning) {
    return;
  }

  if (tokens < spinCost) {
    describeOutcome(outcomes.broke);
    chooseMood();
    updateWallet();
    return;
  }

  spinning = true;
  tokens -= spinCost;
  updateWallet();
  chooseMood();
  lastPayout.textContent = "Calculating...";
  hypeLevel.textContent = "Inference in progress";
  message.textContent =
    "Crunching your tokens into premium machine confidence. Please admire the latency.";

  const finalSymbols = reels.map(() => randomSymbol());

  reels.forEach((reel, index) => {
    reel.classList.add("spinning");
    let ticks = 0;
    const maxTicks = 10 + index * 4;

    const timer = window.setInterval(() => {
      reel.textContent = randomSymbol();
      ticks += 1;

      if (ticks >= maxTicks) {
        window.clearInterval(timer);
        reel.textContent = finalSymbols[index];
        reel.classList.remove("spinning");

        if (index === reels.length - 1) {
          const result = evaluateSpin(finalSymbols);
          tokens += result.payout;
          describeOutcome(result);
          chooseMood();
          if (result.payout > 0) {
            flashWin();
          }
          spinning = false;
          updateWallet();
        }
      }
    }, 90 + index * 30);
  });
}

function resetGame() {
  tokens = startingTokens;
  spinning = false;
  ["404", "GPU", "LOL"].forEach((symbol, index) => {
    reels[index].textContent = symbol;
    reels[index].classList.remove("spinning", "win-flash");
  });
  chooseMood();
  describeOutcome({
    payout: 0,
    hype: "Seed round energy",
    message:
      "Fresh tokens loaded. The machine is ready to convert your optimism into metrics.",
  });
  updateWallet();
}

spinButton.addEventListener("click", spinOnce);
resetButton.addEventListener("click", resetGame);

updateWallet();
chooseMood();
