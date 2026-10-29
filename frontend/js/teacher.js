import { createElement, createSvgElement } from "./dom.js";

const TYPING_DELAY_MS = 18;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const MOODS = {
  explaining: {
    brows: [[62, 88, 90, 86], [110, 86, 138, 88]],
    pupil: [0, 0],
    mouth: "M90 140 Q100 146 110 140",
    wings: [0, 0],
    show: [],
  },
  happy: {
    brows: [[62, 86, 90, 84], [110, 84, 138, 86]],
    pupil: [0, -1],
    mouth: "M86 138 Q100 154 114 138",
    wings: [0, 0],
    show: [],
  },
  worried: {
    brows: [[62, 92, 90, 84], [110, 84, 138, 92]],
    pupil: [0, 2],
    mouth: "M88 146 Q100 136 112 146",
    wings: [0, 0],
    show: ["sweat"],
  },
  thinking: {
    brows: [[62, 88, 90, 88], [110, 80, 138, 86]],
    pupil: [4, -4],
    mouth: "M92 142 L108 142",
    wings: [0, 0],
    show: ["thought"],
  },
  celebrating: {
    brows: [[62, 84, 90, 82], [110, 82, 138, 84]],
    pupil: [0, -2],
    mouth: "M84 136 Q100 158 116 136",
    wings: [50, -50],
    show: ["sparkles"],
  },
};

const dot = (cx, cy, r) => createSvgElement("circle", { cx, cy, r });

function setLine(line, [x1, y1, x2, y2]) {
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
}

function buildOwl() {
  const leftWing = createSvgElement("path", {
    class: "owl__wing",
    d: "M52 108 Q22 140 40 176 Q58 160 62 130 Z",
  });
  const rightWing = createSvgElement("path", {
    class: "owl__wing",
    d: "M148 108 Q178 140 160 176 Q142 160 138 130 Z",
  });
  const browLeft = createSvgElement("line", { class: "owl__brow" });
  const browRight = createSvgElement("line", { class: "owl__brow" });
  const pupilLeft = createSvgElement("circle", { class: "owl__pupil", r: 7 });
  const pupilRight = createSvgElement("circle", { class: "owl__pupil", r: 7 });
  const mouth = createSvgElement("path", { class: "owl__mouth" });

  const extras = {
    sweat: createSvgElement("path", {
      class: "owl__sweat",
      d: "M150 70 Q156 82 150 88 Q144 82 150 70 Z",
    }),
    thought: createSvgElement("g", { class: "owl__thought" }, [
      dot(160, 56, 3),
      dot(172, 42, 5),
      dot(188, 24, 8),
    ]),
    sparkles: createSvgElement("g", { class: "owl__sparkle" }, [
      createSvgElement("path", {
        d: "M24 44 L27 52 L35 55 L27 58 L24 66 L21 58 L13 55 L21 52 Z",
      }),
      createSvgElement("path", {
        d: "M176 34 L178 40 L184 42 L178 44 L176 50 L174 44 L168 42 L174 40 Z",
      }),
    ]),
  };

  const svg = createSvgElement(
    "svg",
    { viewBox: "-20 0 240 230", "aria-hidden": "true", focusable: "false" },
    [
      leftWing,
      rightWing,
      createSvgElement("ellipse", { class: "owl__body", cx: 100, cy: 134, rx: 62, ry: 72 }),
      createSvgElement("ellipse", { class: "owl__belly", cx: 100, cy: 160, rx: 40, ry: 46 }),
      createSvgElement("ellipse", { class: "owl__feet", cx: 80, cy: 210, rx: 16, ry: 7 }),
      createSvgElement("ellipse", { class: "owl__feet", cx: 120, cy: 210, rx: 16, ry: 7 }),
      createSvgElement("path", { class: "owl__cap", d: "M74 54 L74 72 Q100 86 126 72 L126 54 Z" }),
      createSvgElement("polygon", { class: "owl__cap", points: "36,44 100,18 164,44 100,70" }),
      createSvgElement("path", { class: "owl__tassel", d: "M100 44 L152 52 L152 76" }),
      createSvgElement("circle", { class: "owl__gold", cx: 152, cy: 80, r: 5 }),
      createSvgElement("circle", { class: "owl__eye", cx: 78, cy: 106, r: 15 }),
      createSvgElement("circle", { class: "owl__eye", cx: 122, cy: 106, r: 15 }),
      pupilLeft,
      pupilRight,
      createSvgElement("circle", { class: "owl__glasses", cx: 78, cy: 106, r: 19 }),
      createSvgElement("circle", { class: "owl__glasses", cx: 122, cy: 106, r: 19 }),
      createSvgElement("line", { class: "owl__glasses", x1: 97, y1: 106, x2: 103, y2: 106 }),
      browLeft,
      browRight,
      createSvgElement("polygon", { class: "owl__beak", points: "92,118 108,118 100,134" }),
      mouth,
      ...Object.values(extras),
    ]
  );

  const setMood = (name) => {
    const { brows, pupil, mouth: mouthPath, wings, show } = MOODS[name] ?? MOODS.explaining;

    setLine(browLeft, brows[0]);
    setLine(browRight, brows[1]);
    pupilLeft.setAttribute("cx", 78 + pupil[0]);
    pupilLeft.setAttribute("cy", 106 + pupil[1]);
    pupilRight.setAttribute("cx", 122 + pupil[0]);
    pupilRight.setAttribute("cy", 106 + pupil[1]);
    mouth.setAttribute("d", mouthPath);
    leftWing.setAttribute("transform", `rotate(${wings[0]} 52 108)`);
    rightWing.setAttribute("transform", `rotate(${wings[1]} 148 108)`);

    Object.entries(extras).forEach(([key, element]) => {
      element.setAttribute("visibility", show.includes(key) ? "visible" : "hidden");
    });
  };

  return { svg, setMood };
}

export function createTeacher() {
  const owl = buildOwl();

  const owlButton = createElement(
    "button",
    {
      className: "teacher__owl",
      attributes: { type: "button", "aria-label": "Ask the teacher for a hint" },
    },
    [owl.svg]
  );

  const bubbleText = createElement("p", {
    className: "teacher__text",
    attributes: { "aria-hidden": "true" },
  });

  const announcer = createElement("p", {
    className: "visually-hidden",
    attributes: { role: "status" },
  });

  const element = createElement(
    "aside",
    { className: "teacher", attributes: { "aria-label": "Your teacher" } },
    [owlButton, createElement("div", { className: "teacher__bubble" }, [bubbleText]), announcer]
  );

  let timer = null;
  let tapHandler = null;

  const setMood = (mood) => {
    element.dataset.mood = mood;
    owl.setMood(mood);
  };

  const say = (text) => {
    clearInterval(timer);
    announcer.textContent = text;

    if (reducedMotion.matches) {
      bubbleText.textContent = text;
      return;
    }

    let shown = 0;
    bubbleText.textContent = "";

    timer = setInterval(() => {
      shown += 1;
      bubbleText.textContent = text.slice(0, shown);

      if (shown >= text.length) {
        clearInterval(timer);
      }
    }, TYPING_DELAY_MS);
  };

  const onTap = (handler) => {
    tapHandler = handler;
  };

  owlButton.addEventListener("click", () => tapHandler?.());
  setMood("explaining");

  return { element, setMood, say, onTap };
}