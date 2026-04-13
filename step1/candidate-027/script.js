const STORAGE_KEY = "token-burner-3000-state";
const STARTING_TOKENS = 120;
const SPIN_COST = 15;
const AUTO_SPINS = 3;
const HISTORY_LIMIT = 6;

const symbols = [
  "TOKEN",
  "GPU",
  "PROMPT",
  "AGENT",
  "VC",
  "BUG",
  "HYPE",
  "404",
];

const roastLines = [
  "The machine thanks you for converting savings into benchmark theater.",
  "Your wallet just participated in a cutting-edge token redistribution event.",
  "Investors call this negative cash flow. We call it innovation.",
  "Three more spins and you can almost afford one premium autocomplete thought.",
  "Every payout is immediately reclassified as platform growth.",
  "This machine has replaced product strategy with vibes and a gradient.",
  "You are not gambling. You are funding speculative inference.",
];

const resultLines = {
  jackpot: [
    "Triple TOKEN. The board has approved another pointless AI offsite.",
    "Perfect match. Your startup can now afford six more pivots.",
  ],
  good: [
    "Respectable payout. The machine calls this sustainable tokenomics.",
    "A minor win. Enough tokens for one more impractical integration.",
  ],
  miss: [
    "No payout. Please describe your loss in a more enterprise-ready prompt.",
    "The reels produced synergy but no value.",
  ],
  broke: [
    "Wallet empty. Emergency venture funding deployed.",
    "You hit zero. The machine found another angel investor somehow.",
  ],
};

const state = loadState();

const tokenBalanceEl = document.querySelector("#tokenBalance");
const spinCostEl = document.querySelector("#spinCost");
const lastWinEl = document.querySelector("#lastWin");
const statusLineEl = document.querySelector("#statusLine");
const roastTextEl = document.querySelector("#roastText");
const historyListEl = document.querySelector("#historyList");
const spinButtonEl = document.querySelector("#spinButton");
const autoButtonEl = document.querySelector("#autoButton");
const resetButtonEl = document.querySelector("#resetButton");
const reelEls = [0, 1, 2].map((index) => document.querySelector(`#reel${index}`));

let spinning = false;
let audioContext;

spinCostEl.textContent = SPIN_COST;

render();

spinButtonEl.addEventListener("click", () => {
  void runSpin();
});

autoButtonEl.addEventListener("click", () => {
  void runAutoBurn();
});

resetButtonEl.addEventListener("click", () => {
  state.tokens = STARTING_TOKENS;
  state.lastWin = 0;
  state.history = [];
  saveState();
  setStatus("Wallet reset. Pretend the last funding round never happened.");
  updateRoast("Fresh capital acquired. Accountability deleted.");
  render();
});

function loadState() {
  const fallback = {
    tokens: STARTING_TOKENS,
    lastWin: 0,
    history: [],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return {
      tokens: Number.isFinite(parsed.tokens) ? parsed.tokens : STARTING_TOKENS,
      lastWin: Number.isFinite(parsed.lastWin) ? parsed.lastWin : 0,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, HISTORY_LIMIT) : [],
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  tokenBalanceEl.textContent = state.tokens;
  lastWinEl.textContent = state.lastWin;
  renderHistory();
  spinButtonEl.textContent = `Spend ${SPIN_COST} Tokens`;
  const disabled = spinning || state.tokens < SPIN_COST;
  spinButtonEl.disabled = disabled;
  autoButtonEl.disabled = disabled;
}

function renderHistory() {
  historyListEl.innerHTML = "";

  if (!state.history.length) {
    const placeholder = document.createElement("li");
    placeholder.innerHTML = "<strong>No spins yet</strong><span>The telemetry team is resting.</span>";
    historyListEl.appendChild(placeholder);
    return;
  }

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    const reels = entry.reels.join(" / ");
    item.innerHTML = `<strong>${reels}</strong><span>${entry.message}</span>`;
    historyListEl.appendChild(item);
  });
}

async function runAutoBurn() {
  if (spinning) {
    return;
  }

  for (let spin = 0; spin < AUTO_SPINS; spin += 1) {
    if (state.tokens < SPIN_COST) {
      break;
    }
    await runSpin({ silentIntro: spin > 0 });
  }
}

async function runSpin(options = {}) {
  if (spinning || state.tokens < SPIN_COST) {
    if (state.tokens < SPIN_COST) {
      recoverWallet();
    }
    return;
  }

  spinning = true;
  render();

  if (!options.silentIntro) {
    setStatus("Charging your credit card for premium inference...");
  }

  updateRoast(randomItem(roastLines));
  state.tokens -= SPIN_COST;
  state.lastWin = 0;
  saveState();
  render();

  const result = [drawSymbol(), drawSymbol(), drawSymbol()];
  await animateReels(result);

  const payout = calculatePayout(result);
  state.tokens += payout.amount;
  state.lastWin = payout.amount;

  const linePool = payout.amount >= 80 ? resultLines.jackpot : payout.amount > 0 ? resultLines.good : resultLines.miss;
  const message = `${randomItem(linePool)} ${payout.note}`;

  state.history.unshift({
    reels: result,
    message,
  });
  state.history = state.history.slice(0, HISTORY_LIMIT);

  setStatus(message);
  updateRoast(payout.roast);
  flashWin(result, payout.amount);
  soundForPayout(payout.amount);

  if (state.tokens < SPIN_COST) {
    recoverWallet();
  } else {
    saveState();
  }

  render();
  spinning = false;
  render();
}

