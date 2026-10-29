const MAX_TILT_DEGREES = 9;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

export function mountTilt(card) {
  if (reducedMotion.matches) {
    return;
  }

  card.classList.add("module-card--tilt");

  card.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") {
      return;
    }

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (event.clientX - left) / width;
    const y = (event.clientY - top) / height;

    card.style.setProperty("--rx", `${((0.5 - y) * MAX_TILT_DEGREES * 2).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${((x - 0.5) * MAX_TILT_DEGREES * 2).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
}