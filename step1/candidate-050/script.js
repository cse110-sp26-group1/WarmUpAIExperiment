const SYMBOLS = ["404", "GPU", "MOAT", "HYPE", "LOL", "SEED"];
const STARTING_TOKENS = 1200;
const SPIN_COST = 75;
const STORAGE_KEY = "token-tug-o-war-balance";

const reels = [...document.querySelectorAll(".reel")];
const machinePanel = document.querySelector(".machine-panel");
const spinButton = document.querySelector("#spinButton");
const resetButton = document.querySelector("#resetButton");
const muteButton = document.querySelector("#muteButton");
const balanceValue = document.querySelector("#tokenBalance");
const spinCostValue = document.querySelector("#spinCost");
const resultMessage = document.querySelector("#resultMessage");
const toastTemplate = document.querySelector("#toastTemplate");

let balance = readStoredBalance();
let isMuted = false;
let spinning = false;
let audioContext;

spinCostValue.textContent = SPIN_COST;
updateBalance();
syncButtons();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetWallet);
muteButton.addEventListener("click", toggleMute);

function readStoredBalance() {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : STARTING_TOKENS;
}

function persistBalance() {
  window.localStorage.setItem(STORAGE_KEY, String(balance));
}

function updateBalance() {
  balanceValue.textContent = balance;
  spinButton.textContent = `Spend ${SPIN_COST} Tokens`;
}

function syncButtons() {
  spinButton.disabled = spinning || balance < SPIN_COST;
}

function setMessage(text) {
  resultMessage.textContent = text;
}

function showToast(text) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = text;
  document.body.append(toast);

  toast.animate(
    [
      { opacity: 0, transform: "translate(-50%, 12px)" },
      { opacity: 1, transform: "translate(-50%, 0)" },
      { opacity: 1, transform: "translate(-50%, 0)" },
      { opacity: 0, transform: "translate(-50%, 12px)" },
    ],
    { duration: 2200, easing: "ease-out" }
  ).finished.finally(() => toast.remove());
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(frequency, duration, type = "sine", volume = 0.03) {
  if (isMuted) {
    return;
  }

  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playSpinSound(step) {
  playTone(220 + step * 30, 0.12, "triangle", 0.025);
}

function playWinSound() {
  [392, 523, 659].forEach((note, index) => {
    window.setTimeout(() => playTone(note, 0.22, "square", 0.04), index * 90);
  });
}

function playLossSound() {
  [220, 180].forEach((note, index) => {
    window.setTimeout(() => playTone(note, 0.18, "sawtooth", 0.025), index * 120);
  });
}

function toggleMute() {
  isMuted = !isMuted;
  muteButton.textContent = `Sound: ${isMuted ? "Off" : "On"}`;
  muteButton.setAttribute("aria-pressed", String(isMuted));
}

function resetWallet() {
  balance = STARTING_TOKENS;
  persistBalance();
  updateBalance();
  syncButtons();
  setMessage("Wallet reset. Financial consequences deleted like a chat history.");
  showToast("Fresh tokens deployed.");
}

async function spin() {
  if (spinning || balance < SPIN_COST) {
    if (balance < SPIN_COST) {
      setMessage("You are out of tokens. The model suggests trying 'enterprise pricing'.");
      showToast("Insufficient delusion budget.");
    }
    return;
  }

  spinning = true;
  balance -= SPIN_COST;
  persistBalance();
  updateBalance();
  syncButtons();
  setMessage("Allocating budget to speculative inference...");

  const results = await Promise.all(reels.map((reel, index) => animateReel(reel, index)));
  const payout = scoreSpin(results);

  balance += payout.tokens;
  persistBalance();
  updateBalance();
  syncButtons();
  spinning = false;

  machinePanel.classList.remove("flash-win", "flash-loss");
  void machinePanel.offsetWidth;
  machinePanel.classList.add(payout.tokens > 0 ? "flash-win" : "flash-loss");

  if (payout.tokens > 0) {
    playWinSound();
  } else {
    playLossSound();
  }

  setMessage(payout.message);
  showToast(`${results.join(" • ")} | ${payout.tokens >= 0 ? "+" : ""}${payout.tokens} tokens`);
}

function animateReel(reel, reelIndex) {
  return new Promise((resolve) => {
    let steps = 0;
    const totalSteps = 11 + reelIndex * 3;

    const interval = window.setInterval(() => {
      const symbol = pickRandom(SYMBOLS);
      reel.innerHTML = `<span class="symbol">${symbol}</span>`;
      playSpinSound(steps + reelIndex);
      steps += 1;

      if (steps >= totalSteps) {
        window.clearInterval(interval);
        const finalSymbol = pickWeightedSymbol();
        reel.innerHTML = `<span class="symbol">${finalSymbol}</span>`;
        reel.animate(
          [
            { transform: "translateY(-8px)" },
            { transform: "translateY(0)" },
          ],
          { duration: 220, easing: "ease-out" }
        );
        resolve(finalSymbol);
      }
    }, 85 + reelIndex * 40);
  });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickWeightedSymbol() {
  const roll = Math.random();

  if (roll < 0.12) return "404";
  if (roll < 0.26) return "LOL";
  if (roll < 0.42) return "GPU";
  if (roll < 0.58) return "HYPE";
  if (roll < 0.77) return "SEED";
  return "MOAT";
}

function scoreSpin(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] ?? 0) + 1;
    return map;
  }, {});

  if (counts.MOAT === 3) {
    return {
      tokens: 900,
      message: "Triple MOAT. Incredible. You monetized jargon and the market applauds.",
    };
  }

  const highestMatch = Math.max(...Object.values(counts));

  if (highestMatch === 3) {
    const symbol = Object.keys(counts).find((entry) => counts[entry] === 3);
    return {
      tokens: 400,
      message: `Three ${symbol}s. The algorithm has mistaken confidence for value.`,
    };
  }

  if (highestMatch === 2) {
    const symbol = Object.keys(counts).find((entry) => counts[entry] === 2);
    return {
      tokens: 120,
      message: `Two ${symbol}s. Congratulations on your modestly overfit victory.`,
    };
  }

  if (counts["404"]) {
    return {
      tokens: 40,
      message: "A 404 appeared, so support issued sympathy tokens and a vague apology.",
    };
  }

  return {
    tokens: 0,
    message: "No payout. Your tokens were converted into a demo nobody asked for.",
  };
}
