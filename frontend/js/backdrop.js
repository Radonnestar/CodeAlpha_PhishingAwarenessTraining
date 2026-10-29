import { createElement } from "./dom.js";

const PARTICLE_COUNT = 18;

const between = (min, max) => Math.random() * (max - min) + min;

function buildParticle() {
  const particle = createElement("span", { className: "backdrop__particle" });
  const { style } = particle;

  style.setProperty("--size", `${between(6, 22).toFixed(1)}px`);
  style.setProperty("--left", `${between(0, 100).toFixed(1)}%`);
  style.setProperty("--duration", `${between(22, 44).toFixed(1)}s`);
  style.setProperty("--delay", `${(-between(0, 40)).toFixed(1)}s`);
  style.setProperty("--sway", `${between(-60, 60).toFixed(0)}px`);

  return particle;
}

export function mountBackdrop(container) {
  const particles = Array.from({ length: PARTICLE_COUNT }, buildParticle);

  container.append(...particles);
}