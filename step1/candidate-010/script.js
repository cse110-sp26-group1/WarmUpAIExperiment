const SYMBOLS = [
  { label: "TOKEN", weight: 18 },
  { label: "PROMPT", weight: 14 },
  { label: "GPU", weight: 8 },
  { label: "AGENT", weight: 10 },
  { label: "HYPE", weight: 12 },
  { label: "CACHE", weight: 10 },
  { label: "LAG", weight: 12 },
  { label: "HALLU", weight: 9 },
  { label: "404", weight: 7 },
];

const STORAGE_KEY = "token-tugger-3000-save";
const STARTING_TOKENS = 250;
const SPIN_COST = 25;
const HISTORY_LIMIT = 6;

const walletTokens = document.querySelector("#walletTokens");
const tokensSpent = document.querySelector("#tokensSpent");
const winStreak = document.querySelector("#winStreak");
const modelMood = document.querySelector("#modelMood");
const jackpotCount = document.querySelector("#jackpotCount");
const spinCount = document.querySelector("#spinCount");
const resultText = document.querySelector("#resultText");
const spinButton = document.querySelector("#spinButton");
const resetButton = document.querySelector("#resetButton");
const shareButton = document.querySelector("#shareButton");
const muteButton = document.querySelector("#muteButton");
const historyList = document.querySelector("#historyList");
const leverKnob = document.querySelector("#leverKnob");
const machineFrame = document.querySelector(".machine-frame");
const reels = Array.from(document.querySelectorAll(".reel-symbol"));

let audioContext;
let state = loadState();
render();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);
shareButton.addEventListener("click", shareResult);
muteButton.addEventListener("click", toggleMute);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return baseState();
    }

    const parsed = JSON.parse(raw);
    return {
      ...baseState(),
      ...parsed,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, HISTORY_LIMIT) : baseState().history,
    };
  } catch {
    return baseState();
  }
}

function baseState() {
  return {
    tokens: STARTING_TOKENS,
    spent: 0,
    streak: 0,
    jackpots: 0,
    spins: 0,
    history: ["Fresh machine booted. Wallet topped up with 250 tokens."],
    muted: false,
    lastSpin: ["TOKEN", "PROMPT", "GPU"],
    lastMessage: "Insert confidence. Receive probabilistic entertainment.",
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  walletTokens.textContent = String(state.tokens);
  tokensSpent.textContent = String(state.spent);
  winStreak.textContent = String(state.streak);
  jackpotCount.textContent = String(state.jackpots);
  spinCount.textContent = String(state.spins);
  modelMood.textContent = getMood(state.tokens);
  resultText.textContent = state.lastMessage;
  muteButton.textContent = state.muted ? "Sound Off" : "Sound On";

  reels.forEach((reel, index) => {
    reel.textContent = state.lastSpin[index];
    reel.classList.toggle("win", false);
  });

  historyList.innerHTML = "";
  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    historyList.append(item);
  });

  spinButton.disabled = state.tokens < SPIN_COST;
}

function getMood(tokens) {
  if (tokens >= 320) return "dangerously bullish";
  if (tokens >= 200) return "prompt drunk";
  if (tokens >= 100) return "skeptical";
  if (tokens >= SPIN_COST) return "rate limited";
  return "delisted";
}

function weightedPick() {
  const totalWeight = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const symbol of SYMBOLS) {
    cursor -= symbol.weight;
    if (cursor <= 0) return symbol.label;
  }

  return SYMBOLS[0].label;
}

async function spin() {
  if (state.tokens < SPIN_COST) {
    state.lastMessage = "Wallet empty. The API politely suggests upgrading to Enterprise.";
    addHistory(state.lastMessage);
    rumble([80, 30, 80]);
    render();
    saveState();
    return;
  }

  spinButton.disabled = true;
  machineFrame.classList.remove("burst");
  state.tokens -= SPIN_COST;
  state.spent += SPIN_COST;
  state.spins += 1;
  state.lastMessage = "Burning 25 tokens to ask the machine for vibes...";
  render();
  saveState();

  ensureAudioContext();
  animateLever();
  playTone(220, 0.08, "triangle", 0.02);

  const finalSpin = [weightedPick(), weightedPick(), weightedPick()];
  const revealed = await Promise.all(
    reels.map((reel, index) => animateReel(reel, finalSpin[index], 600 + index * 240))
  );

  state.lastSpin = revealed;
  const outcome = evaluateSpin(revealed);
  state.tokens += outcome.payout;
  state.streak = outcome.payout > 0 ? state.streak + 1 : 0;
  state.jackpots += outcome.jackpot ? 1 : 0;
  state.lastMessage = outcome.message;

  addHistory(`${revealed.join(" / ")} -> ${outcome.message}`);
  render();
  highlightWin(revealed, outcome.payout);
  celebrateOutcome(outcome);
  saveState();
}

