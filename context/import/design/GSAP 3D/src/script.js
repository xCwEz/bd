import gsap from "https://esm.sh/gsap";
gsap.registerPlugin(ScrollTrigger);

/* ══ REFS ════════════════════════════════════════ */
const cursor = document.getElementById("cursor");
const closeEl = document.getElementById("close");
const body = document.body;
const penLink = document.getElementById("penlink");
const links = document.getElementsByTagName("a");
const scrollTopBtn = document.getElementById("scroll-top");
const scrollPctEl = document.getElementById("scroll-pct");

/* ══ PENS — Margarita's pen data (slug + title) ══
   Used to build the official CodePen embed on click */
const pens = [
  {
    slug: "NPRPBjd",
    title: "Pure CSS Glassmorphism Liquid Glass UI kit",
    desc:
      "A pure-CSS glassmorphism UI kit built with frosted panels, refracted light and layered blur — no JavaScript, no dependencies. A frontend design study in backdrop-filter, gradients and depth for modern interfaces."
  }, // 01
  {
    slug: "LERbOMR",
    title:
      "The Sims Game Plumbob 3D Spin Animation - Motherlode Cheat Code Motion Design",
    desc:
      "A playful 3D motion-design tribute to The Sims' iconic Plumbob, built with CSS transforms and keyframe animation — complete with a cheeky Motherlode cheat-code easter egg."
  }, // 02
  {
    slug: "XJpgEXm",
    title:
      "Button State Builder - a visual editor for designing multi-state button flows",
    desc:
      "A visual button-state builder for prototyping multi-state UI flows — default, hover, active, disabled — without hand-writing CSS. A handy UX tool for interface and product designers."
  }, // 03
  {
    slug: "OPRxZmV",
    title: "It Was Never A Competition — Full Story",
    desc:
      "A scroll-driven narrative experience told entirely in type and motion, pacing a short story beat by beat as the reader scrolls — an experiment in editorial web storytelling."
  }, // 04
  {
    slug: "xbgrWpd",
    title: "ocean shader",
    desc:
      "A real-time WebGL/GLSL fragment shader simulating rolling ocean waves rendered directly in the browser — a creative-coding study in procedural noise, lighting and shader art."
  }, // 05
  {
    slug: "VYKLMBd",
    title: "Scroll — GSAP ScrollTrigger Zoom with Background",
    desc:
      "A GSAP ScrollTrigger case study pairing a zooming background image with pinned foreground content — a reference for scroll-linked parallax animation on landing pages."
  }, // 06
  {
    slug: "raLXezZ",
    title: "Glyph - Smart Crypto Wallet Landing Page Zero Dependencies",
    desc:
      "A zero-dependency crypto wallet landing page concept — clean typography, a glyph-inspired mark and a conversion-focused layout designed for Web3 product marketing."
  }, // 07
  {
    slug: "vEXmXyy",
    title: "David Lynch slider",
    desc:
      "A moody, David Lynch–inspired image slider with cinematic transitions and film-grain texture — an exploration of atmosphere and pacing in frontend slider and carousel design."
  }, // 08
  {
    slug: "LERyLvw",
    title:
      "Three.js Animated Water Inside Text - Click to Ripple, Move to Swell",
    desc:
      "A Three.js WebGL experiment rendering an animated water surface clipped inside text — click to send a ripple, move your cursor to swell the surface in real time."
  } // 09
];
const CP_USER = "Margarita-the-solid";
const penHolder = document.getElementById("pen-holder");
let currentIndex = 0;

/* ══ CURSOR ══════════════════════════════════════ */
gsap.set("#cursor", { xPercent: -50, yPercent: -50 });
const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const mouse = { x: pos.x, y: pos.y };
const speed = 0.35;
const xSet = gsap.quickSetter(cursor, "x", "px");
const ySet = gsap.quickSetter(cursor, "y", "px");

window.addEventListener("mousemove", (e) => {
  mouse.x = e.x;
  mouse.y = e.y;
});
gsap.ticker.add(() => {
  const dt = 1.0 - Math.pow(1.0 - speed, gsap.ticker.deltaRatio());
  pos.x += (mouse.x - pos.x) * dt;
  pos.y += (mouse.y - pos.y) * dt;
  xSet(pos.x);
  ySet(pos.y);
});

/* ══ INNER CARDS — open CodePen embed on click ══ */
const cards = document.getElementsByClassName("inner");
for (let i = 0; i < cards.length; i++) {
  cards[i].addEventListener("mousemove", () => cursor.classList.add("active"));
  cards[i].addEventListener("mouseover", () => cursor.classList.add("active"));
  cards[i].addEventListener("mouseout", () =>
    cursor.classList.remove("active")
  );
  cards[i].addEventListener(
    "click",
    (function (idx) {
      return function () {
        openPen(idx);
      };
    })(i)
  );
}

