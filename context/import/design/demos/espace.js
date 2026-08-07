import * as THREE from "three";
import { EffectComposer } from "https://unpkg.com/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.169.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "https://unpkg.com/three@0.169.0/examples/jsm/postprocessing/OutputPass.js";
import { reduceMotion, onScrollProgress } from "./demos.js";

/**
 * Concept "Voyage spatial" : un couloir, mais entre les étoiles. Le scroll
 * pilote la caméra le long d'une trajectoire (CatmullRom) qui traverse une
 * étoile, une planète à anneau, puis un champ de météorites — chaque corps
 * céleste porte une section. Bloom + matériaux physiques pour viser le
 * niveau de finition d'igloo.inc, sans en reprendre la scène.
 */
const canvas = document.getElementById("scene");
if (canvas) {
  const mm = (q) => window.matchMedia && window.matchMedia(q).matches;
  const mobile = mm("(max-width: 860px)") || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
  const lowPower = mobile || (navigator.hardwareConcurrency || 4) <= 4;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1.3 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x090a12, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090a12, 0.028);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);

  const cyan = new THREE.Color(0x6fe0e0);
  const violet = new THREE.Color(0xb9a6ff);

  // --- Trajectoire : hero -> étoile -> planète -> météorites -> contact ---
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 12),
      new THREE.Vector3(2.4, 0.6, 4),
      new THREE.Vector3(-2.6, -0.4, -6),
      new THREE.Vector3(2.2, 0.9, -16),
      new THREE.Vector3(-1.2, 0.2, -26),
    ],
    false,
    "catmullrom",
    0.4
  );

  // --- Étoile : coeur non-éclairé + halo, capté par le bloom --------------
  // Décalée par rapport au point de la trajectoire pour ne pas passer
  // derrière le titre du hero (centré à l'écran) au tout début du scroll.
  const starPos = curve.getPointAt(0.24).add(new THREE.Vector3(2.8, 2.3, 0));
  const starGroup = new THREE.Group();
  starGroup.position.copy(starPos);
  const starCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 4),
    new THREE.MeshBasicMaterial({ color: 0xd9f3f3 })
  );
  starGroup.add(starCore);
  const starLight = new THREE.PointLight(0xbdf3f3, 14, 40, 2);
  starGroup.add(starLight);
  scene.add(starGroup);

  // --- Planète à anneau : matériaux physiques ------------------------------
  const planetPos = curve.getPointAt(0.52);
  const planetGroup = new THREE.Group();
  planetGroup.position.copy(planetPos);
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 64, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x453a7a,
      roughness: 0.38,
      metalness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      sheen: 1,
      sheenColor: violet,
      emissive: 0x120a2a,
      emissiveIntensity: 0.4,
    })
  );
  planetGroup.add(planet);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 2.7, 96),
    new THREE.MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
  );
  ring.rotation.x = Math.PI / 2.35;
  ring.rotation.y = 0.2;
  planetGroup.add(ring);
  scene.add(planetGroup);

  // --- Champ de météorites : nuage low-poly autour du 3e point ------------
  const beltPos = curve.getPointAt(0.78);
  const beltGroup = new THREE.Group();
  beltGroup.position.copy(beltPos);
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3c, roughness: 0.95, metalness: 0.05, flatShading: true });
  const rockCount = lowPower ? 16 : 34;
  const rocks = [];
  let seed = 4242;
  const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  for (let i = 0; i < rockCount; i++) {
    const mesh = new THREE.Mesh(rockGeo, rockMat);
    const a = rnd() * Math.PI * 2;
    const r = 2.2 + rnd() * 4.2;
    mesh.position.set(Math.cos(a) * r, (rnd() - 0.5) * 2.6, Math.sin(a) * r);
    const s = 0.06 + rnd() * 0.22;
    mesh.scale.setScalar(s);
    mesh.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    mesh.userData.spin = (0.15 + rnd() * 0.4) * (rnd() > 0.5 ? 1 : -1);
    mesh.userData.phase = rnd() * Math.PI * 2;
    beltGroup.add(mesh);
    rocks.push(mesh);
  }
  scene.add(beltGroup);

  // --- Champ d'étoiles : 3 couches de profondeur, additive blending -------
  function makeStarfield(count, spread, size, mixT) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = cyan.clone().lerp(violet, mixT);
    let s = 900 + mixT * 5000;
    const r = () => ((s = (s * 48271) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * spread;
      pos[i * 3 + 1] = (r() - 0.5) * spread * 0.6;
      pos[i * 3 + 2] = (r() - 0.5) * spread - 10;
      const flicker = 0.55 + r() * 0.45;
      col[i * 3] = c.r * flicker;
      col[i * 3 + 1] = c.g * flicker;
      col[i * 3 + 2] = c.b * flicker;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size, sizeAttenuation: true, vertexColors: true, transparent: true,
      opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }
  const fieldCount = lowPower ? [260, 160] : [520, 300];
  const starsFar = makeStarfield(fieldCount[0], 70, 0.06, 0.2);
  const starsNear = makeStarfield(fieldCount[1], 45, 0.1, 0.7);
  scene.add(starsFar, starsNear);

  scene.add(new THREE.HemisphereLight(0x8fa6ff, 0x0b0b16, 0.65));
  scene.add(camera);
  const fillLight = new THREE.PointLight(0xd8dcff, 5, 16, 2);
  camera.add(fillLight);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), lowPower ? 0.55 : 0.8, 0.4, 0.35);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  resize();
  window.addEventListener("resize", resize, { passive: true });

  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  window.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let progress = 0;
  onScrollProgress((p) => { progress = p; });

  let pageVisible = true;
  document.addEventListener("visibilitychange", () => { pageVisible = !document.hidden; });

  const camPoint = curve.getPointAt(0);
  const lookPoint = curve.getPointAt(0.02);
  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!pageVisible) return;
    const t = clock.getElapsedTime();

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    const p = THREE.MathUtils.clamp(progress, 0, 0.998);
    const ahead = THREE.MathUtils.clamp(progress + 0.02, 0, 0.999);
    const point = curve.getPointAt(p);
    const look = curve.getPointAt(ahead);
    camPoint.lerp(point, 0.07);
    lookPoint.lerp(look, 0.07);

    camera.position.copy(camPoint);
    camera.position.x += targetX * 0.35;
    camera.position.y += -targetY * 0.25;
    camera.lookAt(lookPoint);

    starCore.rotation.y = t * 0.05;
    starLight.intensity = 13 + Math.sin(t * 1.6) * 1.6;
    planetGroup.rotation.y = t * 0.06;
    ring.rotation.z = t * 0.02;
    rocks.forEach((m) => {
      m.rotation.x += 0.0025 * m.userData.spin;
      m.rotation.y += 0.004 * m.userData.spin;
      m.position.y += Math.sin(t * 0.4 + m.userData.phase) * 0.0006;
    });
    starsFar.rotation.y = t * 0.004;
    starsNear.rotation.y = -t * 0.006;

    composer.render();
  }

  if (reduceMotion) {
    camera.position.copy(curve.getPointAt(0));
    camera.lookAt(curve.getPointAt(0.02));
    composer.render();
  } else {
    frame();
  }
  window.addEventListener("pagehide", () => { if (raf) cancelAnimationFrame(raf); }, { once: true });
}

// --- Curseur élastique : squish/stretch selon le vecteur de vélocité ------
(function initCursor() {
  const canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover || reduceMotion) return;

  const dot = document.createElement("div");
  dot.className = "elastic-cursor";
  document.body.appendChild(dot);

  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let tx = x, ty = y, vx = 0, vy = 0;
  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });

  let raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    const px = x, py = y;
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    vx = x - px; vy = y - py;
    const speed = Math.min(Math.hypot(vx, vy), 40);
    const angle = Math.atan2(vy, vx) * (180 / Math.PI);
    const stretch = 1 + speed * 0.045;
    const squish = 1 / Math.sqrt(stretch);
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scale(${stretch}, ${squish})`;
  }
  tick();
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else tick(); });
})();
