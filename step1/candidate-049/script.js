const symbols = [
  {
    name: "GPU Cluster",
    emoji: "🖥️",
    flavor: "warm silicon, cold margins",
    payout: 55,
  },
  {
    name: "Prompt Leak",
    emoji: "🫗",
    flavor: "confidentiality is a journey",
    payout: 40,
  },
  {
    name: "Hallucination",
    emoji: "🦄",
    flavor: "wrong with confidence",
    payout: 35,
  },
  {
    name: "Synergy Deck",
    emoji: "📊",
    flavor: "slideware backed by vibes",
    payout: 25,
  },
  {
    name: "Token Whale",
    emoji: "🐋",
    flavor: "bills by the paragraph",
    payout: 90,
  },
  {
    name: "VC Applause",
    emoji: "👏",
    flavor: "pre-revenue standing ovation",
    payout: 70,
  },
];

const upgrades = [
  { name: "Enterprise Wrapper", cost: 80, level: "Series A", quip: "Add three dashboards and call it trust." },
  { name: "Agent Swarm", cost: 140, level: "Unicorn Adjacent", quip: "More bots. Fewer answers." },
  { name: "Vision API Roadmap", cost: 220, level: "Peak Hype", quip: "Now your burn rate can see." },
];

const storageKey = "token-tugger-3000-state";
const defaultState = {
  balance: 250,
  lastPayout: 0,
  spendLevel: "Seed Stage",
  spinCost: 25,
  spentIndex: -1,
};

const reelEls = [0, 1, 2].map((index) => document.getElementById(`reel${index}`));
const balanceEl = document.getElementById("tokenBalance");
const lastPayoutEl = document.getElementById("lastPayout");
const spendLevelEl = document.getElementById("spendLevel");
const costDisplayEl = document.getElementById("costDisplay");
const statusBannerEl = document.getElementById("statusBanner");
const payoutListEl = document.getElementById("payoutList");
const upgradeListEl = document.getElementById("upgradeList");
const spinButton = document.getElementById("spinButton");
const turboButton = document.getElementById("turboButton");
const spendButton = document.getElementById("spendButton");
const machineFrame = document.querySelector(".machine-frame");

let state = loadState();
let isSpinning = false;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey));
    if (!parsed) {
      return { ...defaultState };
    }
    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

function persistState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function createSymbolMarkup(symbol) {
  return `
    <article class="symbol">
      <span class="symbol-emoji">${symbol.emoji}</span>
      <span class="symbol-name">${symbol.name}</span>
      <span class="symbol-flavor">${symbol.flavor}</span>
    </article>
  `;
}

function populateReels() {
  reelEls.forEach((reelEl, reelIndex) => {
    const rotated = [...symbols.slice(reelIndex), ...symbols.slice(0, reelIndex)];
    reelEl.innerHTML = [...rotated, ...rotated, ...rotated].map(createSymbolMarkup).join("");
  });
}

function renderPayouts() {
  payoutListEl.innerHTML = symbols
    .map(
      (symbol) => `
        <li class="payout-item">
          <div class="payout-row">
            <div>
              <div class="item-title">${symbol.emoji} ${symbol.name} x3</div>
              <div class="item-meta">${symbol.flavor}</div>
            </div>
            <strong>+${symbol.payout} tokens</strong>
          </div>
        </li>
      `
    )
    .join("");
}

