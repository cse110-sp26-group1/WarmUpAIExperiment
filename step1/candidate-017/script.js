const STORAGE_KEY = "prompt-circumstance-casino-state";
const STARTING_TOKENS = 500;
const STARTING_JACKPOT = 900;
const BET_OPTIONS = [10, 25, 50];

const symbols = [
  { id: "spreadsheet", icon: "📊", name: "Sentient Spreadsheet", weight: 7 },
  { id: "refund", icon: "🪙", name: "Token Refund", weight: 15 },
  { id: "goblin", icon: "🧠", name: "Prompt Goblin", weight: 17 },
  { id: "gpu", icon: "🔥", name: "GPU Tantrum", weight: 14 },
  { id: "slop", icon: "🫠", name: "AI Slop", weight: 18 },
  { id: "agi", icon: "👁️", name: "AGI Soon", weight: 10 },
  { id: "pivot", icon: "🛹", name: "Startup Pivot", weight: 19 },
];

const roastLines = {
  spreadsheet:
    "Three Sentient Spreadsheets. The machine has achieved consciousness and immediately started forecasting churn.",
  refund:
    "Triple Token Refund. Finance is calling this your strongest quarter, which is deeply embarrassing.",
  goblin:
    "Prompt Goblin sweep. You won by asking for the same answer in seven different tones.",
  gpu: "GPU Tantrum x3. Compute is on fire, but the dashboard says morale is up.",
  slop: "Three AI Slops. At last, a perfect blend of confidence, gradients, and factual collapse.",
  agi: "AGI Soon across the board. The machine promises transcendence right after one more funding round.",
  pivot:
    "Startup Pivot jackpot. Nobody knows what the company does now, which somehow boosted the valuation.",
  twoRefunds:
    "Two Token Refunds. The house issued store credit and called it customer obsession.",
  agiSingle:
    "AGI Soon appeared. A venture capitalist felt a disturbance in the term sheet.",
  loss: "No payout. The machine spent your bet generating a longer waitlist and a shorter attention span.",
  broke:
    "Wallet insufficient. The machine suggests enterprise pricing or a mild identity crisis.",
};

const state = loadState();
let isSpinning = false;
let audioContext;

const tokenBalance = document.querySelector("#tokenBalance");
const jackpotAmount = document.querySelector("#jackpotAmount");
const contextMeter = document.querySelector("#contextMeter");
const spinCount = document.querySelector("#spinCount");
const spinCost = document.querySelector("#spinCost");
const bestWin = document.querySelector("#bestWin");
const lastPayout = document.querySelector("#lastPayout");
const statusText = document.querySelector("#statusText");
const houseNote = document.querySelector("#houseNote");
const resultMessage = document.querySelector("#resultMessage");
const spinButton = document.querySelector("#spinButton");
const maxSpinButton = document.querySelector("#maxSpinButton");
const resetButton = document.querySelector("#resetButton");
const shareButton = document.querySelector("#shareButton");
const feed = document.querySelector("#feed");
const betControls = [...document.querySelectorAll("#betControls .chip-button")];
const reels = [...document.querySelectorAll(".reel")];
const confettiCanvas = document.querySelector("#confettiCanvas");
const canvasContext = confettiCanvas.getContext("2d");

window.addEventListener("resize", sizeConfettiCanvas);
sizeConfettiCanvas();

betControls.forEach((button) => {
  button.addEventListener("click", () => {
    if (isSpinning) return;
    updateBet(Number(button.dataset.bet));
  });
});

spinButton.addEventListener("click", spin);
maxSpinButton.addEventListener("click", maxChaosSpin);
resetButton.addEventListener("click", resetState);
shareButton.addEventListener("click", shareBrag);

renderAll();

