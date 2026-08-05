/**
 * Concept "Éditorial" : zéro WebGL. L'immersion vient de la typo cinétique,
 * du rideau qui se lève une fois par section (pas d'un scroll continu),
 * d'un spotlight qui suit le curseur et d'un bouton magnétique.
 * Comparaison volontaire face aux 3 autres démos : léger, rapide,
 * mais moins "univers" — juste de la mise en scène 2D.
 */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- Typo cinétique : chaque lettre du titre entre en scène séparément -- */
function splitKinetic(el) {
  const walk = (node) => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split("").forEach((ch) => {
        const outer = document.createElement("span");
        outer.className = "kw";
        const inner = document.createElement("span");
        inner.className = "kw-inner";
        inner.textContent = ch === " " ? " " : ch;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
      return frag;
    }
    return node.cloneNode(true);
  };
  const nodes = Array.from(el.childNodes);
  el.innerHTML = "";
  nodes.forEach((n) => el.appendChild(walk(n)));
  el.querySelectorAll(".kw-inner").forEach((l, i) => { l.style.animationDelay = `${0.25 + i * 0.028}s`; });
}
const kineticTitle = document.querySelector(".kinetic-title");
if (kineticTitle && !reduceMotion) splitKinetic(kineticTitle);

/* --- Rideau au scroll : déclenché une fois, pas recalculé en continu --- */
const wipeEls = Array.from(document.querySelectorAll("[data-wipe]"));
if (reduceMotion) {
  wipeEls.forEach((el) => el.classList.add("is-in"));
} else if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  wipeEls.forEach((el) => io.observe(el));
} else {
  wipeEls.forEach((el) => el.classList.add("is-in"));
}

/* --- Spotlight qui suit le curseur (masque radial CSS) ------------------ */
const spotlight = document.querySelector(".spotlight");
if (spotlight && !reduceMotion) {
  window.addEventListener("pointermove", (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    spotlight.style.setProperty("--mx", `${x}%`);
    spotlight.style.setProperty("--my", `${y}%`);
  }, { passive: true });
}

/* --- Bouton magnétique ---------------------------------------------------- */
const magnetic = document.querySelector(".magnetic");
if (magnetic && !reduceMotion) {
  const radius = 90;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener("pointermove", (e) => {
    const rect = magnetic.getBoundingClientRect();
    const mx = rect.left + rect.width / 2;
    const my = rect.top + rect.height / 2;
    const dx = e.clientX - mx;
    const dy = e.clientY - my;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      tx = dx * 0.35;
      ty = dy * 0.35;
    } else {
      tx = 0; ty = 0;
    }
  }, { passive: true });
  const raf = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    magnetic.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    requestAnimationFrame(raf);
  };
  raf();
}

const yearEl = document.getElementById("footer-year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
