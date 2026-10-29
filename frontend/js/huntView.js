import { createElement } from "./dom.js";
import { Hunt } from "./hunt.js";
import { Deck } from "./deck.js";

const REGIONS = ["header", "body", "action", "attachment", "footer"];

export function mountHunt(root, emails) {
  const deck = new Deck(emails);

  const render = () => {
    const email = deck.draw();
    const hunt = new Hunt(email.parts);

    const score = createElement("p", {
      className: "hunt__score",
      attributes: { "aria-live": "polite" },
    });

    const notice = createElement("p", {
      className: "hunt__notice",
      attributes: { "aria-live": "polite" },
    });

    const findings = createElement("ol", { className: "findings" });

    const nextButton = createElement("button", {
      className: "button button--ghost",
      text: "Try another email",
      attributes: { type: "button" },
    });

    const updateScore = () => {
      score.textContent = `Red flags found: ${hunt.foundCount} of ${hunt.totalFlags} · Wrong guesses: ${hunt.misses}`;
    };

    const handleResult = (button, { flag }) => {
      if (flag) {
        button.classList.add("email-part--flagged");
        findings.append(
          createElement("li", {}, [
            createElement("strong", { text: flag.title }),
            createElement("span", { text: flag.explanation }),
          ])
        );
        notice.textContent = "Correct. That is a red flag.";
        return;
      }

      button.classList.add("email-part--clear");
      notice.textContent = "Nothing suspicious here. Legitimate emails contain ordinary content too.";
    };

    const buildPart = (part) => {
      const button = createElement("button", {
        className: "email-part",
        text: part.text,
        attributes: { type: "button" },
      });

      button.addEventListener("click", () => {
        const result = hunt.inspect(part.id);

        if (!result) {
          return;
        }

        button.disabled = true;
        handleResult(button, result);
        updateScore();

        if (hunt.isComplete) {
          notice.textContent = `All ${hunt.totalFlags} red flags found. Wrong guesses: ${hunt.misses}. Attack type: ${email.category}.`;
          nextButton.classList.remove("button--ghost");
        }
      });

      return button;
    };

    const buildRow = (part) => {
      const label = part.label
        ? createElement("span", { className: "email__label", text: part.label })
        : null;

      const caption = part.caption
        ? createElement("span", { className: "email__caption", text: part.caption })
        : null;

      return createElement("div", { className: "email__row" }, [label, buildPart(part), caption].filter(Boolean));
    };

    const buildRegion = (region) =>
      createElement(
        "div",
        { className: `email__${region}` },
        email.parts.filter((part) => part.region === region).map(buildRow)
      );

    const regions = REGIONS.filter((region) => email.parts.some((part) => part.region === region));

    nextButton.addEventListener("click", render);
    updateScore();

    root.replaceChildren(
      createElement("div", { className: "hunt" }, [
        createElement("article", { className: "email" }, regions.map(buildRegion)),
        createElement("aside", { className: "hunt__panel" }, [
          createElement("h3", { text: "Your findings" }),
          score,
          notice,
          findings,
          nextButton,
        ]),
      ])
    );
  };

  render();
}