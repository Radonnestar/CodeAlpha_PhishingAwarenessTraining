import { createElement, createLink, createSvgElement } from "./dom.js";

const STAR_COUNT = 70;
const SHOOTER_COUNT = 3;
const FIREFLY_COUNT = 16;
const SMOOTHING = 0.07;
const SETTLE_THRESHOLD = 0.001;
const COUNT_UP_MS = 1400;
const FAR_PATH =
  "M0 300 L0 180 L120 90 L240 170 L380 60 L520 180 L660 110 L800 190 L960 80 L1100 170 L1200 120 L1200 300 Z";
const MID_PATH = "M0 300 L0 210 Q150 130 300 200 T600 190 T900 180 T1200 200 L1200 300 Z";
const WAVE_PATH =
  "M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 T1500 60 T1800 60 T2100 60 T2400 60 V120 H0 Z";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const between = (min, max) => Math.random() * (max - min) + min;

function setVars(element, vars) {
  Object.entries(vars).forEach(([name, value]) => element.style.setProperty(name, value));

  return element;
}

const scatter = (count, className, makeVars) =>
  Array.from({ length: count }, (_, index) =>
    setVars(createElement("span", { className }), makeVars(index))
  );

const layer = (name, depth, children) =>
  setVars(
    createElement(
      "div",
      {
        className: `scene__layer scene__layer--${name}`,
        attributes: { "aria-hidden": "true" },
      },
      children
    ),
    { "--depth": depth }
  );

const terrain = (className, path) =>
  createSvgElement(
    "svg",
    {
      class: `scene__terrain ${className}`,
      viewBox: "0 0 1200 300",
      preserveAspectRatio: "none",
      focusable: "false",
    },
    [createSvgElement("path", { d: path })]
  );

const wave = (number) =>
  createSvgElement(
    "svg",
    {
      class: `scene__wave scene__wave--${number}`,
      viewBox: "0 0 2400 120",
      preserveAspectRatio: "none",
      focusable: "false",
    },
    [createSvgElement("path", { d: WAVE_PATH })]
  );

function buildLighthouse() {
  const beam = (side) => createElement("span", { className: `scene__beam scene__beam--${side}` });

  const tower = createSvgElement(
    "svg",
    { class: "scene__tower", viewBox: "0 0 54 150", focusable: "false" },
    [
      createSvgElement("polygon", { class: "tower__wall", points: "14,150 40,150 34,50 20,50" }),
      createSvgElement("polygon", {
        class: "tower__stripe",
        points: "15.8,120 38.2,120 37,100 17,100",
      }),
      createSvgElement("polygon", {
        class: "tower__stripe",
        points: "17.6,90 36.4,90 35.2,70 18.8,70",
      }),
      createSvgElement("rect", { class: "tower__gallery", x: 16, y: 44, width: 22, height: 6, rx: 1 }),
      createSvgElement("rect", { class: "tower__lamp", x: 21, y: 28, width: 12, height: 16 }),
      createSvgElement("polygon", { class: "tower__roof", points: "19,28 27,14 35,28" }),
    ]
  );

  return createElement("div", { className: "scene__lighthouse" }, [beam("left"), beam("right"), tower]);
}

function buildHook() {
  const art = createSvgElement(
    "svg",
    { class: "scene__hook-art", viewBox: "0 0 80 330", focusable: "false" },
    [
      createSvgElement("line", { class: "hook__line", x1: 40, y1: 0, x2: 40, y2: 150 }),
      createSvgElement("rect", { class: "hook__paper", x: 14, y: 150, width: 52, height: 36, rx: 4 }),
      createSvgElement("path", { class: "hook__fold", d: "M14 152 L40 172 L66 152" }),
      createSvgElement("line", { class: "hook__line", x1: 40, y1: 186, x2: 40, y2: 262 }),
      createSvgElement("path", {
        class: "hook__metal",
        d: "M40 262 L40 292 Q40 322 20 322 Q4 322 4 304",
      }),
    ]
  );

  return createElement("div", { className: "scene__hook" }, [art]);
}

function buildBird() {
  const wing = (side, path) =>
    createSvgElement("path", { class: `bird__wing bird__wing--${side}`, d: path });

  const art = createSvgElement(
    "svg",
    { class: "scene__bird-art", viewBox: "0 0 60 40", focusable: "false" },
    [wing("left", "M30 22 Q15 2 0 16"), wing("right", "M30 22 Q45 2 60 16")]
  );

  return createElement("div", { className: "scene__bird" }, [art]);
}

function buildFish(left, delay) {
  const art = createSvgElement(
    "svg",
    { class: "scene__fish-art", viewBox: "0 0 44 24", focusable: "false" },
    [createSvgElement("path", { d: "M0 12 Q14 0 30 12 Q14 24 0 12 Z M30 12 L43 2 L43 22 Z" })]
  );

  return setVars(createElement("div", { className: "scene__fish" }, [art]), {
    "--left": left,
    "--delay": delay,
  });
}

