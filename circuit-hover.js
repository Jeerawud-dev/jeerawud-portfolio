/* Precision PCB reveal. Automatically fades when users read or interact. */
(() => {
  "use strict";
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!pointer.matches || document.getElementById("pcb-cursor-reveal")) return;

  const overlay = document.createElement("div");
  overlay.id = "pcb-cursor-reveal";
  overlay.setAttribute("aria-hidden", "true");
  const reticle = document.createElement("span");
  reticle.className = "pcb-reticle";
  overlay.appendChild(reticle);
  document.body.insertBefore(overlay, document.body.firstChild);

  const readingSelectors = [
    "h1","h2","h3","h4","h5","h6","p","a","button","input","textarea","label","select",
    ".hero-copy",".about-grid",".section-heading",".section-note",
    ".timeline-item",".skill-card",".cert",".education",".contact-card",
    ".feature-card",".case-card",".project-card",".portfolio-intro",
    ".showcase-browse-heading",".showcase-toolbar",".result-line",
    ".dialog-shell",".nav-shell",".footer"
  ].join(",");

  let frame = 0, x = -600, y = -600, reading = false;
  function paint() {
    frame = 0;
    overlay.style.setProperty("--pcb-x", x + "px");
    overlay.style.setProperty("--pcb-y", y + "px");
    overlay.classList.toggle("is-reading", reading);
    overlay.classList.add("is-visible");
  }
  function move(event) {
    if (!pointer.matches || event.pointerType === "touch") return;
    x = event.clientX; y = event.clientY;
    reading = event.target instanceof Element && !!event.target.closest(readingSelectors);
    if (!frame) frame = window.requestAnimationFrame(paint);
  }
  function hide() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    overlay.classList.remove("is-visible","is-reading");
  }
  document.addEventListener("pointermove", move, {passive:true});
  document.addEventListener("pointerout", event => {
    if (!event.relatedTarget) hide();
  }, {passive:true});
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hide();
  });
  window.addEventListener("blur", hide);
  if (typeof pointer.addEventListener === "function") {
    pointer.addEventListener("change", () => { if (!pointer.matches) hide(); });
  }
})();
