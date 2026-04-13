const symbols = ["🧠", "🪙", "🤖", "🔥", "💼", "📉", "🧃"];
const storageKey = "token-tumbler-save";

const state = {
  balance: 120,
  baseSpinCost: 15,
  multiplier: 1,
  isSpinning: false
};

const elements = {
  balance: document.getElementById("token-balance"),
  spinCost: document.getElementById("spin-cost"),
  multiplier: document.getElementById("multiplier"),
  status: document.getElementById("status-line"),
  spinButton: document.getElementById("spin-button"),
  boostButton: document.getElementById("boost-button"),
  resetButton: document.getElementById("reset-button"),
  activityFeed: document.getElementById("activity-feed"),
  feedItemTemplate: document.getElementById("feed-item-template"),
  reels: Array.from(document.querySelectorAll(".reel"))
};

const feedCopy = {
  lowBalance: [
    "Your runway now fits inside a tweet thread.",
    "Investors recommend pivoting to 'being profitable'.",
    "The model requests fewer vibes and more capital."
  ],
  boost: [
    "You bought premium hype. The deck now has gradients.",
    "Additional tokens allocated to narrative alignment.",
    "Consultants added. Confidence increased by several fonts."
  ],
  miss: [
    "No payout. The machine called it a strategic learning cycle.",
    "Tokens spent. Insight gained. Revenue still mostly theoretical.",
    "That spin achieved strong engagement with no material outcome."
  ],
  smallWin: [
    "A modest token harvest. Enough to keep the keynote going.",
    "Nice. You monetized jargon at a sustainable trickle.",
    "The dashboard glows green. Nobody checks what it means."
  ],
  bigWin: [
    "Jackpot. Three executives just said 'platform' in unison.",
    "Massive return. The machine has become pre-seed sentient.",
    "Wild success. Your token economy is now too abstract to audit."
  ]
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function addFeedItem(message) {
  const item = elements.feedItemTemplate.content.firstElementChild.cloneNode(true);
  item.textContent = message;
  elements.activityFeed.prepend(item);

  while (elements.activityFeed.children.length > 6) {
    elements.activityFeed.removeChild(elements.activityFeed.lastElementChild);
  }

  saveState();
}

function saveState() {
  window.localStorage.setItem(storageKey, JSON.stringify({
    balance: state.balance,
    multiplier: state.multiplier,
    reels: elements.reels.map((reel) => reel.textContent),
    feed: Array.from(elements.activityFeed.children).map((item) => item.textContent)
  }));
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed.balance !== "number" || typeof parsed.multiplier !== "number") {
      return false;
    }

    state.balance = parsed.balance;
    state.multiplier = parsed.multiplier;

    const savedReels = Array.isArray(parsed.reels) ? parsed.reels : [];
    elements.reels.forEach((reel, index) => {
      reel.textContent = savedReels[index] || symbols[index];
      reel.classList.remove("spinning", "win");
    });

    elements.activityFeed.innerHTML = "";
    const savedFeed = Array.isArray(parsed.feed) ? parsed.feed.slice(0, 6) : [];
    savedFeed.reverse().forEach((message) => addFeedItem(message));
    return true;
  } catch {
    return false;
  }
}

function render() {
  const spinCost = state.baseSpinCost * state.multiplier;
  elements.balance.textContent = state.balance;
  elements.spinCost.textContent = spinCost;
  elements.multiplier.textContent = `x${state.multiplier}`;
  elements.spinButton.textContent = `Spend ${spinCost} tokens`;
  elements.spinButton.disabled = state.isSpinning || state.balance < spinCost;
  elements.boostButton.disabled = state.isSpinning || state.balance < 25;
  saveState();
}

function setStatus(message, tone = "normal") {
  elements.status.textContent = message;
  elements.status.style.color =
    tone === "danger" ? "var(--danger)" :
    tone === "gold" ? "var(--gold)" :
    "var(--mint)";
}

