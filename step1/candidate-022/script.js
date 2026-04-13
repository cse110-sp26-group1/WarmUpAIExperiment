const symbols = ["🤖", "🪙", "🔥", "📈", "🧃", "🧠"];
const spinCost = 15;
const bonusBuy = 60;
const reelEls = Array.from(document.querySelectorAll(".reel"));
const tokenCountEl = document.getElementById("tokenCount");
const bestWinEl = document.getElementById("bestWin");
const resultLineEl = document.getElementById("resultLine");
const spinButton = document.getElementById("spinButton");
const boostButton = document.getElementById("boostButton");

let tokens = 120;
let isSpinning = false;
let bestWin = Number(localStorage.getItem("bestWin") || 0);

bestWinEl.textContent = String(bestWin);
renderTokens();

spinButton.addEventListener("click", spin);
boostButton.addEventListener("click", buyTokens);

function renderTokens() {
  tokenCountEl.textContent = String(tokens);
  spinButton.disabled = isSpinning || tokens < spinCost;
}

async function spin() {
  if (isSpinning || tokens < spinCost) {
    if (tokens < spinCost) {
      setMessage("Insufficient tokens. The model recommends monetizing your curiosity.");
      toast("Wallet empty. Consider the ethically questionable refill button.");
    }
    return;
  }

  isSpinning = true;
  tokens -= spinCost;
  renderTokens();
  setMessage(`Burned ${spinCost} tokens to ask the machine for statistically flavored hope...`);
  playTone(220, 0.08, "triangle");
  wiggle();

  const results = [];
  for (const [index, reelEl] of reelEls.entries()) {
    reelEl.classList.add("spinning");
    await wait(220 + index * 140);

    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    results.push(symbol);
    reelEl.textContent = symbol;
    reelEl.classList.remove("spinning");
    playTone(280 + index * 110, 0.05, "square");
  }

  const payout = score(results);
  tokens += payout.amount;
  bestWin = Math.max(bestWin, payout.amount, bestWin);
  localStorage.setItem("bestWin", String(bestWin));
  bestWinEl.textContent = String(bestWin);
  renderTokens();

  if (navigator.vibrate) {
    navigator.vibrate(payout.amount > 0 ? [60, 30, 60] : [50]);
  }

  setMessage(`${results.join(" ")} ${payout.message}`);
  if (payout.amount > 0) {
    playTone(640, 0.12, "sine");
    playTone(840, 0.18, "sine", 0.04);
    toast(`Synthetic wealth acquired: +${payout.amount} tokens.`);
  } else {
    playTone(140, 0.14, "sawtooth");
  }

  isSpinning = false;
  renderTokens();
}

function score(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const joined = results.join("");

  if (joined === "🪙🪙🪙") {
    return {
      amount: 120,
      message: "Token singularity achieved. Compliance applauds your fake prosperity."
    };
  }

  if (joined === "🤖🤖🤖") {
    return {
      amount: 90,
      message: "Three bots aligned. You have unlocked maximum keynote confidence."
    };
  }

  if (joined === "🔥🔥🔥") {
    return {
      amount: 70,
      message: "The launch thread is ripping. Someone just called this 'inevitable.'"
    };
  }

  if (values[0] === 3) {
    return {
      amount: 55,
      message: "Triple synergy. Analysts are calling it 'aggressively monetizable.'"
    };
  }

  if (values[0] === 2) {
    return {
      amount: 25,
      message: "A pair! Venture capitalists are hovering nearby with a term sheet."
    };
  }

  return {
    amount: 0,
    message: "No match. Your tokens have been converted into an enterprise AI upsell."
  };
}

function buyTokens() {
  tokens += bonusBuy;
  renderTokens();
  setMessage(`Purchased ${bonusBuy} emergency tokens. The machine called it "frictionless value capture."`);
  toast("Wallet topped up. Financial wisdom not included.");
  playTone(520, 0.08, "triangle");
}

function setMessage(message) {
  resultLineEl.textContent = message;
}

function wiggle() {
  document.querySelector(".reels-frame").animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-8px)" },
      { transform: "translateX(8px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(0)" }
    ],
    { duration: 420, easing: "ease-out" }
  );
}

function toast(message) {
  const template = document.getElementById("messageTemplate");
  const toastEl = template.content.firstElementChild.cloneNode(true);
  toastEl.textContent = message;
  document.body.appendChild(toastEl);

  toastEl.animate(
    [
      { transform: "translateY(24px)", opacity: 0 },
      { transform: "translateY(0)", opacity: 1 }
    ],
    { duration: 220, easing: "ease-out", fill: "forwards" }
  );

  setTimeout(() => {
    toastEl.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(18px)", opacity: 0 }
      ],
      { duration: 220, easing: "ease-in", fill: "forwards" }
    );
    setTimeout(() => toastEl.remove(), 220);
  }, 2000);
}

function playTone(frequency, duration, type, delay = 0) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  if (!playTone.ctx) {
    playTone.ctx = new AudioContextCtor();
  }

  const ctx = playTone.ctx;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