const frameCurrentEl = document.getElementById("frame-current");
const frameTotalEl = document.getElementById("frame-total");
const frameTitleEl = document.getElementById("frame-title");
const frameDescEl = document.getElementById("frame-desc");
frameTotalEl.textContent = String(pens.length).padStart(2, "0");

function injectPenEmbed(pen) {
  const targetHeight = Math.max(300, Math.round(penHolder.clientHeight) || 600);
  penHolder.innerHTML = `
    <p class="codepen" data-height="${targetHeight}" data-default-tab="result"
       data-slug-hash="${pen.slug}" data-user="${CP_USER}" data-pen-title="${pen.title}"
       style="height:${targetHeight}px;">
      <span>See the Pen <a href="https://codepen.io/${CP_USER}/pen/${pen.slug}">${pen.title}</a>
      by Margarita (<a href="https://codepen.io/${CP_USER}">@${CP_USER}</a>)
      on <a href="https://codepen.io">CodePen</a>.</span>
    </p>`;

  /* Re-scan for the newly injected .codepen element. On the very first
     open, the embed script's own load-time scan will pick it up even
     if this runs before it's ready. */
  if (window.__CPEmbed) window.__CPEmbed(".codepen");
}

/* Renders a given pen into the modal. `direction` ('next'|'prev'|null)
   controls whether a slide transition plays — null = instant (first open). */
function renderPen(idx, direction) {
  const pen = pens[idx];
  if (!pen) return;
  currentIndex = idx;

  frameCurrentEl.textContent = String(idx + 1).padStart(2, "0");
  frameTitleEl.textContent = pen.title;
  frameDescEl.textContent = pen.desc || "";
  penLink.setAttribute("href", `https://codepen.io/${CP_USER}/pen/${pen.slug}`);

  if (!direction) {
    injectPenEmbed(pen);
    return;
  }

  penHolder.classList.add(
    direction === "next" ? "slide-out-left" : "slide-out-right"
  );

  setTimeout(() => {
    injectPenEmbed(pen);
    penHolder.classList.remove("slide-out-left", "slide-out-right");
    penHolder.classList.add(
      direction === "next" ? "slide-in-right" : "slide-in-left"
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        penHolder.classList.remove("slide-in-right", "slide-in-left");
      });
    });
  }, 220);
}

function openPen(idx) {
  body.classList.add("active");
  renderPen(idx, null);
}

function nextPen() {
  renderPen((currentIndex + 1) % pens.length, "next");
}
function prevPen() {
  renderPen((currentIndex - 1 + pens.length) % pens.length, "prev");
}

document.getElementById("next-pen").addEventListener("click", (e) => {
  e.stopPropagation();
  nextPen();
});
document.getElementById("prev-pen").addEventListener("click", (e) => {
  e.stopPropagation();
  prevPen();
});

/* ══ LINK HOVER ══════════════════════════════════ */
const hoverables = [
  ...links,
  ...document.querySelectorAll(".nav-btn"),
  scrollTopBtn
];
for (const link of hoverables) {
  link.addEventListener("mouseover", () => cursor.classList.add("linkhover"));
  link.addEventListener("mousemove", () => cursor.classList.add("linkhover"));
  link.addEventListener("mouseout", () => cursor.classList.remove("linkhover"));
}

/* ══ CLOSE / ESC ═════════════════════════════════ */
function closeFrame() {
  body.classList.remove("active");
  setTimeout(() => {
    penHolder.innerHTML = "";
  }, 2000);
}
closeEl.addEventListener("click", closeFrame);
document.getElementById("backlink").addEventListener("click", (e) => {
  e.preventDefault();
  closeFrame();
});
document.onkeydown = (evt) => {
  if (evt.key === "Escape" || evt.key === "Esc" || evt.keyCode === 27)
    closeFrame();
  if (body.classList.contains("active")) {
    if (evt.key === "ArrowRight") nextPen();
    if (evt.key === "ArrowLeft") prevPen();
  }
};

/* ══ SPLITTING ═══════════════════════════════════ */
if (typeof Splitting === "function") Splitting();
else console.warn("Splitting.js not loaded — char animations skipped");

/* ══ PER-PANEL SCROLL PROGRESS ══════════════════ */
gsap.utils.toArray(".panel").forEach((section) => {
  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: section,
        start: "top 100%",
        end: "bottom 25%",
        scrub: 0,
        onUpdate(self) {
          section.style.setProperty("--progress", self.progress);
        }
      }
    }
  );
});

