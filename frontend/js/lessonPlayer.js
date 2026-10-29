import { api } from "./api.js";
import { createElement, createLink } from "./dom.js";
import { createTeacher } from "./teacher.js";
import { renderIllustration } from "./illustrations.js";

const buildParagraphs = (lines) => lines.map((line) => createElement("p", { text: line }));

const buildPoints = (points) =>
  createElement(
    "ul",
    { className: "points" },
    points.map(({ label, text }) =>
      createElement("li", {}, [
        createElement("strong", { text: label }),
        createElement("span", { text }),
      ])
    )
  );

const buildExample = ({ title, text }) =>
  createElement("div", { className: "example" }, [
    createElement("strong", { text: title }),
    createElement("p", { text }),
  ]);

const buildTakeaway = (text) =>
  createElement("div", { className: "takeaway" }, [
    createElement("strong", { text: "Key takeaway" }),
    createElement("p", { text }),
  ]);

const buildButton = (text, className) =>
  createElement("button", { className, text, attributes: { type: "button" } });

export async function renderLesson(moduleId) {
  const { module, lesson } = await api.module(moduleId);
  const { screens } = lesson;
  const teacher = createTeacher();

  const fill = createElement("div", { className: "progress__fill" });
  const step = createElement("p", { className: "lesson__step" });
  const stage = createElement("div", { className: "lesson__stage" });
  const backButton = buildButton("Back", "button button--ghost");
  const nextButton = buildButton("Next", "button");

  let index = 0;

  const show = (position, moveFocus) => {
    index = position;

    const screen = screens[index];
    const illustration = screen.illustration
      ? renderIllustration(screen.illustration, screen, { teacher })
      : null;
    const pointsInDiagram = Boolean(illustration?.showsPoints);
    const isLast = index === screens.length - 1;

    const heading = createElement("h2", {
      className: "lesson__heading",
      text: screen.heading,
      attributes: { tabindex: "-1" },
    });

    stage.replaceChildren(
      ...[
        heading,
        illustration?.node,
        ...buildParagraphs(screen.body),
        screen.points && !pointsInDiagram ? buildPoints(screen.points) : null,
        screen.example ? buildExample(screen.example) : null,
        buildTakeaway(screen.key_takeaway),
      ].filter(Boolean)
    );

    fill.style.width = `${((index + 1) / screens.length) * 100}%`;
    step.textContent = `Step ${index + 1} of ${screens.length}`;
    backButton.disabled = index === 0;
    nextButton.textContent = isLast ? "Finish lesson and take the quiz" : "Next";

    teacher.setMood(screen.teacher.mood);
    teacher.say(screen.teacher.say);
    teacher.onTap(() => teacher.say(screen.key_takeaway));

    if (moveFocus) {
      heading.focus();
    }
  };

  backButton.addEventListener("click", () => show(index - 1, true));

  nextButton.addEventListener("click", async () => {
    if (index < screens.length - 1) {
      show(index + 1, true);
      return;
    }

    nextButton.disabled = true;

    try {
      await api.completeLesson(moduleId);
      location.hash = `#/module/${moduleId}/quiz`;
    } catch (error) {
      nextButton.disabled = false;
      teacher.setMood("worried");
      teacher.say(error.message);
    }
  });

  show(0, false);

  return createElement("section", {}, [
    createLink("All modules", "#/", "back-link"),
    createElement("h1", { text: module.title }),
    createElement("div", { className: "layout" }, [
      teacher.element,
      createElement("div", {}, [
        createElement("div", { className: "progress", attributes: { "aria-hidden": "true" } }, [fill]),
        step,
        stage,
        createElement("div", { className: "lesson__nav" }, [backButton, nextButton]),
      ]),
    ]),
  ]);
}