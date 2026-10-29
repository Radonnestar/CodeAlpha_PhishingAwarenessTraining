import { createElement, createLink } from "./dom.js";
import { mountThemeToggle } from "./theme.js";
import { mountBackdrop } from "./backdrop.js";
import { renderModuleMap } from "./moduleMap.js";
import { renderLesson } from "./lessonPlayer.js";
import { renderQuiz, renderFinalExam } from "./quizPlayer.js";
import { renderHuntPage } from "./huntPage.js";
import { renderRapidPage } from "./rapidPage.js";

const outlet = document.getElementById("app");
const navLinks = [...document.querySelectorAll(".site-nav a")];

const ROUTES = [
  { pattern: /^\/$/, render: () => renderModuleMap() },
  { pattern: /^\/module\/([a-z0-9-]+)$/, render: (moduleId) => renderLesson(moduleId) },
  { pattern: /^\/module\/([a-z0-9-]+)\/quiz$/, render: (moduleId) => renderQuiz(moduleId) },
  { pattern: /^\/final-exam$/, render: () => renderFinalExam() },
  { pattern: /^\/hunt$/, render: () => renderHuntPage() },
  { pattern: /^\/rapid$/, render: () => renderRapidPage() },
];

const NAV_PREFIXES = ["/hunt", "/rapid"];

const buildMessage = (title, message) =>
  createElement("section", { className: "panel" }, [
    createElement("h1", { text: title }),
    createElement("p", { text: message }),
    createLink("Back to all modules", "#/", "button"),
  ]);

const markActiveLink = (path) => {
  const prefix = NAV_PREFIXES.find((candidate) => path.startsWith(candidate));
  const activeHash = prefix ? `#${prefix}` : "#/";

  navLinks.forEach((link) => {
    if (link.hash === activeHash) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

let navigation = 0;

async function navigate() {
  const current = ++navigation;
  const path = location.hash.slice(1) || "/";

  const route = ROUTES.map(({ pattern, render }) => ({ match: pattern.exec(path), render })).find(
    ({ match }) => match
  );

  let view;

  try {
    view = route
      ? await route.render(...route.match.slice(1))
      : buildMessage("Page not found", "That page does not exist.");
  } catch (error) {
    view = buildMessage(
      error.status === 403 ? "Locked" : "Something went wrong",
      error.message
    );
  }

  if (current !== navigation) {
    return;
  }

  outlet.replaceChildren(view);
  markActiveLink(path);
  window.scrollTo(0, 0);
  outlet.focus({ preventScroll: true });
}

window.addEventListener("hashchange", navigate);
mountThemeToggle(document.getElementById("theme-toggle"));
mountBackdrop(document.getElementById("backdrop"));
navigate();