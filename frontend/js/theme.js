const STORAGE_KEY = "theme";

export function mountThemeToggle(button) {
  const root = document.documentElement;

  const render = () => {
    const isDark = root.dataset.theme === "dark";

    button.textContent = isDark ? "Light mode" : "Dark mode";
    button.setAttribute("aria-pressed", String(isDark));
  };

  button.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";

    root.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    render();
  });

  render();
}