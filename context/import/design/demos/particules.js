import * as THREE from "https://unpkg.com/three@0.169.0/build/three.module.js";
import { reduceMotion, onScrollProgress } from "./demos.js";

/**
 * Concept "Nébuleuse" : un nuage de poussière en 3 couches de profondeur,
 * caméra quasi fixe (pas de voyage). L'immersion vient de la parallaxe
 * (chaque couche répond différemment au scroll et à la souris) plutôt
 * que du déplacement dans l'espace — sensation de flotter, pas de voler.
 */
const canvas = document.getElementById("scene");
if (canvas) {
  const mm = (q) => window.matchMedia && window.matchMedia(q).matches;
  const mobile = mm("(max-width: 860px)") || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
  const lowPower = mobile || (navigator.hardwareConcurrency || 4) <= 4;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.3 : 2));
  renderer.setClearColor(0x090a12, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  camera.position.set(0, 0, 7);

  const cyan = new THREE.Color(0x6fe0e0);
  const violet = new THREE.Color(0xb9a6ff);

  function makeLayer(count, spread, z, size, mixT) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = cyan.clone().lerp(violet, mixT);
    let seed = 1000 + z * 137;
    const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * spread;
      pos[i * 3 + 1] = (rnd() - 0.5) * spread * 0.62;
      pos[i * 3 + 2] = z - rnd() * 4;
      const flicker = 0.6 + rnd() * 0.4;
      col[i * 3] = c.r * flicker;
      col[i * 3 + 1] = c.g * flicker;
      col[i * 3 + 2] = c.b * flicker;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size, sizeAttenuation: true, vertexColors: true, transparent: true,
      opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  const layerCount = lowPower ? [140, 90, 50] : [320, 200, 110];
  const far = makeLayer(layerCount[0], 26, -14, 0.045, 0.15);
  const mid = makeLayer(layerCount[1], 20, -7, 0.07, 0.55);
  const near = makeLayer(layerCount[2], 15, -2, 0.1, 0.9);
  scene.add(far, mid, near);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
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

  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!pageVisible) return;
    const t = clock.getElapsedTime();

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    // Parallaxe : chaque couche dérive à sa propre vitesse selon le scroll —
    // c'est la différence de vitesse entre couches qui crée la profondeur,
    // pas un déplacement de caméra dans le couloir.
    far.position.y = progress * 1.4 + Math.sin(t * 0.05) * 0.1;
    mid.position.y = progress * 3.2 + Math.sin(t * 0.07) * 0.15;
    near.position.y = progress * 5.6 + Math.sin(t * 0.09) * 0.2;
    far.rotation.z = t * 0.01;
    mid.rotation.z = -t * 0.015;
    near.rotation.z = t * 0.02;

    camera.position.x = targetX * 0.5;
    camera.position.y = -targetY * 0.35;
    camera.lookAt(0, 0, -6);
    camera.fov = 50 + progress * 4;
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    frame();
  }
  window.addEventListener("pagehide", () => { if (raf) cancelAnimationFrame(raf); }, { once: true });
}
