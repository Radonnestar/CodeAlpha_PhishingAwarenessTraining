import { api } from "./api.js";
import { createElement, createLink } from "./dom.js";
import { createTeacher } from "./teacher.js";
import { createScene } from "./scene.js";
import { mountTilt } from "./tilt.js";

const RAPID_UNLOCK_MODULE_ID = "fake-websites";

const STATUS_LABELS = {
  locked: "Locked",
  available: "Ready",
  in_progress: "In progress",
  completed: "Completed",
};

const ACTION_LABELS = {
  available: "Start module",
  in_progress: "Continue",
  completed: "Review module",
};

function buildGreeting(completed, total, finalPassed) {
  if (finalPassed) {
    return {
      mood: "celebrating",
      say: "You passed the final exam and finished the whole course. Outstanding work!",
    };
  }

  if (completed === total) {
    return {
      mood: "celebrating",
      say: "Every module is complete. The final exam is open. Show what you know!",
    };
  }

  if (completed === 0) {
    return {
      mood: "explaining",
      say: "Welcome! Each module ends with a short quiz. Pass it with 80% to unlock the next one. Start with module 1.",
    };
  }

  return {
    mood: "happy",
    say: `${completed} of ${total} modules done. Keep going, the next one is waiting for you.`,
  };
}

function pickJourney(modules, completed, finalExam) {
  const target = modules.find(({ status }) => status === "available" || status === "in_progress");

  if (target) {
    return {
      href: `#/module/${target.id}`,
      label: completed === 0 ? "Begin your journey" : "Continue your journey",
    };
  }

  return finalExam.passed
    ? { href: "#/hunt", label: "Play Spot the phish" }
    : { href: "#/final-exam", label: "Take the final exam" };
}

function buildModuleCard(module, number) {
  const isLocked = module.status === "locked";

  const action = isLocked
    ? createElement("p", { className: "module-card__meta", text: "Pass the previous quiz to unlock." })
    : createLink(ACTION_LABELS[module.status], `#/module/${module.id}`, "button");

  const meta =
    module.attempts > 0
      ? createElement("p", {
          className: "module-card__meta",
          text: `Best score: ${module.best_percent}% · Quiz attempts: ${module.attempts}`,
        })
      : null;

  return createElement(
    "article",
    { className: `module-card${isLocked ? " module-card--locked" : ""}` },
    [
      createElement("div", { className: "module-card__head" }, [
        createElement("span", { className: "module-card__number", text: String(number) }),
        createElement("span", {
          className: `badge badge--${module.status}`,
          text: STATUS_LABELS[module.status],
        }),
      ]),
      createElement("h3", { text: module.title }),
      createElement("p", { text: module.summary }),
      meta,
      createElement("div", { className: "module-card__action" }, [action]),
    ].filter(Boolean)
  );
}

function buildSpecialCard({ tag, title, text, status, actionLabel, href, lockedText }) {
  const isLocked = status === "locked";

  const action = isLocked
    ? createElement("p", { className: "module-card__meta", text: lockedText })
    : createLink(actionLabel, href, "button");

  return createElement(
    "article",
    { className: `module-card${isLocked ? " module-card--locked" : ""}` },
    [
      createElement("div", { className: "module-card__head" }, [
        createElement("span", { className: "badge badge--activity", text: tag }),
        createElement("span", {
          className: `badge badge--${status}`,
          text: STATUS_LABELS[status],
        }),
      ]),
      createElement("h3", { text: title }),
      createElement("p", { text }),
      createElement("div", { className: "module-card__action" }, [action]),
    ]
  );
}

function getFinalExamStatus({ unlocked, passed }) {
  if (passed) {
    return "completed";
  }

  return unlocked ? "available" : "locked";
}

export async function renderModuleMap() {
  const summary = await api.progress();
  const total = summary.modules.length;
  const completed = summary.modules.filter(({ status }) => status === "completed").length;
  const greeting = buildGreeting(completed, total, summary.final_exam.passed);
  const journey = pickJourney(summary.modules, completed, summary.final_exam);
  const rapidUnlocked =
    summary.modules.find(({ id }) => id === RAPID_UNLOCK_MODULE_ID)?.status === "completed";
  const teacher = createTeacher();

  teacher.setMood(greeting.mood);
  teacher.say(greeting.say);
  teacher.onTap(() =>
    teacher.say(`Pass mark is ${summary.pass_percent}%. You can retake a quiz as often as you like.`)
  );

  const fill = createElement("div", { className: "progress__fill" });
  fill.style.width = `${(completed / total) * 100}%`;

  const resetButton = createElement("button", {
    className: "button button--ghost",
    text: "Reset my progress",
    attributes: { type: "button" },
  });

  resetButton.addEventListener("click", async () => {
    if (!window.confirm("Reset all progress? This cannot be undone.")) {
      return;
    }

    try {
      await api.reset();
      location.reload();
    } catch (error) {
      teacher.setMood("worried");
      teacher.say(error.message);
    }
  });

  const cards = [
    ...summary.modules.map((module, index) => buildModuleCard(module, index + 1)),
    buildSpecialCard({
      tag: "Activity",
      title: "Spot the phish",
      text: "Click the red flags in a fake email. A different email is dealt every round.",
      status: summary.hunt_unlocked ? "available" : "locked",
      actionLabel: "Play now",
      href: "#/hunt",
      lockedText: "Unlocks after you pass the Red flags in emails quiz.",
    }),
    buildSpecialCard({
      tag: "Activity",
      title: "Phish or legit?",
      text: "A timed speed round. Decide whether each message is a scam or genuine before the clock runs out.",
      status: rapidUnlocked ? "available" : "locked",
      actionLabel: "Play now",
      href: "#/rapid",
      lockedText: "Unlocks after you pass the Fake websites and malicious links quiz.",
    }),
    buildSpecialCard({
      tag: "Final exam",
      title: "Final exam",
      text: "Ten questions drawn from every module. Pass it to complete the course.",
      status: getFinalExamStatus(summary.final_exam),
      actionLabel: summary.final_exam.passed ? "Retake the exam" : "Take the exam",
      href: "#/final-exam",
      lockedText: "Unlocks after you pass all six modules.",
    }),
  ];

  cards.forEach((card, index) => {
    card.style.setProperty("--i", String(index));

    if (!card.classList.contains("module-card--locked")) {
      mountTilt(card);
    }
  });

  const scene = createScene({
    href: journey.href,
    ctaLabel: journey.label,
    completed,
    total,
  });

  return createElement("section", {}, [
    scene,
    createElement("h2", { className: "section-title", text: "Your learning path" }),
    createElement("p", {
      className: "lead",
      text: "Learn each module, then prove it in the quiz. Passing unlocks the next module.",
    }),
    createElement("div", { className: "layout" }, [
      teacher.element,
      createElement("div", { className: "map" }, [
        createElement("div", { className: "summary" }, [
          createElement("p", { text: `${completed} of ${total} modules completed` }),
          createElement("div", { className: "progress", attributes: { "aria-hidden": "true" } }, [fill]),
        ]),
        createElement("div", { className: "module-grid" }, cards),
        createElement("div", { className: "map__footer" }, [resetButton]),
      ]),
    ]),
  ]);
}