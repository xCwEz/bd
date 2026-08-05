import * as THREE from "https://unpkg.com/three@0.169.0/build/three.module.js";
import { reduceMotion, onScrollProgress } from "./demos.js";

/**
 * Concept "Sculpture" : un seul objet centerpiece, caméra totalement fixe.
 * Toute l'animation vient de l'objet lui-même — il se déforme (amplitude
 * pilotée par le scroll) puis migre du centre du hero vers un coin en
 * "totem" persistant pendant que le contenu défile. Pas de couloir,
 * pas de caméra qui avance : l'immersion est sculpturale, pas cinétique.
 */
const canvas = document.getElementById("scene");
if (canvas) {
  const mm = (q) => window.matchMedia && window.matchMedia(q).matches;
  const mobile = mm("(max-width: 860px)") || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
  const detail = mobile ? 2 : 3;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 2));
  renderer.setClearColor(0x090a12, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.12 },
    uCore: { value: new THREE.Color(0x181a2c) },
    uCyan: { value: new THREE.Color(0x6fe0e0) },
    uViolet: { value: new THREE.Color(0xb9a6ff) },
  };

  const vertexShader = `
    uniform float uTime;
    uniform float uAmp;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vec3 pos = position;
      float n = sin(pos.x * 2.6 + uTime * 0.8) * cos(pos.y * 2.6 - uTime * 0.6) * sin(pos.z * 2.6 + uTime * 0.5);
      pos += normal * n * uAmp;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const fragmentShader = `
    uniform vec3 uCore;
    uniform vec3 uCyan;
    uniform vec3 uViolet;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vViewDir);
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 1.8);
      vec3 col = mix(uCore, uCyan, smoothstep(0.05, 0.6, fresnel));
      col = mix(col, uViolet, smoothstep(0.65, 1.0, fresnel));
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const geometry = new THREE.IcosahedronGeometry(2, detail);
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const rim = new THREE.PointLight(0x6fe0e0, 2, 30);
  rim.position.set(-4, 2, 4);
  scene.add(rim);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  let progress = 0;
  let lastProgress = 0;
  onScrollProgress((p) => { progress = p; });

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  let pageVisible = true;
  document.addEventListener("visibilitychange", () => { pageVisible = !document.hidden; });

  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!pageVisible) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    // L'amplitude de déformation culmine au milieu de la page — l'objet
    // "réagit" plus fort au manifeste qu'au repos du hero ou du footer.
    const anchorT = clamp01((progress - 0.05) / 0.35);
    uniforms.uAmp.value = 0.1 + Math.sin(clamp01(progress) * Math.PI) * 0.45;

    // Migration centre → coin haut-droit en "totem" persistant.
    mesh.position.x = lerp(0, 3.1, anchorT);
    mesh.position.y = lerp(0, 1.7, anchorT);
    mesh.position.z = lerp(0, -1.5, anchorT);
    const s = lerp(1, 0.34, anchorT);
    mesh.scale.setScalar(s);

    const delta = progress - lastProgress;
    lastProgress = progress;
    mesh.rotation.y += 0.0025 + Math.abs(delta) * 2.2;
    mesh.rotation.x += 0.0012;

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    uniforms.uTime.value = 1;
    renderer.render(scene, camera);
  } else {
    frame();
  }
  window.addEventListener("pagehide", () => { if (raf) cancelAnimationFrame(raf); }, { once: true });
}
