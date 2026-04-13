const symbols = [
  {
    icon: "AGI",
    weight: 1,
    line: "The machine predicted AGI by Friday and accidentally paid out.",
  },
  {
    icon: "GPU",
    weight: 2,
    line: "A datacenter investor nodded solemnly. Tokens materialized.",
  },
  {
    icon: "SEED",
    weight: 3,
    line: "A startup raised on vibes, decks, and one suspicious benchmark.",
  },
  {
    icon: "404",
    weight: 4,
    line: "The model could not find the answer, but it found confidence.",
  },
  {
    icon: "HALL",
    weight: 3,
    line: "Hallucination core engaged. The citations look premium though.",
  },
  {
    icon: "BOT",
    weight: 2,
    line: "A bot liked another bot's post about autonomous revenue.",
  },
];

const reels = [...document.querySelectorAll(".reel")];
const balanceEl = document.querySelector("#token-balance");
const betRange = document.querySelector("#bet-range");
const betValue = document.querySelector("#bet-value");
const spinButton = document.querySelector("#spin-button");
const resultLine = document.querySelector("#result-line");
const subLine = document.querySelector("#sub-line");
const streakLabel = document.querySelector("#streak-label");

let balance = 120;
let streak = 0;
let spinning = false;

const weightedPool = symbols.flatMap((symbol) =>
  Array.from({ length: symbol.weight }, () => symbol)
);

const clampBet = () => {
  if (balance < 5) {
    betRange.value = 5;
    betRange.disabled = true;
    spinButton.disabled = true;
    return;
  }

  const maxAffordable = Math.max(5, Math.min(25, Math.floor(balance / 5) * 5));

  betRange.disabled = false;
  spinButton.disabled = spinning;
  betRange.max = maxAffordable;

  if (Number(betRange.value) > maxAffordable) {
    betRange.value = String(maxAffordable);
  }
};

const updateHud = () => {
  balanceEl.textContent = String(balance);
  betValue.textContent = betRange.value;
  streakLabel.textContent = `Streak: ${streak}`;
  clampBet();
};

const pickSymbol = () =>
  weightedPool[Math.floor(Math.random() * weightedPool.length)];

const setStatus = (headline, detail, tone) => {
  resultLine.textContent = headline;
  subLine.textContent = detail;
  const panel = document.querySelector(".result-panel");
  panel.classList.remove("win-flash", "loss-flash");
  if (tone) {
    panel.classList.add(tone);
  }
};

const evaluateSpin = (rolled, bet) => {
  const icons = rolled.map((symbol) => symbol.icon);
  const counts = icons.reduce((acc, icon) => {
    acc[icon] = (acc[icon] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topIcon, topCount] = entries[0];

  if (topCount === 3) {
    const multipliers = { AGI: 5, GPU: 4, SEED: 3, 404: 2 };
    const multiplier = multipliers[topIcon] || 2.5;
    return {
      payout: Math.round(bet * multiplier),
      message: `Jackpot: ${topIcon} x3`,
      detail: rolled[0].line,
      win: true,
    };
  }

  if (topCount === 2) {
    return {
      payout: Math.round(bet * 1.5),
      message: `Two ${topIcon}s. The demo almost convinced procurement.`,
      detail: "Partial alignment achieved. A consultant called it product-market fit.",
      win: true,
    };
  }

  return {
    payout: 0,
    message: "No match. The tokens were consumed by inference overhead.",
    detail: "Your prompt was beautiful, but the unit economics were not.",
    win: false,
  };
};

const animateReels = async () => {
  const finalRoll = reels.map(() => pickSymbol());

  for (let step = 0; step < 12; step += 1) {
    await new Promise((resolve) => {
      setTimeout(() => {
        reels.forEach((reel) => {
          const temp = pickSymbol();
          reel.textContent = temp.icon;
        });
        resolve();
      }, 80 + step * 8);
    });
  }

  reels.forEach((reel, index) => {
    reel.textContent = finalRoll[index].icon;
  });

  return finalRoll;
};

const spin = async () => {
  if (spinning || balance < 5) {
    return;
  }

  const bet = Number(betRange.value);
  if (bet > balance) {
    setStatus(
      "Budget denied.",
      "Even satire needs enough tokens to rent a GPU for the intro animation.",
      "loss-flash"
    );
    return;
  }

  spinning = true;
  balance -= bet;
  updateHud();

  setStatus(
    "Spinning...",
    "Querying the oracle, three VCs, and one very confident benchmark chart.",
    null
  );

  reels.forEach((reel) => reel.classList.add("spinning"));
  spinButton.disabled = true;

  const rolled = await animateReels();
  const outcome = evaluateSpin(rolled, bet);

  balance += outcome.payout;
  streak = outcome.win ? streak + 1 : 0;

  setStatus(
    `${outcome.message} ${outcome.win ? `+${outcome.payout} tokens.` : ""}`.trim(),
    outcome.detail,
    outcome.win ? "win-flash" : "loss-flash"
  );

  reels.forEach((reel) => reel.classList.remove("spinning"));
  spinning = false;

  if (balance < 5) {
    setStatus(
      "Out of tokens.",
      "The machine suggests pivoting to enterprise pricing and trying again later.",
      "loss-flash"
    );
  }

  updateHud();
};

betRange.addEventListener("input", () => {
  betValue.textContent = betRange.value;
});

spinButton.addEventListener("click", spin);

updateHud();
