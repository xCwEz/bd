"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const pion = new THREE.Object3D();

/* ── 01 Entretien : disque de frein rainuré ───────────────────────────── */

function Disque() {
  const groupe = useRef(null);
  const rainures = useRef(null);
  const boulons = useRef(null);

  useLayoutEffect(() => {
    // Rainures obliques fraisées dans la piste de freinage.
    for (let i = 0; i < 14; i += 1) {
      const angle = (i / 14) * Math.PI * 2;
      pion.position.set(Math.cos(angle) * 0.78, 0.031, Math.sin(angle) * 0.78);
      pion.rotation.set(0, -angle + 0.42, 0);
      pion.scale.set(1, 1, 1);
      pion.updateMatrix();
      rainures.current.setMatrixAt(i, pion.matrix);
    }
    rainures.current.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      pion.position.set(Math.cos(angle) * 0.34, 0.06, Math.sin(angle) * 0.34);
      pion.rotation.set(0, 0, 0);
      pion.scale.set(1, 1, 1);
      pion.updateMatrix();
      boulons.current.setMatrixAt(i, pion.matrix);
    }
    boulons.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    if (groupe.current) groupe.current.rotation.y += delta * 0.28;
  });

  return (
    <group ref={groupe} rotation={[0.95, 0, 0.25]}>
      {/* Piste de freinage */}
      <mesh>
        <cylinderGeometry args={[1.15, 1.15, 0.11, 72]} />
        <meshStandardMaterial color="#6e737b" metalness={1} roughness={0.36} />
      </mesh>
      {/* Bol central */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.5, 0.52, 0.22, 48]} />
        <meshStandardMaterial color="#3a3f47" metalness={0.95} roughness={0.46} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.14, 32]} />
        <meshStandardMaterial color="#16191f" metalness={0.8} roughness={0.7} />
      </mesh>

      <instancedMesh ref={rainures} args={[undefined, undefined, 14]} position={[0, 0.025, 0]}>
        <boxGeometry args={[0.42, 0.02, 0.045]} />
        <meshStandardMaterial color="#1c1f25" metalness={0.9} roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={boulons} args={[undefined, undefined, 5]}>
        <cylinderGeometry args={[0.055, 0.055, 0.09, 6]} />
        <meshStandardMaterial color="#9aa1ab" metalness={1} roughness={0.28} />
      </instancedMesh>
    </group>
  );
}

/* ── 02 Réparation : écrou et douille ─────────────────────────────────── */

function Ecrou() {
  const groupe = useRef(null);
  const douille = useRef(null);

  useFrame((etatTrois, delta) => {
    if (!groupe.current) return;
    groupe.current.rotation.y += delta * 0.34;
    if (douille.current) {
      // La douille descend, engage l'écrou, remonte : un cycle de serrage.
      const t = (Math.sin(etatTrois.clock.elapsedTime * 0.6) + 1) / 2;
      douille.current.position.y = 0.62 + t * 0.55;
    }
  });

  return (
    <group ref={groupe} rotation={[0.35, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.72, 0.72, 0.46, 6]} />
        <meshStandardMaterial color="#7d838c" metalness={1} roughness={0.31} />
      </mesh>
      {/* Alésage taraudé */}
      <mesh>
        <cylinderGeometry args={[0.38, 0.38, 0.52, 32, 1, true]} />
        <meshStandardMaterial
          color="#2a2e35"
          metalness={0.9}
          roughness={0.62}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Tige filetée traversante */}
      <mesh>
        <cylinderGeometry args={[0.33, 0.33, 2.6, 24]} />
        <meshStandardMaterial color="#4b5057" metalness={1} roughness={0.44} />
      </mesh>

      <group ref={douille} position={[0, 0.9, 0]}>
        <mesh>
          <cylinderGeometry args={[0.9, 0.9, 0.9, 6]} />
          <meshStandardMaterial color="#23272e" metalness={0.95} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.62, 24]} />
          <meshStandardMaterial color="#31363e" metalness={0.95} roughness={0.34} />
        </mesh>
      </group>
    </group>
  );
}

/* ── 03 Diagnostic : trame d'oscilloscope ─────────────────────────────── */

const VERTEX_ONDE = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_ONDE = /* glsl */ `
  uniform float uTemps;
  varying vec2 vUv;

  float trait(float distance, float epaisseur) {
    return smoothstep(epaisseur, 0.0, abs(distance));
  }

  void main() {
    vec2 uv = vUv;
    vec3 couleur = vec3(0.015, 0.018, 0.022);

    // Grille de mesure
    vec2 grille = abs(fract(uv * vec2(14.0, 8.0)) - 0.5);
    float lignes = trait(grille.x, 0.02) + trait(grille.y, 0.03);
    couleur += vec3(0.09, 0.11, 0.14) * lignes;

    // Signal : deux harmoniques plus un défaut intermittent
    float x = uv.x * 6.2831;
    float defaut = step(0.72, fract(uTemps * 0.21)) * sin(x * 11.0) * 0.09;
    float signal =
      sin(x * 2.0 - uTemps * 1.4) * 0.16 +
      sin(x * 5.0 - uTemps * 2.1) * 0.06 +
      defaut;
    float courbe = trait(uv.y - 0.5 - signal, 0.011);
    couleur += vec3(0.82, 0.9, 1.0) * courbe * 1.5;
    couleur += vec3(0.4, 0.55, 0.8) * trait(uv.y - 0.5 - signal, 0.06) * 0.28;

    // Tête de balayage, seul rouge de la scène
    float tete = fract(uTemps * 0.16);
    float balayage = trait(uv.x - tete, 0.0035);
    couleur += vec3(0.85, 0.02, 0.16) * balayage * 1.6;

    // Bords assombris, pour que le plan ne montre pas ses arêtes
    float cadre =
      smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x) *
      smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);

    gl_FragColor = vec4(couleur * cadre, 1.0);
  }
`;

