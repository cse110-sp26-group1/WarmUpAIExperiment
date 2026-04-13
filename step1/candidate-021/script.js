const symbols = [
  { icon: "404", label: "Missing benchmark", reward: 0 },
  { icon: "GPU", label: "Burning investor cash", reward: 12 },
  { icon: "LAG", label: "Waiting for tokens", reward: 8 },
  { icon: "BLOB", label: "Unstructured answer", reward: 10 },
  { icon: "OOM", label: "Context window implosion", reward: 5 },
  { icon: "HYPE", label: "Series A optimism", reward: 15 },
  { icon: "LOL", label: "Synthetic confidence", reward: 7 }
];

const spinCost = 15;
const jackpotReward = 250;
const matchReward = 90;
const nearMissReward = 25;
const storageKey = "token-tug-casino-state";

const state = {
  tokens: 120,
  streak: 0,
  lastBonusDate: null,
  spinning: false,
  glowMode: false
};

const tokenCount = document.getElementById("tokenCount");
const message = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const freebieButton = document.getElementById("freebieButton");
const themeToggle = document.getElementById("themeToggle");
const streakPill = document.getElementById("streakPill");
const eventLog = document.getElementById("eventLog");
const logTemplate = document.getElementById("logTemplate");
const reels = [0, 1, 2].map((index) => document.getElementById(`reel${index}`));

const messages = {
  poor: [
    "The reels detected budget consciousness. No bonus, just vibes.",
    "The model politely billed you for an answer that began with 'it depends.'",
    "A consultant somewhere called that spin a strategic investment."
  ],
  nearMiss: [
    "Two matching symbols. That's practically enterprise-ready.",
    "Close enough to impress a keynote audience.",
    "Near miss achieved. Please clap for the product demo."
  ],
  win: [
    "Triple match. The board approves another six months of runway.",
    "A miracle. The machine emitted value instead of slideware.",
    "You won enough tokens to ask for nuance. Dangerous."
  ],
  jackpot: [
    "JACKPOT. The cluster briefly became profitable.",
    "Jackpot landed. Someone just changed their LinkedIn headline to 'AI visionary.'",
    "All reels aligned. This has never happened in a peer-reviewed environment."
  ]
};

function pickSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function loadState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey));
    if (!saved) {
      return;
    }

    if (typeof saved.tokens === "number") {
      state.tokens = saved.tokens;
    }

    if (typeof saved.streak === "number") {
      state.streak = saved.streak;
    }

    if (typeof saved.lastBonusDate === "string" || saved.lastBonusDate === null) {
      state.lastBonusDate = saved.lastBonusDate;
    }

    if (typeof saved.glowMode === "boolean") {
      state.glowMode = saved.glowMode;
    }
  } catch (error) {
    logEvent("Save data corrupted. Treasury rebooted from defaults.");
  }
}

function saveState() {
  window.localStorage.setItem(storageKey, JSON.stringify({
    tokens: state.tokens,
    streak: state.streak,
    lastBonusDate: state.lastBonusDate,
    glowMode: state.glowMode
  }));
}

