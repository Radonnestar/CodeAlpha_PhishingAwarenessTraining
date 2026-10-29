const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function setAttributes(element, attributes) {
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

export function createElement(tag, { className, text, attributes = {} } = {}, children = []) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  setAttributes(element, attributes);
  element.append(...children);

  return element;
}

export function createSvgElement(tag, attributes = {}, children = []) {
  const element = document.createElementNS(SVG_NAMESPACE, tag);

  setAttributes(element, attributes);
  element.append(...children);

  return element;
}

export function createLink(text, href, className = "") {
  return createElement("a", { className, text, attributes: { href } });
}