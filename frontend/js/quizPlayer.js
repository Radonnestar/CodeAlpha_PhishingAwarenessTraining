import { api } from "./api.js";
import { createElement, createLink } from "./dom.js";
import { createTeacher } from "./teacher.js";

const KIND_LABELS = {
  scenario: "Real-life scenario",
  concept: "From the lesson",
};

const HINT =
  "Ask yourself three things: who is contacting me, what do they want me to do, and how could I check that independently?";

const CORRECT_LINES = [
  "Well spotted!",
  "Exactly right. Your instincts are sharpening.",
  "That is the careful thinking an attacker hopes you skip.",
];

const WRONG_LINES = [
  "Not this time, and that is fine. Read the explanation, it is the useful part.",
  "Good attempt. Attackers count on exactly this kind of slip, so now you know.",
  "Close, but have a look at why before you move on.",
];

const SKILLS = [
  "Recognise phishing across email, text, phone calls and QR codes",
  "Spot red flags in senders, links and attachments",
  "Read a web address to find out who really owns a site",
  "Respond quickly and correctly if you ever click",
];

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const moduleOutcome =
  (moduleId) =>
  ({ result, progress, retry }) => {
    if (!result.passed) {
      return {
        headline: "Not quite there yet",
        teacherLine: "So close. Review the lesson and try again. You will get a fresh set of questions.",
        actions: [retry, createLink("Review the lesson", `#/module/${moduleId}`, "button button--ghost")],
      };
    }

    const nextId = result.next_module_id;

    return {
      headline: "Module complete",
      teacherLine: nextId
        ? "Excellent! The next module is unlocked."
        : "That was the last module. The final exam is now open!",
      actions: [
        nextId
          ? createLink("Start the next module", `#/module/${nextId}`, "button")
          : createLink("Take the final exam", "#/final-exam", "button"),
        createLink("All modules", "#/", "button button--ghost"),
        progress.hunt_unlocked ? createLink("Play Spot the phish", "#/hunt", "button button--ghost") : null,
      ],
    };
  };

const finalOutcome = ({ result, retry }) => {
  if (!result.passed) {
    return {
      headline: "Not quite there yet",
      teacherLine: "So close. Review the modules and try again. You will get a fresh set of questions.",
      actions: [retry, createLink("Review the modules", "#/", "button button--ghost")],
    };
  }

  return {
    headline: "Training complete",
    teacherLine: "You have finished every module and passed the final exam. Outstanding work!",
    details: [
      createElement("p", { text: "You can now:" }),
      createElement(
        "ul",
        { className: "points" },
        SKILLS.map((skill) => createElement("li", { text: skill }))
      ),
    ],
    actions: [
      createLink("Back to all modules", "#/", "button"),
      createLink("Play Spot the phish", "#/hunt", "button button--ghost"),
    ],
  };
};

