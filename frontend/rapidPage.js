import { api } from "./api.js";
import { createElement } from "./dom.js";
import { createBanner } from "./banner.js";
import { createGate } from "./gate.js";
import { messages } from "./data/messages.js";
import { mountRapid } from "./rapidView.js";

const UNLOCK_MODULE_ID = "fake-websites";

const banner = () =>
  createBanner({
    eyebrow: "Speed round",
    title: "Phish or legit?",
    subtitle: "Real-looking messages, a ticking clock and three lives. Trust your training.",
  });

export async function renderRapidPage() {
  const { modules } = await api.progress();
  const unlockIndex = modules.findIndex(({ id }) => id === UNLOCK_MODULE_ID);
  const required = modules.slice(0, unlockIndex + 1);

  if (modules[unlockIndex].status !== "completed") {
    const steps = required.map(({ title, status }) => ({ title, done: status === "completed" }));
    const next = required.find(({ status }) => status !== "completed");

    return createElement("section", {}, [
      banner(),
      createGate({
        title: "The speed round is locked",
        text: "Pass the quizzes below, in order, to unlock it.",
        steps,
        next,
      }),
    ]);
  }

  const root = createElement("div", { className: "rapid" });

  mountRapid(root, messages);

  return createElement("section", {}, [banner(), root]);
}