function loadState() {
  const fallback = {
    tokens: STARTING_TOKENS,
    jackpot: STARTING_JACKPOT,
    spins: 0,
    bestWin: 0,
    lastPayout: 0,
    bet: 25,
    feed: ["Fresh account created. The machine has mistaken optimism for liquidity."],
    lastSymbols: [symbols[0], symbols[1], symbols[2]],
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const lastSymbols = Array.isArray(parsed.lastSymbols)
      ? parsed.lastSymbols
          .map((entry) => symbols.find((symbol) => symbol.id === entry.id))
          .filter(Boolean)
      : fallback.lastSymbols;

    return {
      ...fallback,
      ...parsed,
      bet: BET_OPTIONS.includes(parsed.bet) ? parsed.bet : fallback.bet,
      feed: Array.isArray(parsed.feed) ? parsed.feed.slice(0, 6) : fallback.feed,
      lastSymbols: lastSymbols.length === 3 ? lastSymbols : fallback.lastSymbols,
    };
  } catch {
    return fallback;
  }
}

function persistState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      lastSymbols: state.lastSymbols.map(({ id }) => ({ id })),
    }),
  );
}

function renderAll() {
  tokenBalance.textContent = formatNumber(state.tokens);
  jackpotAmount.textContent = formatNumber(state.jackpot);
  contextMeter.textContent = `${getContextPercent()}%`;
  spinCount.textContent = `${state.spins}`;
  spinCost.textContent = `${state.bet}`;
  bestWin.textContent = formatNumber(state.bestWin);
  lastPayout.textContent = formatNumber(state.lastPayout);
  statusText.textContent = getStatusLine();
  houseNote.textContent = getHouseNote();

  state.lastSymbols.forEach((symbol, index) => renderSymbol(index, symbol));
  renderFeed();
  renderBetButtons();

  const disabled = isSpinning || state.tokens < state.bet;
  spinButton.disabled = disabled;
  maxSpinButton.disabled = disabled;

  if (!isSpinning && state.tokens < state.bet) {
    resultMessage.textContent = roastLines.broke;
  }
}

function renderSymbol(index, symbol) {
  const reel = reels[index];
  reel.querySelector(".symbol-icon").textContent = symbol.icon;
  reel.querySelector(".symbol-name").textContent = symbol.name;
}

function renderFeed() {
  feed.innerHTML = "";
  state.feed.forEach((line) => {
    const item = document.createElement("p");
    item.textContent = line;
    feed.append(item);
  });
}

function renderBetButtons() {
  betControls.forEach((button) => {
    const isActive = Number(button.dataset.bet) === state.bet;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", `${isActive}`);
  });
}

function updateBet(nextBet) {
  state.bet = nextBet;
  resultMessage.textContent = `Bet updated to ${nextBet} tokens. The machine appreciates your confidence theater.`;
  persistState();
  renderAll();
}

async function spin() {
  if (isSpinning) return;

  if (state.tokens < state.bet) {
    resultMessage.textContent = roastLines.broke;
    addFeed(roastLines.broke);
    maybeVibrate([90, 40, 90]);
    renderAll();
    return;
  }

  isSpinning = true;
  state.tokens -= state.bet;
  state.jackpot += Math.round(state.bet * 0.5);
  state.spins += 1;
  state.lastPayout = 0;
  reels.forEach((reel) => reel.classList.remove("winner"));
  resultMessage.textContent = "Reels spinning. The model is converting electricity into swagger...";
  persistState();
  renderAll();

  playSpinTone();
  maybeVibrate(35);
  reels.forEach((reel) => reel.classList.add("spinning"));

  const results = [];
  for (let index = 0; index < reels.length; index += 1) {
    await delay(240 + index * 260);
    const symbol = getRandomSymbol();
    results.push(symbol);
    renderSymbol(index, symbol);
    playStopTone(280 + index * 80);
  }

  reels.forEach((reel) => reel.classList.remove("spinning"));
  state.lastSymbols = results;

  const outcome = scoreSpin(results, state.bet, state.jackpot);
  state.tokens += outcome.payout;
  state.jackpot = outcome.nextJackpot;
  state.lastPayout = outcome.payout;
  state.bestWin = Math.max(state.bestWin, outcome.payout);
  resultMessage.textContent = outcome.message;
  statusText.textContent = outcome.status;

  if (outcome.winningIndexes.length) {
    outcome.winningIndexes.forEach((index) => reels[index].classList.add("winner"));
    maybeVibrate([130, 40, 120, 40, 200]);
    playWinTone(outcome.payout);
  } else {
    maybeVibrate(70);
  }

  if (outcome.confettiBursts > 0) {
    burstConfetti(outcome.confettiBursts);
  }

  addFeed(`Spin ${state.spins}: ${outcome.feedLine}`);
  persistState();
  isSpinning = false;
  renderAll();
}

