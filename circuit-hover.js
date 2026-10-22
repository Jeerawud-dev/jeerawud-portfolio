/* Smooth, accessible PCB reveal. Coordinates are viewport-relative (fixed overlay). */
(() => {
  "use strict";
  const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!precisePointer.matches || document.getElementById("pcb-cursor-reveal")) return;

  const overlay = document.createElement("div");
  overlay.id = "pcb-cursor-reveal";
  overlay.setAttribute("aria-hidden", "true");

  const sweep = document.createElement("span");
  sweep.className = "pcb-sweep";
  sweep.setAttribute("aria-hidden", "true");
  overlay.appendChild(sweep);
  document.body.insertBefore(overlay, document.body.firstChild);

  let frame = 0;
  let x = -1000;
  let y = -1000;

  function showAtPointer() {
    frame = 0;
    overlay.style.setProperty("--pcb-x", x + "px");
    overlay.style.setProperty("--pcb-y", y + "px");
    overlay.classList.add("is-visible");
  }
  function handleMove(event) {
    if (!precisePointer.matches || event.pointerType === "touch") return;
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(showAtPointer);
  }
  function hide() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    overlay.classList.remove("is-visible");
  }

  document.addEventListener("pointermove", handleMove, { passive: true });
  document.addEventListener("pointerout", event => {
    if (!event.relatedTarget) hide();
  }, { passive: true });
  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hide();
  });
  if (typeof precisePointer.addEventListener === "function") {
    precisePointer.addEventListener("change", () => { if (!precisePointer.matches) hide(); });
  } else if (typeof precisePointer.addListener === "function") {
    precisePointer.addListener(() => { if (!precisePointer.matches) hide(); });
  }
})();
