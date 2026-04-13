const symbols = [
  { icon: "🤖", name: "Bot", weight: 4 },
  { icon: "🪙", name: "Token", weight: 5 },
  { icon: "🧠", name: "Brainstorm", weight: 4 },
  { icon: "🔥", name: "Hype", weight: 3 },
  { icon: "📉", name: "Correction", weight: 2 },
  { icon: "💸", name: "Burn Rate", weight: 3 },
  { icon: "🧾", name: "Terms", weight: 2 },
];

const headlines = [
  "Analyst upgrades chatbot from 'weird' to 'weird, but premium.'",
  "Startup promises ethical AI, immediately adds 14 tracking scripts.",
  "Your jackpot is denominated in tokens because cash sounded too accountable.",
  "Machine learning model requests applause for predicting the obvious faster.",
  "Prompt engineer promoted after discovering 'please' still does nothing.",
  "Cloud bill achieves sentience and files for custody of your wallet.",
];

const marqueeNames = ["GPT-WHY", "Token Thunder", "VC Mirage", "HalluciNATION", "Promptzilla"];

const tokenCount = document.querySelector("#tokenCount");
const jackpotCount = document.querySelector("#jackpotCount");
const bestScore = document.querySelector("#bestScore");
const resultMessage = document.querySelector("#resultMessage");
const betRange = document.querySelector("#betRange");
const betAmount = document.querySelector("#betAmount");
const spinButton = document.querySelector("#spinButton");
const resetButton = document.querySelector("#resetButton");
const muteButton = document.querySelector("#muteButton");
const tickerFeed = document.querySelector("#tickerFeed");
const confettiField = document.querySelector("#confettiField");
const marqueeText = document.querySelector("#marqueeText");
const machine = document.querySelector(".machine");
const reels = [...document.querySelectorAll(".reel-symbol")];

const BEST_KEY = "token-tug-best-score";
const STATE_KEY = "token-tug-wallet";

let wallet = Number(localStorage.getItem(STATE_KEY)) || 120;
let jackpot = 900;
let muted = false;
let spinning = false;

betAmount.textContent = betRange.value;
bestScore.textContent = localStorage.getItem(BEST_KEY) || "0";

render();
renderTicker();
cycleMarquee();

betRange.addEventListener("input", () => {
  betAmount.textContent = betRange.value;
});

spinButton.addEventListener("click", async () => {
  if (spinning) return;

  const bet = Number(betRange.value);
  if (wallet < bet) {
    setMessage("You tried to buy AGI with insufficient tokens. Investor confidence unchanged.", "loss");
    pulseMachine("loss-flash");
    return;
  }

  spinning = true;
  wallet -= bet;
  jackpot += Math.ceil(bet * 0.8);
  render();

  await animateSpin();

  const result = [pickSymbol(), pickSymbol(), pickSymbol()];
  reels.forEach((reel, index) => {
    reel.textContent = result[index].icon;
  });

  const winnings = calculatePayout(result, bet);
  wallet += winnings.amount;
  jackpot = Math.max(250, jackpot - winnings.jackpotDip);
  persistWallet();
  updateBest();
  render();
  setMessage(winnings.message, winnings.tone);
  pulseMachine(winnings.tone === "win" ? "win-flash" : "loss-flash");

  if (winnings.amount > bet) {
    celebrate(winnings.amount);
    vibrate([50, 80, 120]);
    playSound(880, 0.12, "triangle");
    setTimeout(() => playSound(1174, 0.16, "sine"), 90);
  } else {
    vibrate(45);
    playSound(180, 0.12, "sawtooth");
  }

  spinning = false;
});

resetButton.addEventListener("click", () => {
  wallet = 120;
  jackpot = 900;
  persistWallet();
  render();
  setMessage("Fresh funding round secured. Nobody asked about the business model.", "win");
  pulseMachine("win-flash");
});

muteButton.addEventListener("click", () => {
  muted = !muted;
  muteButton.textContent = muted ? "Sound Off" : "Sound On";
  muteButton.setAttribute("aria-pressed", String(muted));
});

function render() {
  tokenCount.textContent = String(wallet);
  jackpotCount.textContent = String(jackpot);
}

function setMessage(message, tone) {
  resultMessage.textContent = message;
  resultMessage.style.color = tone === "win" ? "var(--mint)" : "var(--danger)";
}

function pickSymbol() {
  const pool = symbols.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol));
  return pool[Math.floor(Math.random() * pool.length)];
}

