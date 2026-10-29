import { createElement, createSvgElement } from "./dom.js";

const REGIONS = ["header", "body", "action", "attachment", "footer"];

const label = (x, y, content) =>
  Object.assign(createSvgElement("text", { class: "illustration__label", x, y }), {
    textContent: content,
  });

function buildFishingHook() {
  const svg = createSvgElement(
    "svg",
    {
      viewBox: "0 0 320 180",
      role: "img",
      "aria-label": "A fishing line with an envelope as bait above a hook",
    },
    [
      createSvgElement("path", {
        class: "illustration__water",
        d: "M0 150 Q40 140 80 150 T160 150 T240 150 T320 150 V180 H0 Z",
      }),
      createSvgElement("line", { class: "illustration__line", x1: 160, y1: 0, x2: 160, y2: 56 }),
      createSvgElement("rect", {
        class: "illustration__paper",
        x: 134,
        y: 56,
        width: 52,
        height: 36,
        rx: 4,
      }),
      createSvgElement("path", { class: "illustration__fold", d: "M134 58 L160 78 L186 58" }),
      createSvgElement("path", {
        class: "illustration__line",
        d: "M160 92 L160 128 Q160 152 140 152 Q124 152 124 136",
      }),
      label(200, 80, "Believable bait"),
      label(176, 134, "The hook: your click"),
    ]
  );

  return createElement("figure", { className: "illustration" }, [svg]);
}

function createExplorer(total) {
  const title = createElement("h4", { text: "Tap an item to explore it" });
  const text = createElement("p");
  const counter = createElement("p", { className: "selector__counter" });
  const seen = new Set();

  const refresh = () => {
    counter.textContent = `Explored ${seen.size} of ${total}`;
  };

  refresh();

  return {
    element: createElement(
      "div",
      { className: "selector__detail", attributes: { "aria-live": "polite" } },
      [title, text, counter]
    ),
    show(key, heading, body) {
      seen.add(key);
      title.textContent = heading;
      text.textContent = body;
      refresh();
    },
  };
}

function buildSelector(points, { variant, hubLabel = null }) {
  const explorer = createExplorer(points.length);

  const items = points.map(({ label: name, text }) => {
    const button = createElement("button", {
      className: "selector__item",
      text: name,
      attributes: { type: "button", "aria-pressed": "false" },
    });

    button.addEventListener("click", () => {
      items.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
        item.classList.toggle("selector__item--active", item === button);
      });

      button.classList.add("selector__item--seen");
      explorer.show(name, name, text);
    });

    return button;
  });

  const middle = Math.ceil(items.length / 2);
  const hub = hubLabel ? createElement("div", { className: "selector__hub", text: hubLabel }) : null;
  const cells = hub ? [...items.slice(0, middle), hub, ...items.slice(middle)] : items;

  return createElement("div", { className: `selector selector--${variant}` }, [
    createElement("div", { className: "selector__grid" }, cells),
    explorer.element,
  ]);
}

function buildPressureMeter({ meter }) {
  const active = new Set();
  const message = createElement("p", { className: "meter__message" });
  const level = createElement("p", { className: "meter__level" });
  const note = createElement("p", { className: "meter__note" });
  const fill = createElement("div", { className: "progress__fill meter__fill" });

  const refresh = () => {
    const lines = meter.levers
      .filter(({ label: name }) => active.has(name))
      .map(({ line }) => line);

    message.textContent = [meter.base, ...lines].join(" ");
    level.textContent = `Pressure: ${meter.levels[active.size]}`;
    fill.style.width = `${(active.size / meter.levers.length) * 100}%`;
  };

  const toggles = meter.levers.map(({ label: name, note: explanation }) => {
    const button = createElement("button", {
      className: "meter__toggle",
      text: name,
      attributes: { type: "button", "aria-pressed": "false" },
    });

    button.addEventListener("click", () => {
      const isOn = !active.has(name);

      if (isOn) {
        active.add(name);
      } else {
        active.delete(name);
      }

      button.setAttribute("aria-pressed", String(isOn));
      button.classList.toggle("meter__toggle--on", isOn);
      note.textContent = isOn ? explanation : "";
      refresh();
    });

    return button;
  });

  refresh();

  return createElement("div", { className: "meter" }, [
    createElement("p", {
      className: "meter__hint",
      text: "Switch the levers on and off and watch the message and the pressure change.",
    }),
    createElement("div", { className: "meter__toggles" }, toggles),
    createElement("blockquote", { className: "meter__envelope" }, [message]),
    createElement("div", { className: "progress", attributes: { "aria-hidden": "true" } }, [fill]),
    createElement("div", { attributes: { "aria-live": "polite" } }, [level, note]),
  ]);
}