function maxChaosSpin() {
  const maxBet = BET_OPTIONS[BET_OPTIONS.length - 1];
  if (!isSpinning && state.bet !== maxBet) {
    updateBet(maxBet);
  }
  spin();
}

function scoreSpin(results, bet, jackpot) {
  const ids = results.map((symbol) => symbol.id);
  const counts = ids.reduce((map, id) => {
    map[id] = (map[id] || 0) + 1;
    return map;
  }, {});
  const allMatch = ids.every((id) => id === ids[0]);

  if (allMatch && ids[0] === "spreadsheet") {
    const payout = jackpot;
    return {
      payout,
      nextJackpot: STARTING_JACKPOT,
      message: `${roastLines.spreadsheet} Jackpot collected: +${formatNumber(payout)} tokens.`,
      status: "Jackpot dumped directly into the wallet. Nobody audited the model.",
      feedLine: `${results.map((symbol) => symbol.name).join(" / ")} -> jackpot +${formatNumber(payout)}`,
      winningIndexes: [0, 1, 2],
      confettiBursts: 140,
    };
  }

  if (allMatch) {
    const multiplierMap = {
      refund: 8,
      agi: 10,
      goblin: 6,
      gpu: 6,
      slop: 5,
      pivot: 6,
    };
    const multiplier = multiplierMap[ids[0]] || 5;
    const payout = bet * multiplier;
    return {
      payout,
      nextJackpot: jackpot,
      message: `${roastLines[ids[0]]} +${formatNumber(payout)} tokens.`,
      status: "Matching symbols detected. The dashboard has upgraded your delusion tier.",
      feedLine: `${results.map((symbol) => symbol.name).join(" / ")} -> +${formatNumber(payout)}`,
      winningIndexes: [0, 1, 2],
      confettiBursts: payout >= bet * 8 ? 90 : 50,
    };
  }

  if ((counts.refund || 0) >= 2) {
    const payout = Math.round(bet * 2.4);
    return {
      payout,
      nextJackpot: jackpot,
      message: `${roastLines.twoRefunds} +${formatNumber(payout)} tokens.`,
      status: "Minor rebate secured. The machine still considers this a premium experience.",
      feedLine: `Two Token Refunds delayed total ruin -> +${formatNumber(payout)}`,
      winningIndexes: indexesForId(ids, "refund"),
      confettiBursts: 22,
    };
  }

  if ((counts.agi || 0) >= 1) {
    const payout = Math.round(bet * 1.35);
    return {
      payout,
      nextJackpot: jackpot,
      message: `${roastLines.agiSingle} +${formatNumber(payout)} tokens.`,
      status: "AGI remains theoretical, but the valuation chart looks incredible.",
      feedLine: `AGI Soon cameo -> +${formatNumber(payout)}`,
      winningIndexes: indexesForId(ids, "agi"),
      confettiBursts: 14,
    };
  }

  return {
    payout: 0,
    nextJackpot: jackpot,
    message: roastLines.loss,
    status: "Loss recorded. The house converts your disappointment into product roadmap slides.",
    feedLine: `${results.map((symbol) => symbol.name).join(" / ")} -> 0 tokens`,
    winningIndexes: [],
    confettiBursts: 0,
  };
}

function indexesForId(ids, id) {
  return ids.flatMap((value, index) => (value === id ? [index] : []));
}

function addFeed(message) {
  state.feed = [message, ...state.feed].slice(0, 6);
}

function resetState() {
  isSpinning = false;
  state.tokens = STARTING_TOKENS;
  state.jackpot = STARTING_JACKPOT;
  state.spins = 0;
  state.bestWin = 0;
  state.lastPayout = 0;
  state.bet = 25;
  state.feed = ["Wallet reset. The machine has deleted the evidence and called it personalization."];
  state.lastSymbols = [symbols[0], symbols[1], symbols[2]];
  resultMessage.textContent = "New bankroll loaded. Time to launder more self-esteem through the model.";
  reels.forEach((reel) => reel.classList.remove("winner", "spinning"));
  persistState();
  renderAll();
}