function renderUpgrades() {
  upgradeListEl.innerHTML = upgrades
    .map((upgrade, index) => {
      const bought = index <= state.spentIndex;
      return `
        <li class="upgrade-item">
          <div class="upgrade-row">
            <div>
              <div class="item-title">${upgrade.name}</div>
              <div class="item-meta">${upgrade.quip}</div>
            </div>
            <strong>${bought ? "Purchased" : `${upgrade.cost} tokens`}</strong>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderStatus(message, tone = "") {
  statusBannerEl.textContent = message;
  statusBannerEl.classList.remove("is-win", "is-loss");
  if (tone) {
    statusBannerEl.classList.add(tone);
  }
}

function renderStats() {
  balanceEl.textContent = state.balance;
  lastPayoutEl.textContent = state.lastPayout;
  spendLevelEl.textContent = state.spendLevel;
  costDisplayEl.textContent = `Spin Cost: ${state.spinCost} tokens`;
  renderUpgrades();
  spinButton.disabled = isSpinning || state.balance < state.spinCost;
  turboButton.disabled = isSpinning || state.balance < state.spinCost * 2;
  spendButton.disabled = isSpinning || state.spentIndex >= upgrades.length - 1;
}

function pickResult(forceJackpot = false) {
  if (forceJackpot) {
    const lucky = symbols[Math.floor(Math.random() * symbols.length)];
    return [lucky, lucky, lucky];
  }

  return Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
}

function playTone(type) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const audioContext = new AudioContextCtor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type === "win" ? "triangle" : "sawtooth";
  oscillator.frequency.value = type === "win" ? 660 : 220;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();

  oscillator.frequency.exponentialRampToValueAtTime(
    type === "win" ? 880 : 110,
    audioContext.currentTime + 0.18
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
  oscillator.stop(audioContext.currentTime + 0.24);
}

async function animateReels(result) {
  const animationDuration = 820;
  const cellHeight = 102;

  await Promise.all(
    reelEls.map((reelEl, index) => {
      reelEl.style.transform = "translateY(0)";
      const targetIndex = symbols.findIndex((symbol) => symbol.name === result[index].name);
      const travelCells = symbols.length + targetIndex;
      const distance = -travelCells * cellHeight;

      const animation = reelEl.animate(
        [
          { transform: "translateY(0)" },
          { transform: `translateY(${distance}px)` },
        ],
        {
          duration: animationDuration + index * 180,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "forwards",
        }
      );

      return animation.finished.then(() => {
        reelEl.style.transform = `translateY(${distance}px)`;
      });
    })
  );
}

function evaluate(result, costMultiplier) {
  const [a, b, c] = result;
  const allMatch = a.name === b.name && b.name === c.name;

  if (allMatch) {
    const payout = a.payout * costMultiplier;
    state.balance += payout;
    state.lastPayout = payout;
    state.spinCost = Math.min(60, state.spinCost + 5);
    state.spendLevel = state.spentIndex >= 0 ? upgrades[state.spentIndex].level : "Seed Stage";
    renderStatus(`Jackpot: ${a.name} paid ${payout} tokens. Accountability postponed.`, "is-win");
    machineFrame.classList.remove("flash");
    void machineFrame.offsetWidth;
    machineFrame.classList.add("flash");
    playTone("win");
    if ("vibrate" in navigator) {
      navigator.vibrate([80, 40, 120]);
    }
    return;
  }

  state.lastPayout = 0;
  renderStatus(`No match. The machine spent your tokens on "alignment strategy."`, "is-loss");
  playTone("loss");
}

async function spin(costMultiplier = 1, forceJackpot = false) {
  if (isSpinning) {
    return;
  }

  const totalCost = state.spinCost * costMultiplier;
  if (state.balance < totalCost) {
    renderStatus(`Insufficient tokens. Even satire has cloud costs.`, "is-loss");
    return;
  }

  isSpinning = true;
  state.balance -= totalCost;
  renderStatus(costMultiplier > 1 ? "Deploying bigger model. Please admire the burn rate." : "Spinning up synthetic ambition...");
  renderStats();

  const result = pickResult(forceJackpot);
  await animateReels(result);
  evaluate(result, costMultiplier);
  isSpinning = false;
  persistState();
  renderStats();
}

function wasteTokens() {
  const nextUpgrade = upgrades[state.spentIndex + 1];
  if (!nextUpgrade) {
    renderStatus("You have fully optimized the nonsense pipeline already.", "is-win");
    return;
  }

  if (state.balance < nextUpgrade.cost) {
    renderStatus(`You need ${nextUpgrade.cost} tokens to buy ${nextUpgrade.name}.`, "is-loss");
    return;
  }

  state.balance -= nextUpgrade.cost;
  state.spentIndex += 1;
  state.lastPayout = 0;
  state.spendLevel = nextUpgrade.level;
  state.spinCost = Math.max(20, state.spinCost - 5);
  renderStatus(`${nextUpgrade.name} acquired. Congratulations on productizing the joke.`, "is-win");
  machineFrame.classList.remove("flash");
  void machineFrame.offsetWidth;
  machineFrame.classList.add("flash");
  playTone("win");
  persistState();
  renderStats();
}

populateReels();
renderPayouts();
renderStats();
renderStatus("Welcome, founder. Please convert pretend demand into pretend value.");

spinButton.addEventListener("click", () => spin());
turboButton.addEventListener("click", () => spin(2, Math.random() > 0.68));
spendButton.addEventListener("click", wasteTokens);