function buildEmailAnatomy({ anatomy }) {
  const explorer = createExplorer(anatomy.parts.length);

  const hotspots = anatomy.parts.map((part) => {
    const button = createElement("button", {
      className: "email-part",
      text: part.text,
      attributes: { type: "button" },
    });

    const inspect = () => {
      hotspots.forEach((hotspot) => {
        hotspot.classList.toggle("email-part--active", hotspot === button);
      });

      button.classList.add("email-part--seen");
      explorer.show(part.id, part.title, part.check);
    };

    button.addEventListener("click", inspect);
    button.addEventListener("mouseenter", inspect);

    return button;
  });

  const buildRow = (part, button) =>
    createElement(
      "div",
      { className: "email__row" },
      [
        part.label ? createElement("span", { className: "email__label", text: part.label }) : null,
        button,
        part.caption ? createElement("span", { className: "email__caption", text: part.caption }) : null,
      ].filter(Boolean)
    );

  const buildRegion = (region) =>
    createElement(
      "div",
      { className: `email__${region}` },
      anatomy.parts.flatMap((part, index) =>
        part.region === region ? [buildRow(part, hotspots[index])] : []
      )
    );

  const regions = REGIONS.filter((region) => anatomy.parts.some((part) => part.region === region));

  return createElement("div", { className: "selector" }, [
    createElement("article", { className: "email" }, regions.map(buildRegion)),
    explorer.element,
  ]);
}

function buildUrlAnatomy({ url }) {
  const explorer = createExplorer(url.parts.length);

  const buttons = url.parts.map(({ text, label: name, note, owner = false }) => {
    const button = createElement("button", {
      className: "url-part",
      text,
      attributes: { type: "button", "aria-pressed": "false" },
    });

    button.addEventListener("click", () => {
      buttons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
        item.classList.toggle("url-part--active", item === button);
      });

      button.classList.add("url-part--seen");
      explorer.show(name, owner ? `${name}: this decides who owns the site` : name, note);
    });

    return button;
  });

  return createElement("div", { className: "selector" }, [
    createElement("div", { className: "url-bar" }, buttons),
    explorer.element,
  ]);
}

function buildLoginCard(title, variant, { address, banner = null, fields }) {
  return createElement(
    "div",
    { className: `compare__card compare__card--${variant}` },
    [
      createElement("span", { className: "compare__tag", text: title }),
      createElement("span", { className: "compare__address", text: `\u{1F512} ${address}` }),
      createElement("span", { className: "compare__brand", text: "Examplebank" }),
      banner ? createElement("span", { className: "compare__banner", text: banner }) : null,
      ...fields.map((text) => createElement("span", { className: "compare__field", text })),
      createElement("span", { className: "compare__submit", text: "Sign in" }),
    ].filter(Boolean)
  );
}

function buildLoginCompare({ compare }) {
  const toggle = createElement("button", {
    className: "button button--ghost",
    text: "Reveal the differences",
    attributes: { type: "button", "aria-expanded": "false" },
  });

  const differences = createElement(
    "ul",
    { className: "compare__diffs", attributes: { hidden: "" } },
    compare.differences.map(({ label: name, text }) =>
      createElement("li", {}, [
        createElement("strong", { text: name }),
        createElement("span", { text }),
      ])
    )
  );

  const root = createElement("div", { className: "compare" }, [
    createElement("div", { className: "compare__cards" }, [
      buildLoginCard("Real page", "real", compare.real),
      buildLoginCard("Fake page", "fake", compare.fake),
    ]),
    toggle,
    differences,
  ]);

  toggle.addEventListener("click", () => {
    const willShow = differences.hidden;

    differences.hidden = !willShow;
    root.classList.toggle("compare--revealed", willShow);
    toggle.textContent = willShow ? "Hide the differences" : "Reveal the differences";
    toggle.setAttribute("aria-expanded", String(willShow));
  });

  return root;
}

