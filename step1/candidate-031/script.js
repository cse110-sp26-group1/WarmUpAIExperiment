const symbols = ["🤖", "🧠", "🔥", "🪙", "🧾", "📉", "⚡", "🧍"];
const spinCost = 15;
const starterTokens = 250;
const storageKey = "prompt-casino-wallet";

const tokenEl = document.getElementById("tokens");
const costEl = document.getElementById("spin-cost");
const streakEl = document.getElementById("streak");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spin-btn");
const resetBtn = document.getElementById("reset-btn");
const reels = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3")
];

const state = {
  tokens: Number(localStorage.getItem(storageKey)) || starterTokens,
  streak: 0,
  spinning: false
};

costEl.textContent = spinCost;
render();

spinBtn.addEventListener("click", spin);
resetBtn.addEventListener("click", () => {
  state.tokens = starterTokens;
  state.streak = 0;
  localStorage.setItem(storageKey, String(state.tokens));
  setMessage("Wallet reset. Your VC round has been renewed.", "win");
  render();
});

function render() {
  tokenEl.textContent = state.tokens;
  streakEl.textContent = state.streak;
  spinBtn.disabled = state.spinning || state.tokens < spinCost;
  spinBtn.textContent = state.tokens >= spinCost ? `Spin for ${spinCost} Tokens` : "Out of Tokens";
}

async function spin() {
  if (state.spinning || state.tokens < spinCost) {
    return;
  }

  state.spinning = true;
  state.tokens -= spinCost;
  localStorage.setItem(storageKey, String(state.tokens));
  render();

  setMessage("Querying the oracle... billing by the millisecond.");
  reels.forEach((reel) => reel.classList.add("spin"));

  let final = [];
  for (let i = 0; i < reels.length; i += 1) {
    await wait(260 + i * 140);
    final[i] = symbols[Math.floor(Math.random() * symbols.length)];
    reels[i].textContent = final[i];
    chirp(220 + i * 70, 0.05);
    reels[i].classList.remove("spin");
  }

  const winnings = payout(final);
  state.tokens += winnings;
  localStorage.setItem(storageKey, String(state.tokens));

  if (winnings > 0) {
    state.streak += 1;
    celebrate();
  } else {
    state.streak = 0;
  }

  narrate(final, winnings);
  state.spinning = false;
  render();
}

function payout([a, b, c]) {
  if (a === "🤖" && b === "🤖" && c === "🤖") return 120;
  if (a === "🔥" && b === "🔥" && c === "🔥") return 80;
  if (a === b && b === c) return 60;
  if (a === b || b === c || a === c) return 20;
  return 0;
}

function narrate(result, winnings) {
  const [a, b, c] = result;
  if (winnings <= 0) {
    setMessage(`${a}${b}${c}: No match. Your prompt needed "more context."`, "lose");
    return;
  }

  const burns = [
    "The board calls this product-market fit.",
    "Congrats, you've monetized autocomplete.",
    "Analysts confirm: vibes are up.",
    "Somewhere, a GPU fan just screamed."
  ];

  const burn = burns[Math.floor(Math.random() * burns.length)];
  setMessage(`${a}${b}${c}: +${winnings} tokens. ${burn}`, "win");
}

function setMessage(text, mood = "") {
  messageEl.textContent = text;
  messageEl.classList.remove("win", "lose");
  if (mood) messageEl.classList.add(mood);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function celebrate() {
  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  chirp(660, 0.08);
  chirp(880, 0.12);
}

function chirp(freq, durationSeconds) {
  const audioCtx = window.__casinoAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
  window.__casinoAudioCtx = audioCtx;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = freq;

  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSeconds);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + durationSeconds);
}