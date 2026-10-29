import { createElement, createLink } from "./dom.js";
import { Deck } from "./deck.js";
import { Rapid } from "./rapid.js";

const ROUND_SIZE = 10;
const LIVES = 3;
const SECONDS_PER_CARD = 12;
const STORAGE_KEY = "rapid-best";

const RATINGS = [
  { minimum: 0.9, message: "Phish-proof. Very little gets past you." },
  { minimum: 0.7, message: "Sharp eyes. A few more rounds and you will be unstoppable." },
  { minimum: 0, message: "Keep practising. Revisit the modules, then try again." },
];

const RULES = [
  "\u2190 or P: Phish",
  "\u2192 or L: Legit",
  "Streaks earn bonus points",
];

function readBest() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(score) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    return;
  }
}

const buildButton = (text, className) =>
  createElement("button", { className, text, attributes: { type: "button" } });

const getRating = (ratio) => RATINGS.find(({ minimum }) => ratio >= minimum).message;

function getHeadline(isCorrect, verdict, points) {
  if (isCorrect) {
    return `Correct! +${points}.`;
  }

  return verdict ? "Not quite." : "Time is up.";
}

function buildCard({ channel, from, text, detail }) {
  return createElement(
    "article",
    { className: "rapid__card" },
    [
      createElement("div", { className: "rapid__meta" }, [
        createElement("span", { className: "badge badge--activity", text: channel }),
        createElement("span", { className: "rapid__from", text: from }),
      ]),
      createElement("p", { className: "rapid__text", text }),
      detail ? createElement("p", { className: "rapid__detail", text: detail }) : null,
    ].filter(Boolean)
  );
}

function dealRound(deck) {
  const cards = new Set();

  while (cards.size < ROUND_SIZE) {
    cards.add(deck.draw());
  }

  return new Rapid([...cards], LIVES);
}

