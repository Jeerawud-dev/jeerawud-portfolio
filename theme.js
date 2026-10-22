/* Two-theme switch. New visitors always get Light; Dark is explicit and remembered.
   Google Sheets data does not control the visual preference. */
(() => {
  "use strict";
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const meta = document.querySelector('meta[name="theme-color"]');
  const storageKey = "jeerawud-theme";
  if (!toggle) return;

  const icon = toggle.querySelector(".theme-toggle__icon");
  const label = toggle.querySelector(".theme-toggle__text");

  function update(theme, remember) {
    const mode = theme === "dark" ? "dark" : "light";
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
    toggle.setAttribute("aria-pressed", String(mode === "dark"));
    const action = mode === "dark" ? "Switch to light theme" : "Switch to dark theme";
    toggle.setAttribute("aria-label", action);
    toggle.title = action;
    if (icon) icon.textContent = mode === "dark" ? "☀" : "☾";
    if (label) label.textContent = mode === "dark" ? "Light" : "Dark";
    if (meta) meta.setAttribute("content", mode === "dark" ? "#07111f" : "#f5f8fc");
    if (remember) {
      try { window.localStorage.setItem(storageKey, mode); } catch (_) { /* private mode */ }
    }
  }

  update(root.dataset.theme, false);
  toggle.addEventListener("click", () => {
    update(root.dataset.theme === "dark" ? "light" : "dark", true);
  });
})();
