"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ATELIER } from "./Atelier";
import { grainPoussiere } from "@/lib/textures";

const pion = new THREE.Object3D();

/* ── Bruit GLSL partagé ───────────────────────────────────────────────── */

const BRUIT_GLSL = /* glsl */ `
  float hache(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float bruit(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hache(i), hache(i + vec2(1.0, 0.0)), u.x),
      mix(hache(i + vec2(0.0, 1.0)), hache(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += bruit(p) * a;
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`;

/* ── Fumée volumétrique : nappes horizontales ─────────────────────────── */

const VERTEX_NAPPE = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_NAPPE = /* glsl */ `
  uniform float uTemps;
  uniform float uDensite;
  uniform vec3 uCouleur;
  varying vec2 vUv;

  ${BRUIT_GLSL}

  void main() {
    vec2 p = vUv * vec2(3.0, 7.0);
    float n = fbm(p + vec2(uTemps * 0.035, -uTemps * 0.018));
    n = smoothstep(0.36, 0.92, n);

    // Extinction sur les bords, pour qu'aucune arête de plan ne se voie.
    float bordX = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
    float bordY = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

    float alpha = n * bordX * bordY * uDensite;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uCouleur, alpha);
  }
`;

function Nappes({ densite }) {
  const nappes = useRef(null);
  const materiau = useRef(null);

  const hauteurs = useMemo(() => [0.55, 1.35, 2.3, 3.4, 4.5], []);

  const uniforms = useMemo(
    () => ({
      uTemps: { value: 0 },
      uDensite: { value: densite },
      uCouleur: { value: new THREE.Color("#9fb6d8") },
    }),
    [densite]
  );

  useLayoutEffect(() => {
    hauteurs.forEach((y, index) => {
      pion.position.set(0, y, -ATELIER.profondeur / 2 + 3);
      pion.rotation.set(-Math.PI / 2, 0, index * 0.7);
      pion.scale.set(1, 1, 1);
      pion.updateMatrix();
      nappes.current.setMatrixAt(index, pion.matrix);
    });
    nappes.current.instanceMatrix.needsUpdate = true;
  }, [hauteurs]);

  useFrame((_, delta) => {
    if (materiau.current) materiau.current.uniforms.uTemps.value += delta;
  });

  return (
    <instancedMesh
      ref={nappes}
      args={[undefined, undefined, hauteurs.length]}
      renderOrder={4}
      frustumCulled={false}
    >
      <planeGeometry args={[ATELIER.demiLargeur * 2, ATELIER.profondeur]} />
      <shaderMaterial
        ref={materiau}
        vertexShader={VERTEX_NAPPE}
        fragmentShader={FRAGMENT_NAPPE}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

/* ── Faisceaux sous les rampes de néons ───────────────────────────────── */

const FRAGMENT_FAISCEAU = /* glsl */ `
  uniform float uTemps;
  uniform vec3 uCouleur;
  varying vec2 vUv;

  ${BRUIT_GLSL}

  void main() {
    // vUv.y = 1 au niveau du tube, 0 au sol : le faisceau s'éteint en bas.
    float chute = pow(vUv.y, 2.2);
    float bord = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float grain = 0.72 + 0.28 * fbm(vec2(vUv.x * 7.0, vUv.y * 3.0 - uTemps * 0.06));
    float alpha = chute * bord * grain * 0.11;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uCouleur, alpha);
  }
`;

function Faisceaux() {
  const faisceaux = useRef(null);
  const materiau = useRef(null);

  const instances = useMemo(() => {
    const liste = [];
    const rangees = [-4.1, 0, 4.1];
    rangees.forEach((x) => {
      // Deux plans parallèles légèrement écartés par rangée : le faisceau
      // garde de l'épaisseur au lieu de se réduire à une lame.
      liste.push({ x: x - 0.34 });
      liste.push({ x: x + 0.34 });
    });
    return liste;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTemps: { value: 0 },
      uCouleur: { value: new THREE.Color("#cfe1ff") },
    }),
    []
  );

  useLayoutEffect(() => {
    instances.forEach(({ x }, index) => {
      pion.position.set(x, ATELIER.hauteur - 1.85, -ATELIER.profondeur / 2 + 2);
      pion.rotation.set(0, Math.PI / 2, 0);
      pion.scale.set(1, 1, 1);
      pion.updateMatrix();
      faisceaux.current.setMatrixAt(index, pion.matrix);
    });
    faisceaux.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  useFrame((_, delta) => {
    if (materiau.current) materiau.current.uniforms.uTemps.value += delta;
  });

  return (
    <instancedMesh
      ref={faisceaux}
      args={[undefined, undefined, instances.length]}
      renderOrder={5}
      frustumCulled={false}
    >
      <planeGeometry args={[ATELIER.profondeur - 2, 3.7]} />
      <shaderMaterial
        ref={materiau}
        vertexShader={VERTEX_NAPPE}
        fragmentShader={FRAGMENT_FAISCEAU}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

/* ── Poussière dans les faisceaux ─────────────────────────────────────── */

const VERTEX_POUSSIERE = /* glsl */ `
  uniform float uTemps;
  uniform float uTaille;
  attribute float aGraine;
  attribute float aEchelle;
  varying float vEclat;

  void main() {
    vec3 p = position;

    // Dérive lente vers le haut, plus une oscillation propre à chaque grain.
    float montee = mod(p.y + uTemps * (0.05 + aGraine * 0.09), 5.2) + 0.15;
    p.y = montee;
    p.x += sin(uTemps * 0.22 + aGraine * 24.0) * 0.28;
    p.z += cos(uTemps * 0.17 + aGraine * 17.0) * 0.28;

    // Un grain n'est visible que sous une rampe de néons.
    float distanceRampe = min(min(abs(p.x + 4.1), abs(p.x)), abs(p.x - 4.1));
    vEclat = smoothstep(1.5, 0.15, distanceRampe) * smoothstep(0.0, 1.4, p.y);

    vec4 vue = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * vue;
    gl_PointSize = uTaille * aEchelle * (10.0 / max(0.001, -vue.z));
  }
`;

const FRAGMENT_POUSSIERE = /* glsl */ `
  uniform sampler2D uGrain;
  uniform vec3 uCouleur;
  varying float vEclat;

  void main() {
    float masque = texture2D(uGrain, gl_PointCoord).a;
    float alpha = masque * vEclat * 0.42;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uCouleur, alpha);
  }
`;

function Poussiere({ nombre }) {
  const materiau = useRef(null);
  const grain = useMemo(() => grainPoussiere(64), []);

  const geometrie = useMemo(() => {
    const positions = new Float32Array(nombre * 3);
    const graines = new Float32Array(nombre);
    const echelles = new Float32Array(nombre);

    for (let i = 0; i < nombre; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * (ATELIER.demiLargeur * 2 - 1.2);
      positions[i * 3 + 1] = Math.random() * 5.2;
      positions[i * 3 + 2] = 2 - Math.random() * (ATELIER.profondeur - 2);
      graines[i] = Math.random();
      echelles[i] = 0.4 + Math.random() * 1.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aGraine", new THREE.BufferAttribute(graines, 1));
    geo.setAttribute("aEchelle", new THREE.BufferAttribute(echelles, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.6, -14), 40);
    return geo;
  }, [nombre]);

  const uniforms = useMemo(
    () => ({
      uTemps: { value: 0 },
      uTaille: { value: 5.5 },
      uGrain: { value: grain },
      uCouleur: { value: new THREE.Color("#e8f1ff") },
    }),
    [grain]
  );

  useLayoutEffect(
    () => () => {
      geometrie.dispose();
      grain.dispose();
    },
    [geometrie, grain]
  );

  useFrame((_, delta) => {
    if (materiau.current) materiau.current.uniforms.uTemps.value += delta;
  });

  return (
    <points geometry={geometrie} renderOrder={6} frustumCulled={false}>
      <shaderMaterial
        ref={materiau}
        vertexShader={VERTEX_POUSSIERE}
        fragmentShader={FRAGMENT_POUSSIERE}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Assemblage ───────────────────────────────────────────────────────── */

/**
 * En qualité basse, ce composant ne rend rien : ni volumétrique, ni
 * particules. C'est le premier levier de performance de la scène.
 */
export default function Atmosphere({ reglages }) {
  return (
    <group>
      {reglages.volumetrique ? <Nappes densite={0.5} /> : null}
      {reglages.volumetrique ? <Faisceaux /> : null}
      {reglages.particules ? <Poussiere nombre={reglages.nombreParticules} /> : null}
    </group>
  );
}