function formatTime() {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

function randomMessage(group) {
  const groupMessages = messages[group];
  return groupMessages[Math.floor(Math.random() * groupMessages.length)];
}

function logEvent(text) {
  const fragment = logTemplate.content.cloneNode(true);
  fragment.querySelector(".event-time").textContent = formatTime();
  fragment.querySelector(".event-copy").textContent = text;
  eventLog.prepend(fragment);

  while (eventLog.children.length > 6) {
    eventLog.removeChild(eventLog.lastElementChild);
  }
}

function updateUi() {
  tokenCount.textContent = state.tokens.toString();
  streakPill.textContent = state.streak > 1 ? `${state.streak} win streak` : state.streak === 1 ? "Hot streak" : "No streak";
  spinButton.disabled = state.spinning || state.tokens < spinCost;
  freebieButton.disabled = state.lastBonusDate === new Date().toDateString();
  document.body.classList.toggle("glow-mode", state.glowMode);
  themeToggle.setAttribute("aria-pressed", String(state.glowMode));
}

function setMessage(text, tone = "neutral") {
  message.textContent = text;
  message.style.color = tone === "good" ? "var(--success)" : tone === "bad" ? "var(--danger)" : "var(--muted)";
}

async function animateReels(finalSymbols) {
  reels.forEach((reel) => reel.classList.add("spinning"));

  for (let tick = 0; tick < 12; tick += 1) {
    reels.forEach((reel) => {
      reel.textContent = pickSymbol().icon;
    });
    await new Promise((resolve) => window.setTimeout(resolve, 85 + tick * 10));
  }

  finalSymbols.forEach((symbol, index) => {
    reels[index].textContent = symbol.icon;
    reels[index].classList.remove("spinning");
  });
}

function evaluate(finalSymbols) {
  const icons = finalSymbols.map((symbol) => symbol.icon);
  const uniqueIcons = new Set(icons);
  const hasJackpot = icons.every((icon) => icon === "HYPE");
  const hasThreeMatch = uniqueIcons.size === 1;
  const hasPair = uniqueIcons.size === 2;

  if (hasJackpot) {
    state.tokens += jackpotReward;
    state.streak += 1;
    saveState();
    return {
      text: `${randomMessage("jackpot")} +${jackpotReward} tokens.`,
      tone: "good",
      log: `Jackpot on ${icons.join(" / ")}. Treasury inflated by ${jackpotReward} tokens.`
    };
  }

  if (hasThreeMatch) {
    state.tokens += matchReward;
    state.streak += 1;
    saveState();
    return {
      text: `${randomMessage("win")} +${matchReward} tokens.`,
      tone: "good",
      log: `Triple ${icons[0]} landed. You recovered ${matchReward} tokens from the AI hype cycle.`
    };
  }

  if (hasPair) {
    state.tokens += nearMissReward;
    state.streak = 0;
    saveState();
    return {
      text: `${randomMessage("nearMiss")} Consolation prize: +${nearMissReward} tokens.`,
      tone: "neutral",
      log: `Partial match on ${icons.join(" / ")}. Machine returned ${nearMissReward} courtesy tokens.`
    };
  }

  state.streak = 0;
  saveState();
  return {
    text: randomMessage("poor"),
    tone: "bad",
    log: `No alignment on ${icons.join(" / ")}. Tokens vanished into the inference furnace.`
  };
}

async function spin() {
  if (state.spinning || state.tokens < spinCost) {
    return;
  }

  state.spinning = true;
  state.tokens -= spinCost;
  saveState();
  updateUi();
  setMessage("Streaming premium nonsense from the cloud...", "neutral");

  const finalSymbols = [pickSymbol(), pickSymbol(), pickSymbol()];
  await animateReels(finalSymbols);

  const result = evaluate(finalSymbols);
  setMessage(result.text, result.tone);
  logEvent(result.log);

  state.spinning = false;
  updateUi();

  if (state.tokens < spinCost) {
    setMessage("You're below the token minimum. Time to go pitch a new funding round.", "bad");
  }
}

function claimBonus() {
  const today = new Date().toDateString();
  if (state.lastBonusDate === today) {
    setMessage("The daily hallucination bonus was already claimed today.", "neutral");
    return;
  }

  const bonus = 40;
  state.lastBonusDate = today;
  state.tokens += bonus;
  saveState();
  updateUi();
  setMessage(`Bonus claimed. +${bonus} tokens for believing the benchmark chart.`, "good");
  logEvent(`Daily hallucination bonus granted. Treasury padded by ${bonus} tokens.`);
}

function toggleTheme() {
  state.glowMode = !state.glowMode;
  saveState();
  updateUi();
  logEvent(state.glowMode ? "Glow mode enabled. Casino now looks alarmingly venture-backed." : "Glow mode disabled. Back to tasteful fiscal ruin.");
}

spinButton.addEventListener("click", spin);
freebieButton.addEventListener("click", claimBonus);
themeToggle.addEventListener("click", toggleTheme);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    spin();
  }
});

loadState();
logEvent("Machine booted. Initial bankroll allocated from the speculative compute fund.");
updateUi();
