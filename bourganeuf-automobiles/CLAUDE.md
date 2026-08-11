# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing site for Bourganeuf Automobiles, a garage/dealership in Bourganeuf (Creuse, France). Next.js App Router + React Three Fiber, built as an "immersive" single-page site: a 3D garage-door hero sequence driven by scroll, then three DOM sections (Services, Collection, Contact). This is client work in progress — the client has not yet provided real contact details, hours, or vehicle stock/photos (see "Placeholder data" below).

The UI, code comments, variable/function names, and commit-facing text are all in **French**. Keep new code consistent with that (French identifiers throughout `lib/` and `components/`).

## Commands

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm start        # serve the production build
```

There is no lint script, no test suite, and no CI config in this project — don't invent commands for them.

## The project's core rule: procedural, except vehicle photos

`public/` must stay empty except for `public/vehicules/<id>/` (real vehicle photos, once the client sends them) and, optionally, `public/services/<id>.webp|avif|jpg|png` (real service photos). No other `.glb`, bitmap texture, photo, or binary font belongs in the repo:

- Textures (concrete, sheet metal, dust grain, reflection panorama) are painted on a canvas at runtime in `lib/textures.js`.
- The reflection environment is a homemade equirectangular panorama, PMREM-filtered once and shared across scenes via `lib/envPartage.js`.
- Geometry is primitive or code-deformed (e.g. the door panel is a hand-curved 96×64 grid in `lib/porte.js`).
- Fonts come from `next/font/google` (see `app/layout.js`) — nothing is checked in.

When adding visuals, default to building them procedurally in `components/three/` or `lib/textures.js` rather than adding an asset file.

## Architecture

**Server-first, 3D as enhancement.** `app/page.js` renders all four sections (`Entete`, `Hero`, `Services`, `Collection`, `Contact`, `Pied`) server-side with full text content. The Three.js scenes mount client-side afterward and layer on top — the page is complete and readable without any WebGL. Each 3D component (`components/three/SceneHero.jsx`, `VisuelService.jsx`) is loaded via `next/dynamic(..., { ssr: false })`, deferred by a couple of `requestAnimationFrame` ticks so text paints before Three.js is even evaluated (see `components/ui/Hero.jsx`).

**Environment/quality detection (`lib/quality.js`).** `useEnvironnement()` is the single hook every 3D-consuming component reads. It detects WebGL availability, a quality tier (`low`/`medium`/`high`, based on GPU renderer string, core count, memory, viewport size), mobile/touch, and `prefers-reduced-motion`. `reglages(qualite, mobile)` turns the tier into feature flags (volumetrics, depth of field, particle count, reflections, shadows, bloom) consumed by the scene components. Nothing renders 3D until `pret` (ready) is true.

**Scroll-driven sequence (`lib/scroll.js`).** `useProgressionEntree` wires a GSAP `ScrollTrigger` (scrubbed) to a section ref and stores progress in a `ref`, not React state — the 3D scene reads it every frame; a re-render per scroll pixel would be wasted work. When `actif` is false (reduced motion or no WebGL), progress is pinned to `1` (door fully open, no scroll animation). `SceneHero.jsx` consumes this via `Pilote`/`CameraRig` in `components/three/Sequence.jsx`.

**Garage door geometry (`lib/porte.js`).** The sectional door doesn't hinge; each panel follows a rail parameterized by curvilinear abscissa `s` (vertical run → quarter-circle bend at the lintel → horizontal run under the ceiling). `largeurPorte(aspect)` adapts the door width to viewport aspect ratio (portrait vs. landscape framing); `reculPourCadrer` derives the camera dolly distance that keeps the door edge-to-edge in frame at any aspect.

**Shared PMREM environment (`lib/envPartage.js`).** The panorama is filtered into a PMREM env map once per WebGL context and reference-counted in a `WeakMap`, because drei's `<View>` gives each of the five service visuals its own virtual scene — without sharing, that's five redundant PMREM generations for an identical result.

**Reveal/viewport hooks (`lib/useReveal.js`).** `useReveal` triggers a one-shot CSS reveal-on-scroll (disconnects after first intersection — no re-trigger on scroll-back, by design). `useDansLeViewport` tracks continuous intersection + tab visibility, used to suspend a canvas's render loop (`frameloop="never"`) when it's off-screen or the tab is backgrounded.

**Available service/vehicle photos are resolved server-side.** `lib/visuelsDisponibles.js` reads `public/services/` at request time (`fs.readdirSync`, server-only) and returns a map of service id → real image path, only for files that actually exist; this is cached at build in production, so adding an image requires `npm run build` to take effect. Vehicle cards follow the same pattern via each `vehicules[].photos` array in `lib/data.js` — an empty array falls back to a procedural placeholder (`VisuelParallaxe` picks up automatically once a photo exists). Never hardcode an image path that isn't backed by this resolution.

**Contact form (`app/api/contact/route.js`).** Server-side validation duplicates client-side rules (name, email regex, phone digits, message length) — never trust the browser alone. Routes to `CONTACT_WEBHOOK_URL` if set (env var, not committed), otherwise just logs server-side via `console.info`. No email provider is wired up; that's a deployment concern, not a code concern.

**Performance conventions** (see `bourganeuf-automobiles/README.md` for the full list): `devicePixelRatio` capped at 2; instancing for repeated meshes (door panels, neon strips, uprights, rails, smoke, light beams, brake-disc grooves); render loop set to `frameloop="never"` when a canvas leaves the viewport or the tab backgrounds; only two WebGL contexts total (hero canvas + one shared `View`-based context for the five service visuals — Collection is plain DOM/CSS, reusing the same photo component as Services, not a third context).

**Accessibility/fallback conventions:** all text content lives in server-rendered DOM; `prefers-reduced-motion` shows the door already open with no scroll animation; without WebGL, door/neon/floor fall back to CSS gradients (`ReplieStatique`); without JS, a `<noscript>` block in `app/layout.js` cancels the initial reveal state so nothing stays hidden; touch targets are 44px, no hover-dependent interactions.

## Placeholder data — do not treat as real

`lib/data.js` is the single file to edit for editorial content, and it currently contains **fictional data flagged inline**:
- `contact` (address, phone, email): plausible-looking but invented. The phone number uses the `0X 99 00 XX XX` range ARCEP reserves for fiction. Replace this block only, nothing else in the project duplicates these values (footer, JSON-LD in `app/layout.js`, and the map all read from here).
- `vehicules`: three demo entries with empty `photos` arrays, to replace entirely once the client sends real stock. To add real photos: drop them in `public/vehicules/<id>/` and populate the corresponding `photos` array.

When asked to change contact info or stock, edit `lib/data.js` only — don't propagate values elsewhere in the codebase.

## A quirk to know about

The embedded browser preview panel (used for visual review) freezes `requestAnimationFrame` when not visible/focused — 3D and scroll animations will appear frozen there even though nothing is broken. Verify motion/animation changes in an actual browser tab, not just the preview panel.