function buildTitle(text) {
  let index = 0;

  const words = text.split(" ").map((word) =>
    createElement(
      "span",
      { className: "scene__word", attributes: { "aria-hidden": "true" } },
      [...word].map((char) => {
        const letter = setVars(createElement("span", { className: "scene__char", text: char }), {
          "--i": String(index),
        });

        index += 1;

        return letter;
      })
    )
  );

  return createElement("h1", { className: "scene__title", attributes: { "aria-label": text } }, words);
}

function countUp(element, target) {
  if (reducedMotion.matches || target === 0) {
    element.textContent = String(target);
    return;
  }

  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / COUNT_UP_MS, 1);

    element.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

function mountParallax(scene) {
  if (reducedMotion.matches) {
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let frame = 0;

  const tick = () => {
    x += (targetX - x) * SMOOTHING;
    y += (targetY - y) * SMOOTHING;
    scene.style.setProperty("--px", x.toFixed(4));
    scene.style.setProperty("--py", y.toFixed(4));

    const settled =
      Math.abs(targetX - x) < SETTLE_THRESHOLD && Math.abs(targetY - y) < SETTLE_THRESHOLD;

    frame = settled ? 0 : requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!frame) {
      frame = requestAnimationFrame(tick);
    }
  };

  scene.addEventListener("pointermove", (event) => {
    const { left, top, width, height } = scene.getBoundingClientRect();
    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    targetX = (relativeX - 0.5) * 2;
    targetY = (relativeY - 0.5) * 2;
    scene.style.setProperty("--mx", `${(relativeX * 100).toFixed(1)}%`);
    scene.style.setProperty("--my", `${(relativeY * 100).toFixed(1)}%`);
    wake();
  });

  scene.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    wake();
  });
}

export function createScene({ href, ctaLabel, completed, total }) {
  const stars = scatter(STAR_COUNT, "scene__star", () => ({
    "--left": `${between(0, 100).toFixed(1)}%`,
    "--top": `${between(0, 70).toFixed(1)}%`,
    "--size": `${between(1, 3).toFixed(1)}px`,
    "--duration": `${between(2, 5).toFixed(1)}s`,
    "--delay": `${(-between(0, 5)).toFixed(1)}s`,
  }));

  const shooters = scatter(SHOOTER_COUNT, "scene__shooter", (index) => ({
    "--left": `${between(5, 55).toFixed(1)}%`,
    "--top": `${between(2, 28).toFixed(1)}%`,
    "--delay": `${(index * 5 + between(1, 4)).toFixed(1)}s`,
  }));

  const fireflies = scatter(FIREFLY_COUNT, "scene__firefly", () => ({
    "--left": `${between(5, 95).toFixed(1)}%`,
    "--top": `${between(40, 92).toFixed(1)}%`,
    "--duration": `${between(6, 12).toFixed(1)}s`,
    "--delay": `${(-between(0, 8)).toFixed(1)}s`,
    "--dx": `${between(-60, 60).toFixed(0)}px`,
    "--dy": `${between(-60, 60).toFixed(0)}px`,
  }));

  const counter = createElement("span", { className: "scene__count", text: "0" });

  const content = createElement("div", { className: "scene__content" }, [
    buildTitle("Don't take the bait."),
    createElement("p", {
      className: "scene__lead",
      text: "Six short modules, one wise owl and a sea full of bait. Learn to spot every hook before you bite.",
    }),
    createElement("p", { className: "scene__chip" }, [
      counter,
      createElement("span", { text: ` of ${total} modules completed` }),
    ]),
    createLink(ctaLabel, href, "button scene__cta"),
  ]);

  const sea = createElement("div", { className: "scene__sea" }, [
    wave(1),
    wave(2),
    buildFish("30%", "2s"),
    buildFish("55%", "7s"),
    wave(3),
  ]);

  const scene = createElement("div", { className: "scene" }, [
    layer("sky", 6, [...stars, ...shooters]),
    layer("aurora", 9, [
      createElement("span", { className: "scene__aurora" }),
      createElement("span", { className: "scene__aurora scene__aurora--alt" }),
    ]),
    layer("moon", 12, [createElement("span", { className: "scene__moon" })]),
    layer("far", 18, [terrain("terrain--far", FAR_PATH)]),
    layer("mid", 28, [terrain("terrain--mid", MID_PATH), buildLighthouse()]),
    layer("bird", 34, [buildBird()]),
    layer("sea", 44, [sea]),
    layer("hook", 38, [buildHook()]),
    layer("flies", 60, fireflies),
    createElement("div", { className: "scene__glow", attributes: { "aria-hidden": "true" } }),
    content,
  ]);

  mountParallax(scene);
  countUp(counter, completed);

  return scene;
}