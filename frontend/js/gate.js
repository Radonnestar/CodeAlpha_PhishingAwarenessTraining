import { createElement, createLink, createSvgElement } from "./dom.js";

function buildPadlock() {
  const svg = createSvgElement(
    "svg",
    { viewBox: "0 0 80 100", "aria-hidden": "true", focusable: "false" },
    [
      createSvgElement("path", { class: "lock__shackle", d: "M22 46 V30 a18 18 0 0 1 36 0 V46" }),
      createSvgElement("rect", { class: "lock__body", x: 10, y: 44, width: 60, height: 46, rx: 10 }),
      createSvgElement("circle", { class: "lock__key", cx: 40, cy: 64, r: 6 }),
      createSvgElement("rect", { class: "lock__key", x: 38, y: 66, width: 4, height: 12, rx: 2 }),
    ]
  );

  return createElement("div", { className: "gate__lock" }, [svg]);
}

export function createGate({ title, text, steps, next }) {
  const stepItems = steps.map(({ title: stepTitle, done }) =>
    createElement("li", {
      className: `gate__step${done ? " gate__step--done" : ""}`,
      text: `${done ? "\u2713 " : ""}${stepTitle}`,
    })
  );

  return createElement("section", { className: "gate" }, [
    buildPadlock(),
    createElement("h2", { className: "gate__title", text: title }),
    createElement("p", { className: "gate__text", text }),
    createElement("ul", { className: "gate__steps" }, stepItems),
    next
      ? createLink(`Continue: ${next.title}`, `#/module/${next.id}`, "button")
      : createLink("Go to the modules", "#/", "button"),
  ]);
}