/* Pointer-following PCB spotlight: one rAF update per pointer movement, no render loop. */
(() => {
  "use strict";

  const pointerDevice = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!pointerDevice.matches) return;

  const overlay = document.createElement("div");
  overlay.id = "pcb-cursor-reveal";
  overlay.setAttribute("aria-hidden", "true");
  document.body.insertBefore(overlay, document.body.firstChild);

  let frame = 0;
  let x = -600;
  let y = -600;

  function paint() {
    frame = 0;
    overlay.style.setProperty("--pcb-x", x + "px");
    overlay.style.setProperty("--pcb-y", y + "px");
    overlay.classList.add("is-visible");
  }

  function move(event) {
    if (!pointerDevice.matches || event.pointerType === "touch") return;
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(paint);
  }

  function hide() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    overlay.classList.remove("is-visible");
  }

  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerout", event => {
    if (!event.relatedTarget) hide();
  }, { passive: true });
  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hide();
  });
  if (typeof pointerDevice.addEventListener === "function") {
    pointerDevice.addEventListener("change", () => { if (!pointerDevice.matches) hide(); });
  } else if (typeof pointerDevice.addListener === "function") {
    pointerDevice.addListener(() => { if (!pointerDevice.matches) hide(); });
  }
})();
