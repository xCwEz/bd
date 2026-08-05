import * as THREE from "https://unpkg.com/three@0.169.0/build/three.module.js";
import { reduceMotion } from "./demos.js";

/**
 * Concept "Chapitres" : pas de voyage continu — trois scènes 3D distinctes
 * (une par section), la caméra et l'opacité de chaque scène étant animées
 * en fondu quand on change de chapitre (déclenché par IntersectionObserver,
 * pas par la position exacte du scroll). C'est une succession de tableaux
 * curatés, pas un couloir traversé en continu.
 */
const canvas = document.getElementById("scene");
if (canvas) {
  const mm = (q) => window.matchMedia && window.matchMedia(q).matches;
  const mobile = mm("(max-width: 860px)") || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 2));
  renderer.setClearColor(0x090a12, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40);

  function makeMaterial(mixT) {
    const uniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uCore: { value: new THREE.Color(0x181a2c) },
      uCyan: { value: new THREE.Color(0x6fe0e0) },
      uViolet: { value: new THREE.Color(0xb9a6ff) },
      uMix: { value: mixT },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal; varying vec3 vViewDir;
        void main() {
          vec3 pos = position + normal * sin(uTime * 0.7 + position.x * 2.0) * 0.01;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uCore; uniform vec3 uCyan; uniform vec3 uViolet; uniform float uOpacity; uniform float uMix;
        varying vec3 vNormal; varying vec3 vViewDir;
        void main() {
          vec3 N = normalize(vNormal); vec3 V = normalize(vViewDir);
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0);
          vec3 col = mix(uCore, mix(uCyan, uViolet, uMix), smoothstep(0.1, 0.9, fresnel));
          float a = clamp(0.15 + fresnel * 0.85, 0.0, 1.0) * uOpacity;
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    return { material, uniforms };
  }

  // --- Chapitre 0 (hero) : halo d'éclats en anneau -------------------------
  const group0 = new THREE.Group();
  const m0 = makeMaterial(0.2);
  const shardGeo = new THREE.IcosahedronGeometry(0.55, 0);
  const shardCount = mobile ? 8 : 14;
  for (let i = 0; i < shardCount; i++) {
    const mesh = new THREE.Mesh(shardGeo, m0.material);
    const a = (i / shardCount) * Math.PI * 2;
    mesh.position.set(Math.cos(a) * 3.4, Math.sin(a) * 1.9, Math.sin(a * 2) * 0.6);
    group0.add(mesh);
  }
  scene.add(group0);

  // --- Chapitre 1 (manifeste) : tore unique ---------------------------------
  const group1 = new THREE.Group();
  const m1 = makeMaterial(0.6);
  const torus = new THREE.Mesh(new THREE.TorusKnotGeometry(1.5, 0.42, mobile ? 90 : 160, 16), m1.material);
  group1.add(torus);
  scene.add(group1);

  // --- Chapitre 2 (cartes) : grille de cubes flottants ----------------------
  const group2 = new THREE.Group();
  const m2 = makeMaterial(0.85);
  const boxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  const cols = mobile ? 4 : 6, rows = 3;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const mesh = new THREE.Mesh(boxGeo, m2.material);
      mesh.position.set((x - (cols - 1) / 2) * 1.3, (y - (rows - 1) / 2) * 1.3, 0);
      mesh.userData.phase = Math.random() * Math.PI * 2;
      group2.add(mesh);
    }
  }
  scene.add(group2);

  const chapters = [
    { group: group0, m: m0, camPos: new THREE.Vector3(0, 0, 7.5), camLook: new THREE.Vector3(0, 0, 0) },
    { group: group1, m: m1, camPos: new THREE.Vector3(1.6, 0.4, 6), camLook: new THREE.Vector3(0, 0, 0) },
    { group: group2, m: m2, camPos: new THREE.Vector3(0, 1.8, 8.5), camLook: new THREE.Vector3(0, -0.3, 0) },
  ];
  camera.position.copy(chapters[0].camPos);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  let active = 0;
  const sections = Array.from(document.querySelectorAll("[data-chapter]"));
  if ("IntersectionObserver" in window && sections.length) {
    const ratios = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
      let best = null, bestRatio = 0;
      ratios.forEach((ratio, el) => { if (ratio > bestRatio) { bestRatio = ratio; best = el; } });
      if (best) active = Number(best.dataset.chapter);
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach((el) => io.observe(el));
  }

  const lookTarget = chapters[0].camLook.clone();
  let pageVisible = true;
  document.addEventListener("visibilitychange", () => { pageVisible = !document.hidden; });

  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!pageVisible) return;
    const t = clock.getElapsedTime();

    chapters.forEach((ch, i) => {
      ch.m.uniforms.uTime.value = t;
      const targetOpacity = i === active ? 1 : 0;
      ch.m.uniforms.uOpacity.value += (targetOpacity - ch.m.uniforms.uOpacity.value) * 0.06;
      const targetScale = i === active ? 1 : 0.85;
      ch.group.scale.setScalar(ch.group.scale.x + (targetScale - ch.group.scale.x) * 0.06);
    });

    group0.rotation.z = t * 0.06;
    torus.rotation.x = t * 0.12;
    torus.rotation.y = t * 0.08;
    group2.children.forEach((mesh) => {
      mesh.rotation.x = t * 0.3 + mesh.userData.phase;
      mesh.rotation.y = t * 0.22 + mesh.userData.phase;
      mesh.position.z = Math.sin(t * 0.6 + mesh.userData.phase) * 0.3;
    });

    const target = chapters[active];
    camera.position.lerp(target.camPos, 0.035);
    lookTarget.lerp(target.camLook, 0.035);
    camera.lookAt(lookTarget);

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    chapters.forEach((ch, i) => { ch.m.uniforms.uOpacity.value = i === 0 ? 1 : 0; });
    renderer.render(scene, camera);
  } else {
    frame();
  }
  window.addEventListener("pagehide", () => { if (raf) cancelAnimationFrame(raf); }, { once: true });
}