/* ══ SCROLL-DRIVEN CURSOR ACCENT ══════════════════
   Cursor ring recolors as you scroll through each panel, cycling the
   same 4-color rhythm used for the thumb accents ($o › $b › $g, then
   ink instead of yellow — yellow matches the bg and would vanish). */
const cursorAccents = ["var(--o)", "var(--b)", "var(--g)", "var(--ink)"];
gsap.utils.toArray(".panel").forEach((section, i) => {
  const accent = cursorAccents[i % cursorAccents.length];
  ScrollTrigger.create({
    trigger: section,
    start: "top center",
    end: "bottom center",
    onEnter: () =>
      document.documentElement.style.setProperty("--cursor-accent", accent),
    onEnterBack: () =>
      document.documentElement.style.setProperty("--cursor-accent", accent),
    onLeaveBack: () => {
      if (i === 0)
        document.documentElement.style.removeProperty("--cursor-accent");
    }
  });
});

/* ══ FUNNY SCROLL CURSOR — squash, stretch & boing ══
   Cursor turns to jelly while scrolling: it stretches along the scroll
   direction and tilts with it, proportional to speed, then springs back
   to a circle with a cartoony elastic overshoot once you stop. */
gsap.set(cursor, { transformOrigin: "50% 50%" });
let cursorIdleTimer;
ScrollTrigger.create({
  onUpdate(self) {
    const velocity = self.getVelocity();
    const stretch = gsap.utils.clamp(-1, 1, velocity / 3000);

    clearTimeout(cursorIdleTimer);
    gsap.to(cursor, {
      scaleY: 1 + Math.abs(stretch) * 1.6,
      scaleX: 1 - Math.abs(stretch) * 0.55,
      rotate: stretch * 25,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto"
    });

    cursorIdleTimer = setTimeout(() => {
      gsap.to(cursor, {
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        duration: 0.9,
        ease: "elastic.out(1, 0.3)",
        overwrite: "auto"
      });
    }, 120);
  }
});

/* ══ PER-PANEL SCROLL INTERACTION ════════════════
   Thumb rotates/scales into place, image zooms out
   with parallax, label slides in, title words rise  */
gsap.utils.toArray(".panel").forEach((panel) => {
  const thumb = panel.querySelector(".thumb");
  const img = panel.querySelector(".inner img");
  const label = panel.querySelector(".thumb > p");
  const words = panel.querySelectorAll("h2 span.word");
  if (!thumb || !img) return;

  gsap.set(thumb, { transformOrigin: "50% 50%" });
  gsap.set(img, { transformOrigin: "50% 20%" });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: panel,
      start: "top 88%",
      end: "top 32%",
      scrub: 0.6
    }
  });

  tl.fromTo(
    thumb,
    { rotate: -3, scale: 0.92 },
    { rotate: 0, scale: 1, ease: "none" },
    0
  ).fromTo(
    img,
    { scale: 1.22, yPercent: -6 },
    { scale: 1, yPercent: 4, ease: "none" },
    0
  );

  if (label) {
    tl.fromTo(
      label,
      { x: -24, opacity: 0 },
      { x: 0, opacity: 1, ease: "none" },
      0
    );
  }
  if (words.length) {
    tl.fromTo(
      words,
      { y: 48, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, ease: "none" },
      0
    );
  }
});

/* ══ FULL-PAGE PROGRESS → h1 word parallax ═══════ */
gsap.to(
  {},
  {
    scrollTrigger: {
      trigger: "body",
      start: "top 100%",
      end: "50% 50%",
      scrub: 0,
      onUpdate(self) {
        body.style.setProperty("--progress", self.progress);
      }
    }
  }
);

/* ══ WHOLE-PAGE SCROLL PROGRESS → back-to-top ring ══ */
gsap.to(
  {},
  {
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 0,
      onUpdate(self) {
        body.style.setProperty("--page-progress", self.progress);
        scrollPctEl.textContent = String(
          Math.round(self.progress * 100)
        ).padStart(2, "0");
        scrollTopBtn.classList.toggle("is-visible", self.progress > 0.02);
      }
    }
  }
);
scrollTopBtn.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

/* ══ PRELOADER → LOADED ══════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  body.classList.add("loaded");
});

/* ══ SCROLLTRIGGER RESIZE ════════════════════════ */
window.addEventListener("resize", () => {
  setTimeout(() => ScrollTrigger.refresh(), 2500);
});

console.log(
  "%cMARGARITA ✦  Pens load lazily via the CodePen embed script — edit the pens[] array to add more.",
  "font-family:monospace;color:#FF00CC;background:#0D0020;padding:10px 16px;font-size:12px;line-height:1.8"
);