function evaluateSpin(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const uniqueSymbols = Object.keys(counts);
  const [a] = uniqueSymbols;

  if (uniqueSymbols.length === 1) {
    const symbol = a;
    if (symbol === "GPU") {
      return {
        payout: 300,
        jackpot: true,
        message: "GPU jackpot. A venture capitalist accidentally prepaid your inference bill.",
      };
    }

    if (symbol === "TOKEN") {
      return {
        payout: 120,
        jackpot: true,
        message: "Triple TOKEN. The machine rewarded you with the very thing it keeps charging for.",
      };
    }

    if (symbol === "AGENT") {
      return {
        payout: 140,
        jackpot: true,
        message: "Triple AGENT. Congratulations, your chores have been recursively delegated.",
      };
    }

    if (symbol === "PROMPT") {
      return {
        payout: 90,
        jackpot: false,
        message: "Triple PROMPT. Somehow wording alone fixed the product roadmap.",
      };
    }

    return {
      payout: 70,
      jackpot: false,
      message: `Triple ${symbol}. Respectable output, light on citations, heavy on confidence.`,
    };
  }

  const pair = uniqueSymbols.find((symbol) => counts[symbol] === 2);
  if (pair) {
    if (pair === "HALLU") {
      return {
        payout: 0,
        jackpot: false,
        message: "Double HALLU. The machine cited a paper that lives only in its heart.",
      };
    }

    return {
      payout: 35,
      jackpot: false,
      message: `Pair of ${pair}. You won just enough tokens to keep making bad decisions.`,
    };
  }

  if (result.includes("HALLU")) {
    return {
      payout: 0,
      jackpot: false,
      message: "Hallucination tax collected. The answer looked polished and meant nothing.",
    };
  }

  if (result.includes("404")) {
    return {
      payout: 10,
      jackpot: false,
      message: "One 404 escaped. A broken demo link still impressed somebody on LinkedIn.",
    };
  }

  return {
    payout: 15,
    jackpot: false,
    message: "No line hit, but the machine found fifteen tokens in an abandoned startup pitch deck.",
  };
}

function addHistory(message) {
  state.history.unshift(message);
  state.history = state.history.slice(0, HISTORY_LIMIT);
}

function ensureAudioContext() {
  if (state.muted) return;
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) {
      audioContext = new Context();
    }
  }

  if (audioContext?.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

function playTone(frequency, duration, type = "sine", gainValue = 0.03) {
  if (state.muted || !audioContext) return;

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function rumble(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function animateLever() {
  leverKnob.animate(
    [
      { transform: "translateY(0px)" },
      { transform: "translateY(60px)" },
      { transform: "translateY(0px)" },
    ],
    { duration: 520, easing: "cubic-bezier(.33,1,.68,1)" }
  );
}

function animateReel(reel, finalSymbol, duration) {
  reel.classList.add("spinning");
  const start = performance.now();

  return new Promise((resolve) => {
    let lastSwap = 0;

    function frame(now) {
      if (now - lastSwap > 70) {
        reel.textContent = weightedPick();
        lastSwap = now;
        reel.animate(
          [
            { transform: "translateY(-12px) scale(0.96)", opacity: 0.3, filter: "blur(6px)" },
            { transform: "translateY(12px) scale(1.04)", opacity: 1, filter: "blur(0px)" },
          ],
          { duration: 110, easing: "ease-out" }
        );
        playTone(300 + Math.random() * 120, 0.05, "square", 0.01);
      }

      if (now - start >= duration) {
        reel.classList.remove("spinning");
        reel.textContent = finalSymbol;
        reel.animate(
          [
            { transform: "translateY(-8px) scale(0.98)" },
            { transform: "translateY(0px) scale(1)" },
          ],
          { duration: 160, easing: "ease-out" }
        );
        resolve(finalSymbol);
        return;
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
}

function highlightWin(result, payout) {
  if (payout <= 0) return;
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  reels.forEach((reel) => {
    if (counts[reel.textContent] >= 2) {
      reel.classList.add("win");
    }
  });

  machineFrame.classList.add("burst");
}

function celebrateOutcome(outcome) {
  if (outcome.jackpot) {
    playTone(520, 0.18, "triangle", 0.04);
    playTone(660, 0.22, "triangle", 0.03);
    playTone(880, 0.28, "triangle", 0.03);
    rumble([100, 40, 100, 40, 160]);
    speak("Jackpot. Tokens recovered from the artificial intelligence economy.");
    return;
  }

  if (outcome.payout > 0) {
    playTone(480, 0.12, "sine", 0.02);
    playTone(620, 0.16, "sine", 0.02);
    rumble([30, 20, 30]);
    return;
  }

  playTone(170, 0.2, "sawtooth", 0.02);
  rumble([120]);
}

function speak(text) {
  if (state.muted || !("speechSynthesis" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.03;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
}

function resetGame() {
  state = baseState();
  saveState();
  render();
  playTone(440, 0.1, "sine", 0.02);
}

function toggleMute() {
  state.muted = !state.muted;
  saveState();
  render();

  if (!state.muted) {
    ensureAudioContext();
    playTone(540, 0.08, "triangle", 0.02);
  } else if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

async function shareResult() {
  const summary = `I have ${state.tokens} tokens left in Token Tugger 3000 after ${state.spins} spins. Last result: ${state.lastSpin.join(" / ")}.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Token Tugger 3000",
        text: summary,
      });
      state.lastMessage = "Brag transmitted. Your followers are pretending to understand the joke.";
      addHistory(state.lastMessage);
      render();
      saveState();
      return;
    } catch {
      // Sharing can be cancelled without needing to surface an error.
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(summary);
      state.lastMessage = "Share line copied. Paste it somewhere full of AI founders.";
      addHistory(state.lastMessage);
      render();
      saveState();
      return;
    } catch {
      // Ignore clipboard failures and fall through to the plain message.
    }
  }

  state.lastMessage = "Sharing unavailable. You can still brag manually like it's 2009.";
  addHistory(state.lastMessage);
  render();
  saveState();
}
