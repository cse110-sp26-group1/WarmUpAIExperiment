const SYMBOLS = ["GPU", "HYPE", "PROMPT", "404", "LOL", "SEED", "VC", "AGI"];
const SPIN_COST = 75;
const DEFAULT_TOKENS = 1200;
const STORAGE_KEY = "token-burner-wallet";

const payouts = {
  GPU: 900,
  HYPE: 600,
  PROMPT: 450,
};

const roastLines = {
  jackpot: [
    "Jackpot. You can now afford one benchmark and a thread about changing the world.",
    "Three GPUs. Investors are sprinting toward your demo with tears in their eyes.",
    "The model aligned with shareholder value for once.",
  ],
  triple: [
    "Triple match. Somewhere, a keynote deck just added three more gradients.",
    "You won enough tokens to describe a button as a paradigm shift.",
    "Impressive. The hype flywheel has entered low Earth orbit.",
  ],
  double: [
    "Two of a kind. Barely profitable, but wildly overvalued.",
    "A modest win. Enough tokens to rename bugs as emergent behavior.",
    "Nice. Your startup now has runway through lunch.",
  ],
  miss: [
    "No match. The machine has converted your tokens into warm venture air.",
    "Miss. Please enjoy this complimentary hallucination.",
    "Nothing landed. Have you tried adding 'enterprise' to the pitch?",
  ],
  broke: [
    "Wallet empty. Time to pivot to a consultancy that spells AI in all caps.",
    "You are out of tokens and rich in lessons about burn rate.",
    "Zero balance. Even the chatbot wants a deposit up front.",
  ],
};

const balanceEl = document.querySelector("#token-balance");
const resultLineEl = document.querySelector("#result-line");
const meterLineEl = document.querySelector("#meter-line");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const reelEls = Array.from(document.querySelectorAll(".reel-symbol"));
const machineEl = document.querySelector(".machine");
const confettiTemplate = document.querySelector("#confetti-template");

let tokens = loadTokens();
let spinning = false;

updateUi();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", () => {
  tokens = DEFAULT_TOKENS;
  persistTokens();
  resultLineEl.textContent = "Wallet reset. Fiscal irresponsibility restored.";
  meterLineEl.textContent = "You are once again liquid enough to annoy a GPU cluster.";
  document.body.classList.remove("is-broke");
  updateUi();
});

async function spin() {
  if (spinning || tokens < SPIN_COST) {
    if (tokens < SPIN_COST) {
      resultLineEl.textContent = randomLine(roastLines.broke);
      meterLineEl.textContent = "Reset the wallet to continue simulating product-market fit.";
      document.body.classList.add("is-broke");
    }
    return;
  }

  spinning = true;
  spinButton.disabled = true;
  tokens -= SPIN_COST;
  persistTokens();
  updateUi();

  const result = Array.from({ length: 3 }, () => randomSymbol());
  await animateReels(result);

  const winnings = calculateWinnings(result);
  tokens += winnings.amount;
  persistTokens();

  if (winnings.amount > 0) {
    celebrate(winnings.amount >= 450);
  }

  resultLineEl.textContent = winnings.message;
  meterLineEl.textContent = buildMeterCopy(tokens, winnings.amount);

  spinning = false;
  updateUi();
}

function calculateWinnings(result) {
  const [a, b, c] = result;
  const isTriple = a === b && b === c;

  if (isTriple && payouts[a]) {
    return {
      amount: payouts[a],
      message: `${a} ${a} ${a}. ${randomLine(a === "GPU" ? roastLines.jackpot : roastLines.triple)}`,
    };
  }

  if (isTriple) {
    return {
      amount: 250,
      message: `${a} ${b} ${c}. ${randomLine(roastLines.triple)}`,
    };
  }

  if (a === b || b === c || a === c) {
    return {
      amount: 140,
      message: `${result.join(" ")}. ${randomLine(roastLines.double)}`,
    };
  }

  return {
    amount: 0,
    message: `${result.join(" ")}. ${randomLine(roastLines.miss)}`,
  };
}

async function animateReels(finalSymbols) {
  const promises = reelEls.map((reelEl, index) => {
    const duration = 850 + index * 250;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reelEl.textContent = finalSymbols[index];
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const interval = window.setInterval(() => {
        reelEl.textContent = randomSymbol();
      }, 75);

      reelEl.animate(
        [
          { transform: "translateY(-6px)", filter: "blur(0px)" },
          { transform: "translateY(6px)", filter: "blur(2px)" },
          { transform: "translateY(0px)", filter: "blur(0px)" },
        ],
        {
          duration,
          iterations: Math.max(3, Math.round(duration / 220)),
          easing: "ease-in-out",
        }
      );

      window.setTimeout(() => {
        window.clearInterval(interval);
        reelEl.textContent = finalSymbols[index];
        resolve();
      }, duration);
    });
  });

  await Promise.all(promises);
}

function celebrate(bigWin) {
  machineEl.classList.add("is-winning");
  window.setTimeout(() => machineEl.classList.remove("is-winning"), 900);

  if ("vibrate" in navigator) {
    navigator.vibrate(bigWin ? [80, 40, 120] : [50]);
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sprayConfetti(bigWin ? 18 : 10);
  }
}

function sprayConfetti(count) {
  const palette = ["#ffcf56", "#84f5cf", "#ff8f6b", "#fff6e3"];

  for (let i = 0; i < count; i += 1) {
    const node = confettiTemplate.content.firstElementChild.cloneNode(true);
    node.style.background = palette[i % palette.length];
    node.style.left = `${15 + Math.random() * 70}%`;
    node.style.top = `${26 + Math.random() * 18}%`;
    machineEl.append(node);

    node.animate(
      [
        { transform: "translate3d(0, 0, 0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate3d(${Math.random() * 120 - 60}px, ${180 + Math.random() * 140}px, 0) rotate(${180 + Math.random() * 360}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 900 + Math.random() * 700,
        easing: "cubic-bezier(.21,.84,.38,.99)",
        fill: "forwards",
      }
    );

    window.setTimeout(() => node.remove(), 1800);
  }
}

function updateUi() {
  balanceEl.textContent = `${tokens}`;
  spinButton.disabled = spinning || tokens < SPIN_COST;
  document.body.classList.toggle("is-broke", tokens < SPIN_COST);
}

function buildMeterCopy(balance, winnings) {
  if (balance < SPIN_COST) {
    return "You can no longer afford the next prompt. Please locate fresh capital.";
  }

  if (winnings >= 600) {
    return "Massive result. The board has approved a fresh round of irrational confidence.";
  }

  if (winnings > 0) {
    return "Tokens recovered. The quarterly graph now points vaguely upward.";
  }

  if (balance < 300) {
    return "Low balance. You are one bad demo away from calling this a research lab.";
  }

  return "The wallet survives. Keep pulling the lever until the roadmap writes itself.";
}

function loadTokens() {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  const parsedValue = Number.parseInt(rawValue ?? "", 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : DEFAULT_TOKENS;
}

function persistTokens() {
  window.localStorage.setItem(STORAGE_KEY, String(tokens));
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function randomLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}
