const symbols = [
  {
    icon: "🤖",
    name: "Chatbot",
    roast: "The bot says it feels lucky, which is statistically suspicious.",
  },
  {
    icon: "🪙",
    name: "Token",
    roast: "A fresh token appears, moments before a pricing update.",
  },
  {
    icon: "📉",
    name: "Valuation Drop",
    roast: "The startup deck said line only goes up. Fascinating.",
  },
  {
    icon: "🔥",
    name: "GPU Burn",
    roast: "The cluster is warm, glowing, and emotionally unavailable.",
  },
  {
    icon: "🧠",
    name: "Synthetic Genius",
    roast: "A premium thought arrives with all the confidence of a wrong answer.",
  },
  {
    icon: "💥",
    name: "Outage",
    roast: "The service is briefly replaced by a spinning status page.",
  },
];

const state = {
  tokens: 120,
  bet: 15,
  lastPayout: 0,
  isSpinning: false,
  soundEnabled: true,
};

const tokenCountEl = document.querySelector("#tokenCount");
const spinCostEl = document.querySelector("#spinCost");
const lastPayoutEl = document.querySelector("#lastPayout");
const messageTextEl = document.querySelector("#messageText");
const spinButtonEl = document.querySelector("#spinButton");
const reloadButtonEl = document.querySelector("#reloadButton");
const betSelectEl = document.querySelector("#betSelect");
const soundToggleEl = document.querySelector("#soundToggle");
const reelEls = Array.from({ length: 3 }, (_, index) =>
  document.querySelector(`#reel${index}`)
);
const reelWindowEls = Array.from(document.querySelectorAll(".reel-window"));

let audioContext;

function updateStats() {
  tokenCountEl.textContent = state.tokens;
  spinCostEl.textContent = state.bet;
  lastPayoutEl.textContent = state.lastPayout;
  spinButtonEl.disabled = state.isSpinning || state.tokens < state.bet;
  reloadButtonEl.disabled = state.isSpinning;
}

function setMessage(text) {
  messageTextEl.textContent = text;
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function celebrate() {
  document.body.classList.remove("win-flash");
  void document.body.offsetWidth;
  document.body.classList.add("win-flash");
}

function getAudioContext() {
  if (!state.soundEnabled) {
    return null;
  }

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function beep({ frequency, duration, type = "sine", gain = 0.03 }) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playSpinSounds() {
  beep({ frequency: 240, duration: 0.12, type: "square", gain: 0.025 });
  window.setTimeout(() => {
    beep({ frequency: 340, duration: 0.12, type: "square", gain: 0.02 });
  }, 100);
  window.setTimeout(() => {
    beep({ frequency: 420, duration: 0.12, type: "triangle", gain: 0.02 });
  }, 210);
}

function playResultSound(isWin) {
  if (isWin) {
    beep({ frequency: 523.25, duration: 0.16, type: "triangle", gain: 0.035 });
    window.setTimeout(() => {
      beep({ frequency: 659.25, duration: 0.18, type: "triangle", gain: 0.035 });
    }, 120);
    window.setTimeout(() => {
      beep({ frequency: 783.99, duration: 0.22, type: "triangle", gain: 0.04 });
    }, 260);
    return;
  }

  beep({ frequency: 180, duration: 0.18, type: "sawtooth", gain: 0.02 });
}

function calculatePayout(result) {
  const names = result.map((item) => item.name);
  const counts = names.reduce((map, name) => {
    map[name] = (map[name] || 0) + 1;
    return map;
  }, {});
  const matchCount = Math.max(...Object.values(counts));
  const tokenHits = result.filter((item) => item.name === "Token").length;
  const outageHits = result.filter((item) => item.name === "Outage").length;

  if (tokenHits === 3) {
    return {
      payout: state.bet * 10,
      message: "Jackpot. The machine monetized irony and paid you in platform credits.",
      isWin: true,
    };
  }

  if (outageHits === 3) {
    return {
      payout: 1,
      message: "Triple outage. Customer support gifts you one pity token.",
      isWin: true,
    };
  }

  if (matchCount === 3) {
    const matchName = Object.keys(counts).find((name) => counts[name] === 3);
    return {
      payout: state.bet * 6,
      message: `Triple ${matchName}. Somehow the AI hype cycle paid rent this month.`,
      isWin: true,
    };
  }

  if (matchCount === 2) {
    return {
      payout: state.bet * 2,
      message: "Two of a kind. The machine calls this a strategic alignment bonus.",
      isWin: true,
    };
  }

  return {
    payout: 0,
    message: result[Math.floor(Math.random() * result.length)].roast,
    isWin: false,
  };
}

async function spin() {
  if (state.isSpinning || state.tokens < state.bet) {
    return;
  }

  state.isSpinning = true;
  state.tokens -= state.bet;
  state.lastPayout = 0;
  updateStats();
  setMessage("You fed tokens into the machine. It nodded like a venture capitalist.");
  playSpinSounds();

  reelWindowEls.forEach((el) => el.classList.add("spinning"));

  const finalResult = [];

  for (let index = 0; index < reelEls.length; index += 1) {
    for (let tick = 0; tick < 9 + index * 4; tick += 1) {
      reelEls[index].textContent = randomSymbol().icon;
      await sleep(75);
    }

    const settled = randomSymbol();
    finalResult[index] = settled;
    reelEls[index].textContent = settled.icon;
    reelWindowEls[index].classList.remove("spinning");
    beep({ frequency: 300 + index * 90, duration: 0.08, type: "square", gain: 0.018 });
    await sleep(120);
  }

  const outcome = calculatePayout(finalResult);
  state.tokens += outcome.payout;
  state.lastPayout = outcome.payout;
  state.isSpinning = false;
  updateStats();
  setMessage(outcome.message);
  playResultSound(outcome.isWin);

  if (outcome.isWin) {
    celebrate();
  }

  if (state.tokens < state.bet) {
    setMessage("You are out of tokens. The AI suggests a totally non-predatory reload package.");
  }
}

function syncBet() {
  state.bet = Number(betSelectEl.value);
  updateStats();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  soundToggleEl.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
  soundToggleEl.setAttribute("aria-pressed", String(state.soundEnabled));
}

function reloadTokens() {
  if (state.isSpinning) {
    return;
  }

  state.tokens += 60;
  state.lastPayout = 60;
  updateStats();
  setMessage("The machine sold your browsing history and found 60 more tokens.");
  playResultSound(true);
}

betSelectEl.addEventListener("change", syncBet);
spinButtonEl.addEventListener("click", spin);
reloadButtonEl.addEventListener("click", reloadTokens);
soundToggleEl.addEventListener("click", toggleSound);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    spin();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    document.title = "Your tokens miss you";
  } else {
    document.title = "Token Tug-O-War";
  }
});

syncBet();
