import { createElement, createSvgElement } from "./dom.js";

const STAR_COUNT = 36;
const WAVE_PATH =
  "M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 T1500 60 T1800 60 T2100 60 T2400 60 V120 H0 Z";

const between = (min, max) => Math.random() * (max - min) + min;

function buildStar() {
  const star = createElement("span", { className: "banner__star" });
  const { style } = star;

  style.setProperty("--left", `${between(0, 100).toFixed(1)}%`);
  style.setProperty("--top", `${between(0, 80).toFixed(1)}%`);
  style.setProperty("--size", `${between(1, 3).toFixed(1)}px`);
  style.setProperty("--duration", `${between(2, 5).toFixed(1)}s`);
  style.setProperty("--delay", `${(-between(0, 5)).toFixed(1)}s`);

  return star;
}

const buildWave = (number) =>
  createSvgElement(
    "svg",
    {
      class: `banner__wave banner__wave--${number}`,
      viewBox: "0 0 2400 120",
      preserveAspectRatio: "none",
      focusable: "false",
    },
    [createSvgElement("path", { d: WAVE_PATH })]
  );

function buildTitle(text) {
  let index = 0;

  const words = text.split(" ").map((word) =>
    createElement(
      "span",
      { className: "banner__word", attributes: { "aria-hidden": "true" } },
      [...word].map((char) => {
        const letter = createElement("span", { className: "banner__char", text: char });

        letter.style.setProperty("--i", String(index));
        index += 1;

        return letter;
      })
    )
  );

  return createElement("h1", { className: "banner__title", attributes: { "aria-label": text } }, words);
}

export function createBanner({ eyebrow, title, subtitle }) {
  const sky = createElement(
    "div",
    { className: "banner__sky", attributes: { "aria-hidden": "true" } },
    [
      ...Array.from({ length: STAR_COUNT }, buildStar),
      createElement("span", { className: "banner__aurora" }),
      createElement("span", { className: "banner__moon" }),
      buildWave(1),
      buildWave(2),
    ]
  );

  return createElement("header", { className: "banner" }, [
    sky,
    createElement("div", { className: "banner__content" }, [
      createElement("p", { className: "banner__eyebrow", text: eyebrow }),
      buildTitle(title),
      createElement("p", { className: "banner__subtitle", text: subtitle }),
    ]),
  ]);
}