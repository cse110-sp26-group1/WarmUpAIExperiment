const symbols = [
  {
    icon: "GPU",
    weight: 4,
    payout: 90,
    lines: [
      "Three GPUs. Somewhere, a founder just called this recurring revenue.",
      "The cluster is yours until the invoice arrives."
    ]
  },
  {
    icon: "Prompt",
    weight: 5,
    payout: 70,
    lines: [
      "Triple prompts. You monetized asking politely.",
      "The model nodded confidently and billed by the token."
    ]
  },
  {
    icon: "Token",
    weight: 5,
    payout: 65,
    lines: [
      "Triple tokens. The economy is fictional but the vibes are real.",
      "Value has been extracted from absolutely nowhere."
    ]
  },
  {
    icon: "Hallucination",
    weight: 7,
    payout: 0,
    lines: [
      "The machine fabricated a roadmap with perfect confidence.",
      "A citation was generated, but only emotionally."
    ]
  },
  {
    icon: "Pivot",
    weight: 6,
    payout: 0,
    lines: [
      "Pivot. Your app is now AI for other AI apps.",
      "A strategy consultant just called this inevitable."
    ]
  },
  {
    icon: "404",
    weight: 6,
    payout: 0,
    lines: [
      "404. The benchmark disappeared during due diligence.",
      "The model was amazing in the demo and nowhere else."
    ]
  },
  {
    icon: "VC",
    weight: 4,
    payout: 0,
    lines: [
      "VC. Someone offered you exposure instead of compute.",
      "The term sheet contains the word 'agentic' seventeen times."
    ]
  }
];

const state = {
  balance: 120,
  spinCost: 15,
  spinning: false,
  soundOn: true
};

const refs = {
  balance: document.getElementById("tokenBalance"),
  spinCost: document.getElementById("spinCost"),
  spinButton: document.getElementById("spinButton"),
  demoButton: document.getElementById("demoButton"),
  soundToggle: document.getElementById("soundToggle"),
  roundMessage: document.getElementById("roundMessage"),
  narration: document.getElementById("narration"),
  reels: [...document.querySelectorAll(".reel")],
  toastTemplate: document.getElementById("toastTemplate")
};

function weightedPick() {
  const pool = symbols.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol));
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomLine(symbol) {
  return symbol.lines[Math.floor(Math.random() * symbol.lines.length)];
}

function updateUI() {
  refs.balance.textContent = String(state.balance);
  refs.spinCost.textContent = String(state.spinCost);
  refs.spinButton.disabled = state.spinning || state.balance < state.spinCost;
}

function speak(text) {
  if (!("speechSynthesis" in window) || !state.soundOn) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.pitch = 1.05;
  utterance.volume = 0.7;
  window.speechSynthesis.speak(utterance);
}

function beep(frequency, duration, type = "square") {
  if (!state.soundOn || !("AudioContext" in window || "webkitAudioContext" in window)) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = beep.ctx || new AudioCtx();
  beep.ctx = ctx;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.03;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();

  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
  oscillator.stop(ctx.currentTime + duration / 1000);
}

function toast(message) {
  const node = refs.toastTemplate.content.firstElementChild.cloneNode(true);
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2900);
}

function evaluate(result) {
  const icons = result.map((item) => item.icon);
  const counts = icons.reduce((acc, icon) => {
    acc[icon] = (acc[icon] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topIcon, topCount] = entries[0];

  if (topCount === 3) {
    const symbol = symbols.find((item) => item.icon === topIcon);
    return {
      delta: symbol.payout,
      message: `Jackpot: ${topIcon} x3`,
      narration: randomLine(symbol),
      winIndices: [0, 1, 2]
    };
  }

  if (topCount === 2) {
    return {
      delta: 25,
      message: `Pair bonus: ${topIcon} x2`,
      narration: "You achieved product-market-ish fit. Two reels agree, which counts as validation now.",
      winIndices: icons.map((icon, index) => (icon === topIcon ? index : -1)).filter((index) => index >= 0)
    };
  }

  return {
    delta: 0,
    message: "No match",
    narration: "All tokens consumed by inference, latency, and a keynote with too many gradients.",
    winIndices: []
  };
}

function flashTitle(text) {
  const original = document.title;
  document.title = text;
  setTimeout(() => {
    document.title = original;
  }, 1400);
}

function celebrate(win) {
  if (navigator.vibrate) {
    navigator.vibrate(win ? [100, 50, 100, 50, 180] : [120]);
  }

  if (win) {
    beep(740, 120);
    setTimeout(() => beep(920, 160, "triangle"), 140);
  } else {
    beep(210, 180, "sawtooth");
  }
}

function setMessage(message, narration) {
  refs.roundMessage.textContent = message;
  refs.narration.textContent = narration;
}

function resetWinState() {
  refs.reels.forEach((reel) => reel.classList.remove("win"));
}

async function spin() {
  if (state.spinning || state.balance < state.spinCost) {
    if (state.balance < state.spinCost) {
      toast("Out of tokens. Begging VCs is currently your strongest feature.");
    }
    return;
  }

  state.spinning = true;
  const spinPrice = state.spinCost;
  state.balance -= spinPrice;
  state.spinCost = Math.min(state.spinCost + 1, 30);
  resetWinState();
  updateUI();
  setMessage("Spinning...", "Buying one more shot of synthetic optimism.");

  const result = refs.reels.map(() => weightedPick());

  refs.reels.forEach((reel, index) => {
    reel.classList.add("spinning");

    const interval = setInterval(() => {
      reel.textContent = weightedPick().icon;
    }, 90);

    setTimeout(() => {
      clearInterval(interval);
      reel.textContent = result[index].icon;
      reel.classList.remove("spinning");
      beep(320 + index * 120, 90);
    }, 700 + index * 260);
  });

  await new Promise((resolve) => setTimeout(resolve, 1600));

  const outcome = evaluate(result);
  state.balance += outcome.delta;
  state.spinning = false;
  updateUI();
  setMessage(
    `${outcome.message}. ${
      outcome.delta
        ? `Net ${outcome.delta - spinPrice >= 0 ? "+" : ""}${outcome.delta - spinPrice} delusion-adjusted tokens.`
        : `Net -${spinPrice} tokens.`
    }`,
    outcome.narration
  );

  outcome.winIndices.forEach((index) => refs.reels[index].classList.add("win"));

  const won = outcome.delta > 0;
  celebrate(won);
  flashTitle(won ? "Jackpot of Nonsense" : "Inference Ate Your Budget");
  speak(outcome.message);

  if (won) {
    toast(`Payout received: +${outcome.delta} tokens`);
  } else if (state.balance < state.spinCost) {
    toast("Balance too low for another spin. Time to launch a waitlist.");
  }
}

function addDemoFunds() {
  state.balance += 50;
  updateUI();
  setMessage(
    "A venture capitalist appeared.",
    "They did not understand the product, which made them twice as interested."
  );
  beep(540, 120, "triangle");
  toast("You were handed 50 tokens and a terrifying growth target.");
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  refs.soundToggle.textContent = state.soundOn ? "Sound on" : "Sound off";
  refs.soundToggle.setAttribute("aria-pressed", String(state.soundOn));
  toast(state.soundOn ? "The machine is audible again." : "Muted. The hype is now silent.");
}

refs.spinButton.addEventListener("click", spin);
refs.demoButton.addEventListener("click", addDemoFunds);
refs.soundToggle.addEventListener("click", toggleSound);

updateUI();