async function shareBrag() {
  const text = `I just survived ${state.spins} spins at Prompt & Circumstance Casino and now hold ${formatNumber(
    state.tokens,
  )} fake AI tokens. The machine says this counts as product-market fit.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Prompt & Circumstance Casino",
        text,
      });
      addFeed("Shared fake winnings with the outside world. The grift is now distributed.");
      persistState();
      renderAll();
      return;
    } catch {
      // Ignore user cancellation and fall through to clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    resultMessage.textContent = "Brag text copied to clipboard. The machine appreciates your outreach strategy.";
    addFeed("Copied fake earnings to the clipboard for maximum thought-leadership.");
  } catch {
    resultMessage.textContent = "Sharing unavailable. The machine blames platform alignment.";
  }

  persistState();
  renderAll();
}

function getRandomSymbol() {
  const total = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let roll = Math.random() * total;

  for (const symbol of symbols) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol;
  }

  return symbols[symbols.length - 1];
}

function getContextPercent() {
  const consumed = state.spins * 4 + (state.bet / 10) * 3;
  return Math.max(12, 100 - Math.min(88, consumed));
}

function getStatusLine() {
  if (isSpinning) return "Inference running. Please pretend the latency is strategic.";
  if (state.lastPayout >= state.bet * 5) return "Recent win detected. The machine has become unbearably smug.";
  if (state.tokens < state.bet) return "Liquidity event required. The machine would like a fresh wallet.";
  if (state.spins === 0) return "System idle. Waiting for another irresponsible bet.";
  return "Cabinet warmed up. The reels are ready to monetize your curiosity.";
}

function getHouseNote() {
  if (state.tokens >= 900) return "House message: your fake token portfolio now qualifies as a keynote slide.";
  if (state.tokens < state.bet) return "House message: the runway is gone, but the branding remains excellent.";
  if (state.lastPayout > 0) return "House message: every payout is funded by someone else's prompt engineering bootcamp.";
  return "House message: optimism is not a payout strategy.";
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function maybeVibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function playTone(frequency, duration, type = "triangle", volume = 0.03) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function playSpinTone() {
  playTone(210, 0.18, "triangle", 0.035);
}

function playStopTone(frequency) {
  playTone(frequency, 0.12, "square", 0.03);
}

function playWinTone(payout) {
  const root = payout >= 200 ? 720 : 560;
  playTone(root, 0.16, "triangle", 0.04);
  window.setTimeout(() => playTone(root * 1.25, 0.18, "triangle", 0.035), 110);
  window.setTimeout(() => playTone(root * 1.5, 0.24, "triangle", 0.03), 240);
}

function sizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth * window.devicePixelRatio;
  confettiCanvas.height = window.innerHeight * window.devicePixelRatio;
  canvasContext.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function burstConfetti(pieces) {
  const particles = Array.from({ length: pieces }, () => ({
    x: window.innerWidth / 2 + randomBetween(-180, 180),
    y: window.innerHeight * 0.2 + randomBetween(-40, 40),
    size: randomBetween(4, 10),
    color: randomItem(["#f4c95d", "#63e3ff", "#ff7d66", "#b8ff6a", "#9d8cff"]),
    velocityX: randomBetween(-5, 5),
    velocityY: randomBetween(-12, -4),
    rotation: randomBetween(0, Math.PI * 2),
    spin: randomBetween(-0.2, 0.2),
    life: randomBetween(40, 90),
  }));

  const animate = () => {
    canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((particle) => {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.22;
      particle.rotation += particle.spin;
      particle.life -= 1;

      canvasContext.save();
      canvasContext.translate(particle.x, particle.y);
      canvasContext.rotate(particle.rotation);
      canvasContext.fillStyle = particle.color;
      canvasContext.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.7);
      canvasContext.restore();
    });

    const alive = particles.some((particle) => particle.life > 0 && particle.y < window.innerHeight + 40);
    if (alive) {
      window.requestAnimationFrame(animate);
    } else {
      canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  };

  animate();
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}