function Onde() {
  const materiau = useRef(null);
  const groupe = useRef(null);

  const uniforms = useMemo(() => ({ uTemps: { value: 0 } }), []);

  useFrame((etatTrois, delta) => {
    if (materiau.current) materiau.current.uniforms.uTemps.value += delta;
    if (groupe.current) {
      groupe.current.rotation.y = Math.sin(etatTrois.clock.elapsedTime * 0.32) * 0.22;
      groupe.current.rotation.x = -0.16;
    }
  });

  return (
    <group ref={groupe}>
      <mesh>
        <planeGeometry args={[3, 1.9]} />
        <shaderMaterial
          ref={materiau}
          vertexShader={VERTEX_ONDE}
          fragmentShader={FRAGMENT_ONDE}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
      {/* Bâti de l'écran */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[3.24, 2.14, 0.12]} />
        <meshStandardMaterial color="#1a1d23" metalness={0.85} roughness={0.42} />
      </mesh>
    </group>
  );
}

/* ── 04 Carrosserie : panneau galbé ───────────────────────────────────── */

/**
 * Un élément de carrosserie n'est pas un plan : il est bombé dans les deux
 * sens et cassé par une nervure. On déforme une grille dense, ce qui suffit
 * à faire courir le reflet comme sur une aile réelle.
 */
function Aile() {
  const groupe = useRef(null);

  const geometrie = useMemo(() => {
    const geo = new THREE.PlaneGeometry(3.1, 2, 96, 64);
    const position = geo.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const u = x / 1.55;
      const v = y / 1;
      const galbe = Math.cos(u * 1.15) * 0.34 + Math.cos(v * 1.25) * 0.2;
      // Nervure de style : une cassure nette qui traverse le panneau.
      const nervure = 0.11 * Math.exp(-Math.pow((y - x * 0.24 + 0.1) * 3.4, 2));
      position.setZ(i, galbe + nervure);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useLayoutEffect(() => () => geometrie.dispose(), [geometrie]);

  useFrame((etatTrois) => {
    if (!groupe.current) return;
    const t = etatTrois.clock.elapsedTime;
    groupe.current.rotation.y = Math.sin(t * 0.28) * 0.55;
    groupe.current.rotation.x = -0.18 + Math.sin(t * 0.19) * 0.09;
  });

  return (
    <group ref={groupe}>
      <mesh geometry={geometrie}>
        <meshPhysicalMaterial
          color="#0e1014"
          metalness={0.72}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.045}
          envMapIntensity={1.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ── 05 Préparation : perle de céramique ──────────────────────────────── */

function Goutte() {
  const groupe = useRef(null);
  const perles = useRef(null);

  useLayoutEffect(() => {
    // Des perles d'eau de tailles variées, comme sur un vernis protégé.
    for (let i = 0; i < 22; i += 1) {
      const angle = i * 2.399; // spirale de Vogel : répartition sans grumeau
      const rayon = 0.32 * Math.sqrt(i) * 0.62;
      const echelle = 0.06 + (i % 5) * 0.022;
      pion.position.set(Math.cos(angle) * rayon, echelle * 0.62, Math.sin(angle) * rayon);
      pion.rotation.set(0, 0, 0);
      pion.scale.set(echelle, echelle * 0.74, echelle);
      pion.updateMatrix();
      perles.current.setMatrixAt(i, pion.matrix);
    }
    perles.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((etatTrois) => {
    if (!groupe.current) return;
    const t = etatTrois.clock.elapsedTime;
    groupe.current.rotation.y = t * 0.16;
    groupe.current.rotation.x = 0.62 + Math.sin(t * 0.24) * 0.08;
  });

  return (
    <group ref={groupe}>
      {/* Élément de tôle vernie */}
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.5, 72]} />
        <meshPhysicalMaterial
          color="#0b0c0f"
          metalness={0.55}
          roughness={0.09}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={1.9}
        />
      </mesh>

      <instancedMesh ref={perles} args={[undefined, undefined, 22]}>
        <sphereGeometry args={[1, 20, 16]} />
        {/* Pas de `transmission` ici : la passe de réfraction coûte un rendu
            complet de la scène, pour un gain invisible sur des perles de
            deux millimètres. Un vernis très lisse suffit à faire la goutte. */}
        <meshPhysicalMaterial
          color="#dfe9f7"
          metalness={0}
          roughness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.02}
          ior={1.33}
          transparent
          opacity={0.72}
          envMapIntensity={2.4}
        />
      </instancedMesh>
    </group>
  );
}

/* ── Éclairage commun aux cinq visuels ────────────────────────────────── */

function Rampe() {
  return (
    <group>
      <ambientLight intensity={0.35} color="#8d9bb3" />
      {/* Néon principal, très haut et froid */}
      <directionalLight position={[2.4, 4, 3]} intensity={2.4} color="#dce9ff" />
      {/* Contre-jour, qui détache la silhouette du fond noir */}
      <directionalLight position={[-3, 1.2, -2.5]} intensity={1.5} color="#7f93b5" />
      {/* Unique touche chaude, au ras : le reflet de l'atelier */}
      <pointLight position={[0, -1.6, 2]} intensity={7} distance={7} color="#ffb679" />
    </group>
  );
}

const VISUELS = {
  disque: Disque,
  ecrou: Ecrou,
  onde: Onde,
  aile: Aile,
  goutte: Goutte,
};

export default function VisuelService({ type }) {
  const Contenu = VISUELS[type];
  if (!Contenu) return null;
  return (
    <group>
      <Rampe />
      <Contenu />
    </group>
  );
}