function buildIncidentSimulator({ simulator }, { teacher }) {
  const { steps } = simulator;
  const stage = createElement("div", { className: "sim__stage" });
  let goodChoices = 0;

  function showOutcome() {
    const isPerfect = goodChoices === steps.length;

    const restart = createElement("button", {
      className: "button button--ghost",
      text: "Run it again",
      attributes: { type: "button" },
    });

    restart.addEventListener("click", () => {
      goodChoices = 0;
      showStep(0);
    });

    teacher.setMood(isPerfect ? "celebrating" : "happy");
    teacher.say(
      isPerfect
        ? "A perfect response: fast, honest and thorough."
        : "Good effort. Run it again and see if you can choose the best action every time."
    );

    stage.replaceChildren(
      createElement("h4", { className: "sim__prompt", text: "Simulation complete" }),
      createElement("p", {
        text: `You chose the best action ${goodChoices} of ${steps.length} times. In a real incident, speed and honesty matter more than perfection.`,
      }),
      restart
    );
  }

  function showStep(position) {
    const step = steps[position];
    const isLast = position === steps.length - 1;

    const feedback = createElement("p", {
      className: "sim__feedback",
      attributes: { role: "status" },
    });

    const advance = createElement("button", {
      className: "button",
      text: isLast ? "See the outcome" : "Next step",
      attributes: { type: "button", hidden: "" },
    });

    const buttons = step.options.map(({ text }) =>
      createElement("button", { className: "option", text, attributes: { type: "button" } })
    );

    buttons.forEach((button, chosen) => {
      button.addEventListener("click", () => {
        const { good, feedback: reply } = step.options[chosen];

        buttons.forEach((item, index) => {
          item.disabled = true;
          item.classList.toggle("option--correct", step.options[index].good);
          item.classList.toggle("option--wrong", index === chosen && !good);
        });

        goodChoices += Number(good);
        feedback.textContent = reply;
        teacher.setMood(good ? "happy" : "worried");
        teacher.say(good ? "Good call." : "Careful. That would make things worse.");
        advance.hidden = false;
        advance.focus();
      });
    });

    advance.addEventListener("click", () => (isLast ? showOutcome() : showStep(position + 1)));

    stage.replaceChildren(
      createElement("p", { className: "sim__step", text: `Step ${position + 1} of ${steps.length}` }),
      createElement("h4", { className: "sim__prompt", text: step.prompt }),
      createElement("div", { className: "sim__options" }, buttons),
      feedback,
      advance
    );
  }

  showStep(0);

  return createElement("div", { className: "sim" }, [
    createElement("p", { className: "sim__scenario", text: simulator.scenario }),
    stage,
  ]);
}

const REGISTRY = {
  "fishing-hook": {
    showsPoints: false,
    build: () => buildFishingHook(),
  },
  "phishing-channels": {
    showsPoints: true,
    build: ({ points }) =>
      buildSelector(points, { variant: "hub", hubLabel: "You: every channel ends at a person" }),
  },
  "attack-chain": {
    showsPoints: true,
    build: ({ points }) => buildSelector(points, { variant: "chain" }),
  },
  "case-timeline": {
    showsPoints: true,
    build: ({ points }) => buildSelector(points, { variant: "timeline" }),
  },
  "pressure-meter": {
    showsPoints: false,
    build: (screen) => buildPressureMeter(screen),
  },
  "email-anatomy": {
    showsPoints: false,
    build: (screen) => buildEmailAnatomy(screen),
  },
  "url-anatomy": {
    showsPoints: false,
    build: (screen) => buildUrlAnatomy(screen),
  },
  "login-compare": {
    showsPoints: false,
    build: (screen) => buildLoginCompare(screen),
  },
  "incident-simulator": {
    showsPoints: false,
    build: (screen, context) => buildIncidentSimulator(screen, context),
  },
};

export function renderIllustration(name, screen, context) {
  const entry = REGISTRY[name];

  return entry ? { node: entry.build(screen, context), showsPoints: entry.showsPoints } : null;
}