import { api } from "./api.js";
import { createElement } from "./dom.js";
import { createBanner } from "./banner.js";
import { createGate } from "./gate.js";
import { phishingEmails } from "./data/emails.js";
import { mountHunt } from "./huntView.js";

const UNLOCK_MODULE_ID = "email-red-flags";

const banner = () =>
  createBanner({
    eyebrow: "Practice arena",
    title: "Spot the phish",
    subtitle: "A fresh fake email is dealt every round. Click every red flag you can find.",
  });

export async function renderHuntPage() {
  const { hunt_unlocked: unlocked, modules } = await api.progress();

  if (!unlocked) {
    const required = modules.slice(0, modules.findIndex(({ id }) => id === UNLOCK_MODULE_ID) + 1);
    const steps = required.map(({ title, status }) => ({ title, done: status === "completed" }));
    const next = required.find(({ status }) => status !== "completed");

    return createElement("section", {}, [
      banner(),
      createGate({
        title: "This arena is locked",
        text: "Pass the quizzes below, in order, to unlock it.",
        steps,
        next,
      }),
    ]);
  }

  const root = createElement("div", { className: "hunt-root" });

  mountHunt(root, phishingEmails);

  return createElement("section", {}, [banner(), root]);
}