async function createQuizSession({ title, backLink, startAttempt, describeOutcome }) {
  const teacher = createTeacher();
  const stage = createElement("div", { className: "quiz-stage" });
  let activeOptions = [];

  const root = createElement("section", {}, [
    backLink,
    createElement("h1", { text: title }),
    createElement("div", { className: "layout" }, [teacher.element, stage]),
  ]);

  const onKeyDown = (event) => {
    if (!root.isConnected) {
      document.removeEventListener("keydown", onKeyDown);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    activeOptions[Number(event.key) - 1]?.click();
  };

  const start = async () => {
    askQuestion(await startAttempt(), 0);
  };

  const showResults = ({ result, progress }) => {
    activeOptions = [];

    const retry = createElement("button", {
      className: "button",
      text: "Try again with new questions",
      attributes: { type: "button" },
    });

    retry.addEventListener("click", async () => {
      retry.disabled = true;

      try {
        await start();
      } catch (error) {
        retry.disabled = false;
        teacher.setMood("worried");
        teacher.say(error.message);
      }
    });

    const { headline, teacherLine, details = [], actions } = describeOutcome({ result, progress, retry });

    teacher.setMood(result.passed ? "celebrating" : "worried");
    teacher.say(teacherLine);
    teacher.onTap(() => teacher.say(`You need ${result.pass_percent}% to pass.`));

    stage.replaceChildren(
      createElement("h2", { className: "quiz__prompt", text: headline }),
      createElement("p", { className: "quiz__score", text: `${result.score} / ${result.total}` }),
      createElement("p", { text: `${result.percent}% scored. Pass mark: ${result.pass_percent}%.` }),
      ...details,
      createElement("div", { className: "quiz__actions" }, actions.filter(Boolean))
    );
  };

  const askQuestion = (attempt, position) => {
    const question = attempt.questions[position];
    const count = attempt.questions.length;
    const isLast = position === count - 1;

    const fill = createElement("div", { className: "progress__fill" });
    fill.style.width = `${(position / count) * 100}%`;

    const feedback = createElement("p", {
      className: "feedback",
      attributes: { role: "status" },
    });

    const nextButton = createElement("button", {
      className: "button",
      text: isLast ? "See results" : "Next question",
      attributes: { type: "button", hidden: "" },
    });

    const buttons = question.options.map((optionText, index) =>
      createElement("button", { className: "option", attributes: { type: "button" } }, [
        createElement("span", { className: "option__key", text: String(index + 1) }),
        createElement("span", { text: optionText }),
      ])
    );

    buttons.forEach((button, choice) => {
      button.addEventListener("click", async () => {
        buttons.forEach((item) => {
          item.disabled = true;
        });

        try {
          const result = await api.answer(attempt.attempt_id, question.id, choice);

          buttons.forEach((item, index) => {
            item.classList.toggle("option--correct", index === result.correct_index);
            item.classList.toggle("option--wrong", index === choice && !result.is_correct);
          });

          fill.style.width = `${((position + 1) / count) * 100}%`;
          feedback.textContent = `${result.is_correct ? "Correct." : "Not quite."} ${result.explanation}`;
          teacher.setMood(result.is_correct ? "happy" : "worried");
          teacher.say(pick(result.is_correct ? CORRECT_LINES : WRONG_LINES));
          nextButton.hidden = false;
          nextButton.focus();
        } catch (error) {
          buttons.forEach((item) => {
            item.disabled = false;
          });
          feedback.textContent = error.message;
        }
      });
    });

    nextButton.addEventListener("click", async () => {
      if (!isLast) {
        askQuestion(attempt, position + 1);
        return;
      }

      nextButton.disabled = true;

      try {
        showResults(await api.finish(attempt.attempt_id));
      } catch (error) {
        nextButton.disabled = false;
        feedback.textContent = error.message;
      }
    });

    activeOptions = buttons;

    teacher.setMood("thinking");
    teacher.say(position === 0 ? "Take your time and read each option carefully." : "Next one. Read it carefully.");
    teacher.onTap(() => teacher.say(HINT));

    stage.replaceChildren(
      createElement("div", { className: "progress", attributes: { "aria-hidden": "true" } }, [fill]),
      createElement("p", { className: "quiz__count", text: `Question ${position + 1} of ${count}` }),
      createElement("p", { className: "quiz__kind", text: KIND_LABELS[question.kind] }),
      createElement("h2", { className: "quiz__prompt", text: question.prompt }),
      createElement("div", { className: "options" }, buttons),
      feedback,
      nextButton
    );
  };

  await start();
  document.addEventListener("keydown", onKeyDown);

  return root;
}

export async function renderQuiz(moduleId) {
  const { module } = await api.module(moduleId);

  if (!module.lesson_completed) {
    location.hash = `#/module/${moduleId}`;
    return createElement("div");
  }

  return createQuizSession({
    title: `${module.title}: quiz`,
    backLink: createLink("Back to the lesson", `#/module/${moduleId}`, "back-link"),
    startAttempt: () => api.startQuiz(moduleId),
    describeOutcome: moduleOutcome(moduleId),
  });
}

export function renderFinalExam() {
  return createQuizSession({
    title: "Final exam",
    backLink: createLink("All modules", "#/", "back-link"),
    startAttempt: () => api.startFinalExam(),
    describeOutcome: finalOutcome,
  });
}