function calculatePayout(result, bet) {
  const [a, b, c] = result;
  const allSame = a.icon === b.icon && b.icon === c.icon;
  const counts = result.reduce((map, symbol) => {
    map[symbol.icon] = (map[symbol.icon] || 0) + 1;
    return map;
  }, {});

  if (allSame && a.icon === "🪙") {
    return {
      amount: bet * 9,
      jackpotDip: 160,
      tone: "win",
      message: "Three token stacks. The machine respects your commitment to fake money.",
    };
  }

  if (allSame && a.icon === "🤖") {
    return {
      amount: bet * 7,
      jackpotDip: 130,
      tone: "win",
      message: "Three bots aligned. Congratulations, you invented a demo nobody can cancel.",
    };
  }

  if (allSame && a.icon === "📉") {
    return {
      amount: 0,
      jackpotDip: 0,
      tone: "loss",
      message: "Triple market correction. Even the slot machine is doing layoffs now.",
    };
  }

  if (Object.values(counts).includes(2)) {
    return {
      amount: bet * 2,
      jackpotDip: 45,
      tone: "win",
      message: "A modest match. Enough tokens to keep pretending the roadmap is real.",
    };
  }

  if (result.some((symbol) => symbol.icon === "💸")) {
    return {
      amount: Math.max(0, Math.floor(bet * 0.4)),
      jackpotDip: 0,
      tone: "loss",
      message: "Burn rate symbol detected. Most of your winnings were redirected to compute.",
    };
  }

  return {
    amount: 0,
    jackpotDip: 0,
    tone: "loss",
    message: "No match. Your tokens have been reinvested into a very confident slide deck.",
  };
}

async function animateSpin() {
  const duration = 1100;
  const start = performance.now();

  while (performance.now() - start < duration) {
    reels.forEach((reel, index) => {
      reel.classList.add("spinning");
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      reel.textContent = symbol.icon;
      reel.style.transform = `translateY(${Math.sin((performance.now() + index * 120) / 80) * 6}px)`;
    });
    playSound(320 + Math.random() * 140, 0.03, "square");
    await wait(85);
  }

  reels.forEach((reel) => {
    reel.classList.remove("spinning");
    reel.style.transform = "";
  });
}

function celebrate(amount) {
  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = "-10%";
    piece.style.background = ["#f8b400", "#ff6b4a", "#85ffc7", "#fff8dc"][index % 4];
    confettiField.append(piece);

    piece.animate(
      [
        { transform: "translate3d(0, 0, 0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate3d(${Math.random() * 180 - 90}px, ${320 + Math.random() * 140}px, 0) rotate(${200 + Math.random() * 200}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1100 + Math.random() * 700,
        easing: "cubic-bezier(.2,.8,.2,1)",
      }
    );

    setTimeout(() => piece.remove(), 1900);
  }

  const bonusLine = document.createElement("p");
  bonusLine.className = "ticker-line";
  bonusLine.textContent = `Breaking: you extracted ${amount} tokens from the hype machine. Regulators stunned.`;
  tickerFeed.prepend(bonusLine);
  trimTicker();
}

function pulseMachine(className) {
  machine.classList.remove("win-flash", "loss-flash");
  void machine.offsetWidth;
  machine.classList.add(className);
  setTimeout(() => machine.classList.remove(className), 600);
}

function renderTicker() {
  headlines.forEach((headline) => addTickerLine(headline));
}

function addTickerLine(text) {
  const template = document.querySelector("#tickerTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  node.textContent = text;
  tickerFeed.append(node);
}

function trimTicker() {
  while (tickerFeed.children.length > 6) {
    tickerFeed.lastElementChild.remove();
  }
}

function cycleMarquee() {
  let index = 0;
  setInterval(() => {
    index = (index + 1) % marqueeNames.length;
    marqueeText.textContent = marqueeNames[index];
  }, 2200);
}

function updateBest() {
  const best = Number(localStorage.getItem(BEST_KEY) || 0);
  if (wallet > best) {
    localStorage.setItem(BEST_KEY, String(wallet));
    bestScore.textContent = String(wallet);
  }
}

function persistWallet() {
  localStorage.setItem(STATE_KEY, String(wallet));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function playSound(frequency, duration, type) {
  if (muted) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = playSound.context || new AudioContextClass();
  playSound.context = context;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.0001;

  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
}