function calculatePayout(result) {
  const [a, b, c] = result;

  if (a === "🤖" && b === "🤖" && c === "🤖") {
    return { payout: 120 * state.multiplier, message: randomItem(feedCopy.bigWin), tone: "gold" };
  }

  if (a === "🪙" && b === "🪙" && c === "🪙") {
    return { payout: 90 * state.multiplier, message: randomItem(feedCopy.bigWin), tone: "gold" };
  }

  if (a === "💼" && b === "🧠" && c === "🔥") {
    return { payout: 60 * state.multiplier, message: randomItem(feedCopy.bigWin), tone: "gold" };
  }

  if (a === b || b === c || a === c) {
    return { payout: 28 * state.multiplier, message: randomItem(feedCopy.smallWin), tone: "normal" };
  }

  return { payout: 0, message: randomItem(feedCopy.miss), tone: "danger" };
}

function animateReels(finalSymbols) {
  return Promise.all(
    elements.reels.map((reel, index) => new Promise((resolve) => {
      reel.classList.remove("win");
      reel.classList.add("spinning");

      const interval = window.setInterval(() => {
        reel.textContent = randomItem(symbols);
      }, 85);

      window.setTimeout(() => {
        window.clearInterval(interval);
        reel.classList.remove("spinning");
        reel.textContent = finalSymbols[index];
        resolve();
      }, 650 + (index * 220));
    }))
  );
}

async function spin() {
  const cost = state.baseSpinCost * state.multiplier;

  if (state.isSpinning || state.balance < cost) {
    if (state.balance < cost) {
      setStatus("Insufficient tokens. Even satire has operating costs.", "danger");
      addFeedItem(randomItem(feedCopy.lowBalance));
    }
    return;
  }

  state.isSpinning = true;
  state.balance -= cost;
  render();
  setStatus("Allocating compute budget to pure spectacle...");

  const result = Array.from({ length: 3 }, () => randomItem(symbols));
  const payoutSummary = calculatePayout(result);

  await animateReels(result);

  state.balance += payoutSummary.payout;
  state.isSpinning = false;

  if (payoutSummary.payout > 0) {
    elements.reels.forEach((reel) => reel.classList.add("win"));
    setStatus(`${payoutSummary.message} +${payoutSummary.payout} tokens.`, payoutSummary.tone);
    addFeedItem(`${payoutSummary.message} Net result: +${payoutSummary.payout - cost} tokens after expenses.`);
  } else {
    setStatus(`${payoutSummary.message} -${cost} tokens.`, payoutSummary.tone);
    addFeedItem(`${payoutSummary.message} The board describes this as "investment".`);
  }

  if (state.balance < state.baseSpinCost * state.multiplier) {
    addFeedItem(randomItem(feedCopy.lowBalance));
  }

  render();
}

function buyBoost() {
  if (state.isSpinning || state.balance < 25) {
    return;
  }

  state.balance -= 25;
  state.multiplier = Math.min(state.multiplier + 1, 5);
  setStatus(`Hype acquired. Future payouts now scale at x${state.multiplier}.`, "gold");
  addFeedItem(randomItem(feedCopy.boost));
  render();
}

function resetGame() {
  state.balance = 120;
  state.multiplier = 1;
  state.isSpinning = false;

  const startingReels = ["🧠", "🪙", "🔥"];
  elements.reels.forEach((reel, index) => {
    reel.textContent = startingReels[index];
    reel.classList.remove("spinning", "win");
  });

  elements.activityFeed.innerHTML = "";
  setStatus("Economy reset. The machine is once again funded by optimism.");
  addFeedItem("Fresh tokens minted. Nobody asked where they came from.");
  render();
}

elements.spinButton.addEventListener("click", spin);
elements.boostButton.addEventListener("click", buyBoost);
elements.resetButton.addEventListener("click", resetGame);

if (loadState()) {
  setStatus("Saved token economy restored. The satire resumes where it left off.");
  render();
} else {
  resetGame();
}
