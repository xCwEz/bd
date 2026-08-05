/* --- Reveal continu au scroll, partagé par les 4 démos -------------------
   Même mécanique que le portfolio principal : chaque [data-reveal] a sa
   progression 0→1 recalculée à chaque frame de scroll. */
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));

const localProgress = (el) => {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const start = vh * 0.96;
  const end = vh * 0.58;
  return clamp((start - rect.top) / (start - end), 0, 1);
};

const applyReveal = (el, p) => {
  const eased = p * p * (3 - 2 * p);
  el.style.opacity = eased.toFixed(3);
  el.style.filter = `blur(${((1 - eased) * 6).toFixed(2)}px)`;
  el.style.transform = `translate3d(0, ${((1 - eased) * 28).toFixed(1)}px, 0)`;
};

if (reduceMotion) {
  revealEls.forEach((el) => { el.style.opacity = "1"; el.style.filter = "none"; el.style.transform = "none"; });
}

/** Progression globale de scroll 0→1 sur toute la page. */
export function globalProgress() {
  const span = document.documentElement.scrollHeight - window.innerHeight;
  return span > 0 ? clamp(window.scrollY / span, 0, 1) : 0;
}

let raf = 0;
const listeners = [];
/** Enregistre un callback(progress) appelé à chaque frame de scroll (throttlé). */
export function onScrollProgress(fn) { listeners.push(fn); }

const tick = () => {
  raf = 0;
  const p = globalProgress();
  if (!reduceMotion) revealEls.forEach((el) => applyReveal(el, localProgress(el)));
  listeners.forEach((fn) => fn(p));
};
const request = () => { if (!raf) raf = requestAnimationFrame(tick); };
window.addEventListener("scroll", request, { passive: true });
window.addEventListener("resize", request, { passive: true });
request();

const yearEl = document.getElementById("footer-year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