function drawSymbol() {
  const randomIndex = Math.floor(Math.random() * symbols.length);
  return symbols[randomIndex];
}

async function animateReels(finalSymbols) {
  const spinPromises = reelEls.map((reelEl, index) => {
    reelEl.classList.remove("is-winning");
    return new Promise((resolve) => {
      const duration = 900 + index * 260;
      const interval = 80;
      let elapsed = 0;

      const timer = window.setInterval(() => {
        reelEl.textContent = drawSymbol();
        elapsed += interval;

        if (elapsed >= duration) {
          window.clearInterval(timer);
          reelEl.textContent = finalSymbols[index];
          reelEl.animate(
            [
              { transform: "translateY(-14px)", filter: "blur(2px)" },
              { transform: "translateY(0)", filter: "blur(0)" },
            ],
            {
              duration: 280,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            }
          );
          resolve();
        }
      }, interval);
    });
  });

  await Promise.all(spinPromises);
}

function calculatePayout(result) {
  const counts = result.reduce((accumulator, symbol) => {
    accumulator[symbol] = (accumulator[symbol] || 0) + 1;
    return accumulator;
  }, {});

  const uniqueCount = Object.keys(counts).length;
  const hasBug = result.includes("BUG");

  if (counts.TOKEN === 3) {
    return payout(180, "The wallet briefly achieved artificial profitability.", "Triple TOKEN unlocked maximum executive confidence.");
  }

  if (counts.GPU === 3) {
    return payout(140, "Your render budget is still irresponsible, just funded.", "Triple GPU. Hardware worship continues.");
  }

  if (counts.PROMPT === 3) {
    return payout(95, "A prompt engineer somewhere just updated their title again.", "Triple PROMPT. Syntax has become revenue.");
  }

  if (uniqueCount === 1) {
    return payout(80, "A fully aligned triple appeared, which is more than most AI roadmaps manage.", "Any triple pays because matching hype is rare.");
  }

  if ((counts.TOKEN || 0) === 2) {
    return payout(35, "Two TOKENs. The machine has generated modest shareholder optimism.", "Close enough for a keynote.");
  }

  if (hasBug) {
    return payout(0, "BUG detected. Shipping anyway.", "The defect was reframed as emergent behavior.");
  }

  return payout(0, "No matching symbols. Value remains pre-revenue.", "The machine recommends saying 'agentic' more often.");
}

function payout(amount, roast, note) {
  return { amount, roast, note };
}

function flashWin(result, amount) {
  if (amount > 0) {
    result.forEach((symbol, index) => {
      if (result.filter((value) => value === symbol).length > 1) {
        reelEls[index].classList.add("is-winning");
      }
    });
  }

  const duration = amount > 0 ? 420 : 180;
  document.querySelector(".machine").animate(
    [
      { transform: "translateY(0)" },
      { transform: `translateY(${amount > 0 ? "-4px" : "2px"})` },
      { transform: "translateY(0)" },
    ],
    {
      duration,
      easing: "ease-out",
    }
  );

  if (navigator.vibrate) {
    navigator.vibrate(amount > 0 ? [60, 30, 90] : 70);
  }
}

function recoverWallet() {
  state.tokens += 90;
  const bailoutLine = randomItem(resultLines.broke);
  setStatus(`${bailoutLine} +90 bailout tokens issued.`);
  updateRoast("Liquidity event complete. The machine remains spiritually unprofitable.");
  state.history.unshift({
    reels: ["BAILOUT", "VC", "TOKEN"],
    message: `${bailoutLine} The cap table got worse, but you can spin again.`,
  });
  state.history = state.history.slice(0, HISTORY_LIMIT);
  saveState();
}

function setStatus(message) {
  statusLineEl.textContent = message;
}

function updateRoast(message) {
  roastTextEl.textContent = message;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function soundForPayout(amount) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  playTone(context, now, amount > 0 ? 523.25 : 220, 0.05, "square");
  playTone(context, now + 0.08, amount >= 80 ? 783.99 : amount > 0 ? 659.25 : 196, 0.08, "triangle");

  if (amount >= 80) {
    playTone(context, now + 0.18, 1046.5, 0.12, "sine");
  }
}

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

function playTone(context, start, frequency, duration, type) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.07, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(start + duration);
}