export function mountRapid(root, pool) {
  const deck = new Deck(pool);
  let timer = 0;
  let keyActions = {};
  let hasBeenShown = false;

  const stopTimer = () => {
    clearInterval(timer);
    timer = 0;
  };

  const show = (...nodes) => root.replaceChildren(...nodes);

  const onKeyDown = (event) => {
    if (!root.isConnected) {
      if (hasBeenShown) {
        stopTimer();
        document.removeEventListener("keydown", onKeyDown);
      }

      return;
    }

    hasBeenShown = true;

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const action = keyActions[event.key.toLowerCase()];

    if (action) {
      event.preventDefault();
      action();
    }
  };

  const showResults = (game) => {
    const previousBest = readBest();
    const best = Math.max(previousBest, game.score);
    const accuracy = game.answered ? game.correct / game.answered : 0;
    const survived = game.lives > 0;
    const playAgain = buildButton("Play again", "button");

    writeBest(best);
    keyActions = {};
    playAgain.addEventListener("click", startRound);

    const stat = (label, value) =>
      createElement("li", {}, [
        createElement("strong", { text: value }),
        createElement("span", { text: label }),
      ]);

    show(
      createElement("section", { className: "gate" }, [
        createElement("h2", {
          className: "gate__title",
          text: survived ? "Round complete" : "Out of lives",
        }),
        createElement("p", { className: "quiz__score", text: String(game.score) }),
        game.score > previousBest
          ? createElement("p", { className: "gate__step gate__step--done", text: "New best score!" })
          : null,
        createElement("ul", { className: "rapid__stats" }, [
          stat("Accuracy", `${Math.round(accuracy * 100)}%`),
          stat("Best streak", String(game.bestStreak)),
          stat("Best score", String(best)),
        ]),
        createElement("p", { className: "gate__text", text: getRating(accuracy) }),
        createElement("div", { className: "quiz__actions" }, [
          playAgain,
          createLink("Back to modules", "#/", "button button--ghost"),
        ]),
      ].filter(Boolean))
    );
  };

  const showCard = (game) => {
    const card = game.current;
    let secondsLeft = SECONDS_PER_CARD;

    const hearts = createElement("span", { className: "rapid__hearts", attributes: { role: "img" } });
    const score = createElement("span");
    const streak = createElement("span");
    const seconds = createElement("span", { className: "rapid__seconds", text: `${secondsLeft}s` });
    const bar = createElement("div", { className: "rapid__bar" });
    const face = buildCard(card);
    const phishButton = buildButton("\u2190 Phish", "rapid__choice rapid__choice--phish");
    const legitButton = buildButton("Legit \u2192", "rapid__choice rapid__choice--legit");
    const next = buildButton("Next card", "button");

    const reveal = createElement("div", {
      className: "rapid__reveal",
      attributes: { role: "status", hidden: "" },
    });

    next.hidden = true;
    bar.style.animationDuration = `${SECONDS_PER_CARD}s`;

    const refreshHud = () => {
      hearts.textContent = "\u2665".repeat(game.lives) + "\u2661".repeat(LIVES - game.lives);
      hearts.setAttribute("aria-label", `${game.lives} lives left`);
      score.textContent = `Score ${game.score}`;
      streak.textContent = `Streak ${game.streak}`;
    };

    const resolve = (verdict) => {
      stopTimer();
      keyActions = {};
      phishButton.disabled = true;
      legitButton.disabled = true;

      const { isCorrect, points } = game.answer(verdict);
      const outcome = card.isPhish ? "phish" : "legit";

      if (verdict) {
        face.classList.add(`rapid__card--picked-${verdict}`);
      }

      face.classList.add(isCorrect ? "rapid__card--right" : "rapid__card--wrong");
      face.append(
        createElement("span", {
          className: `rapid__stamp rapid__stamp--${outcome}`,
          text: card.isPhish ? "Phish" : "Legit",
        })
      );

      reveal.className = `rapid__reveal rapid__reveal--${isCorrect ? "right" : "wrong"}`;
      reveal.textContent = `${getHeadline(isCorrect, verdict, points)} ${card.why}`;
      reveal.hidden = false;

      next.textContent =
        game.lives === 0 || game.position === game.total ? "See results" : "Next card";
      next.hidden = false;
      next.focus();
      refreshHud();
    };

    phishButton.addEventListener("click", () => resolve("phish"));
    legitButton.addEventListener("click", () => resolve("legit"));

    next.addEventListener("click", () => {
      game.advance();

      if (game.isOver) {
        showResults(game);
        return;
      }

      showCard(game);
    });

    keyActions = {
      arrowleft: () => resolve("phish"),
      p: () => resolve("phish"),
      arrowright: () => resolve("legit"),
      l: () => resolve("legit"),
    };

    timer = setInterval(() => {
      if (!root.isConnected) {
        stopTimer();
        return;
      }

      secondsLeft -= 1;
      seconds.textContent = `${secondsLeft}s`;

      if (secondsLeft <= 0) {
        resolve(null);
      }
    }, 1000);

    refreshHud();

    show(
      createElement("div", { className: "rapid__hud" }, [
        hearts,
        createElement("span", { text: `Card ${game.position} of ${game.total}` }),
        score,
        streak,
        seconds,
      ]),
      createElement("div", { className: "rapid__timer", attributes: { "aria-hidden": "true" } }, [bar]),
      face,
      createElement("div", { className: "rapid__choices" }, [phishButton, legitButton]),
      reveal,
      next
    );
  };

  function startRound() {
    showCard(dealRound(deck));
  }

  const showIntro = () => {
    const start = buildButton("Start the round", "button");

    start.addEventListener("click", startRound);

    show(
      createElement("section", { className: "gate" }, [
        createElement("h2", { className: "gate__title", text: "Phish or legit?" }),
        createElement("p", {
          className: "gate__text",
          text: `${ROUND_SIZE} messages, ${LIVES} lives and ${SECONDS_PER_CARD} seconds each. Decide fast, but think. Some are genuine.`,
        }),
        createElement(
          "ul",
          { className: "gate__steps" },
          RULES.map((rule) => createElement("li", { className: "gate__step", text: rule }))
        ),
        createElement("p", { className: "gate__text", text: `Best score: ${readBest()}` }),
        start,
      ])
    );
  };

  document.addEventListener("keydown", onKeyDown);
  showIntro();
}