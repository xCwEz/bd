"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { PORTE } from "@/lib/porte";
import { rugositeBeton, reliefBeton } from "@/lib/textures";

/* Dimensions de l'atelier, en mètres. */
export const ATELIER = {
  demiLargeur: 7,
  profondeur: 34,
  hauteur: 5.4,
  parvis: 18, // longueur de sol devant la façade
};

const BLANC_FROID = new THREE.Color("#cfe1ff");
const CHAUD = new THREE.Color("#ffb066");

const pion = new THREE.Object3D();

/* ── Sol : béton ciré humide ──────────────────────────────────────────── */

function Sol({ reflets }) {
  const rugosite = useMemo(() => rugositeBeton(512), []);
  const longueur = ATELIER.profondeur + ATELIER.parvis;
  const centreZ = (ATELIER.parvis - ATELIER.profondeur) / 2;

  useLayoutEffect(() => () => rugosite.dispose(), [rugosite]);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, centreZ]} receiveShadow>
      <planeGeometry args={[ATELIER.demiLargeur * 2 + 4, longueur]} />
      {reflets ? (
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1.1}
          mixStrength={22}
          blur={[380, 90]}
          mirror={0.45}
          depthScale={1.1}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.3}
          depthToBlurRatioBias={0.3}
          color="#0a0b0d"
          metalness={0.62}
          roughness={0.75}
          roughnessMap={rugosite}
        />
      ) : (
        <meshStandardMaterial
          color="#0a0b0d"
          metalness={0.3}
          roughness={0.72}
          roughnessMap={rugosite}
        />
      )}
    </mesh>
  );
}

/* ── Coque : murs, plafond, façade percée ─────────────────────────────── */

function Coque({ largeur }) {
  const relief = useMemo(() => reliefBeton(512), []);
  useLayoutEffect(() => () => relief.dispose(), [relief]);

  const beton = (
    <meshStandardMaterial
      color="#191c22"
      roughness={0.94}
      metalness={0.04}
      bumpMap={relief}
      bumpScale={0.16}
    />
  );

  const centreZ = -ATELIER.profondeur / 2;
  const jambage = (ATELIER.demiLargeur * 2 - largeur) / 2;
  const decalageJambage = largeur / 2 + jambage / 2;
  const linteau = ATELIER.hauteur - PORTE.hauteur;

  return (
    <group>
      {/* Murs latéraux */}
      <mesh position={[-ATELIER.demiLargeur, ATELIER.hauteur / 2, centreZ]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[ATELIER.profondeur, ATELIER.hauteur]} />
        {beton}
      </mesh>
      <mesh position={[ATELIER.demiLargeur, ATELIER.hauteur / 2, centreZ]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[ATELIER.profondeur, ATELIER.hauteur]} />
        {beton}
      </mesh>

      {/* Fond de l'atelier */}
      <mesh position={[0, ATELIER.hauteur / 2, -ATELIER.profondeur]}>
        <planeGeometry args={[ATELIER.demiLargeur * 2, ATELIER.hauteur]} />
        {beton}
      </mesh>

      {/* Plafond */}
      <mesh position={[0, ATELIER.hauteur, centreZ]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[ATELIER.demiLargeur * 2, ATELIER.profondeur]} />
        <meshStandardMaterial color="#0c0e11" roughness={0.98} metalness={0} />
      </mesh>

      {/* Façade percée : deux jambages + un linteau */}
      <mesh position={[-decalageJambage, ATELIER.hauteur / 2, 0.2]}>
        <boxGeometry args={[jambage, ATELIER.hauteur, 0.4]} />
        {beton}
      </mesh>
      <mesh position={[decalageJambage, ATELIER.hauteur / 2, 0.2]}>
        <boxGeometry args={[jambage, ATELIER.hauteur, 0.4]} />
        {beton}
      </mesh>
      <mesh position={[0, PORTE.hauteur + linteau / 2, 0.2]}>
        <boxGeometry args={[largeur + 0.05, linteau, 0.4]} />
        {beton}
      </mesh>

      {/* Filet rouge sur chaque jambage : le seul aplat de couleur du cadre. */}
      {[-1, 1].map((cote) => (
        <mesh
          key={cote}
          position={[cote * (largeur / 2 + 0.16), PORTE.hauteur * 0.42, 0.42]}
        >
          <boxGeometry args={[0.05, 0.44, 0.04]} />
          <meshBasicMaterial color="#d90429" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Rampes de néons, instanciées ─────────────────────────────────────── */

function Neons({ largeur }) {
  const tubes = useRef(null);
  const halos = useRef(null);

  // Trois lignes de tubes le long de l'atelier, plus une rampe extérieure
  // au-dessus de la porte.
  const positions = useMemo(() => {
    const liste = [];
    const rangees = [-4.1, 0, 4.1];
    for (let z = -1.6; z > -ATELIER.profondeur + 1; z -= 3.1) {
      rangees.forEach((x) => liste.push([x, ATELIER.hauteur - 0.22, z, 0]));
    }
    // Rampe extérieure : perpendiculaire, juste devant la façade. Son
    // allongement suit la largeur de la porte pour rester à son aplomb.
    const allongement = (largeur * 0.94) / 2.3;
    liste.push([0, PORTE.hauteur + 0.2, 1.0, Math.PI / 2, allongement]);
    liste.push([0, PORTE.hauteur + 0.2, 1.85, Math.PI / 2, allongement]);
    return liste;
  }, [largeur]);

  useLayoutEffect(() => {
    positions.forEach(([x, y, z, rotation, allongement = 1], index) => {
      pion.position.set(x, y, z);
      pion.rotation.set(0, rotation, 0);
      pion.scale.set(1, 1, allongement);
      pion.updateMatrix();
      tubes.current.setMatrixAt(index, pion.matrix);

      // Le halo est le même volume, légèrement gonflé et transparent.
      pion.scale.set(1.9, 1.6, allongement * 1.02);
      pion.updateMatrix();
      halos.current.setMatrixAt(index, pion.matrix);
    });
    tubes.current.instanceMatrix.needsUpdate = true;
    halos.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <group>
      <instancedMesh ref={tubes} args={[undefined, undefined, positions.length]}>
        <boxGeometry args={[0.13, 0.09, 2.3]} />
        <meshStandardMaterial
          color="#eef4ff"
          emissive={BLANC_FROID}
          emissiveIntensity={3.1}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={halos}
        args={[undefined, undefined, positions.length]}
        renderOrder={2}
      >
        <boxGeometry args={[0.13, 0.09, 2.3]} />
        <meshBasicMaterial
          color={BLANC_FROID}
          transparent
          opacity={0.13}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

/* ── Montants métalliques le long des murs ────────────────────────────── */

function Montants() {
  const montants = useRef(null);

  const positions = useMemo(() => {
    const liste = [];
    for (let z = -2.4; z > -ATELIER.profondeur + 1; z -= 4.2) {
      liste.push([-ATELIER.demiLargeur + 0.12, ATELIER.hauteur / 2, z]);
      liste.push([ATELIER.demiLargeur - 0.12, ATELIER.hauteur / 2, z]);
    }
    return liste;
  }, []);

  useLayoutEffect(() => {
    positions.forEach(([x, y, z], index) => {
      pion.position.set(x, y, z);
      pion.rotation.set(0, 0, 0);
      pion.scale.set(1, 1, 1);
      pion.updateMatrix();
      montants.current.setMatrixAt(index, pion.matrix);
    });
    montants.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={montants} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={[0.22, ATELIER.hauteur, 0.5]} />
      <meshStandardMaterial color="#20242b" roughness={0.42} metalness={0.85} />
    </instancedMesh>
  );
}

/* ── Rai de lumière chaude sous la porte ──────────────────────────────── */

function RaiDeLumiere({ etat, largeur }) {
  const bande = useRef(null);
  const lampe = useRef(null);

  useFrame(() => {
    const ferme = 1 - Math.min(1, etat.current.ouverture / 0.32);
    if (bande.current) bande.current.material.opacity = 0.55 * ferme;
    if (lampe.current) lampe.current.intensity = 9 * ferme;
  });

  return (
    <group>
      <mesh
        ref={bande}
        position={[0, 0.035, -0.05]}
        rotation-x={-Math.PI / 2}
        renderOrder={3}
      >
        <planeGeometry args={[largeur - 0.1, 0.9]} />
        <meshBasicMaterial
          color={CHAUD}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={lampe}
        position={[0, 0.3, -0.5]}
        color={CHAUD}
        intensity={9}
        distance={7}
        decay={2}
      />
    </group>
  );
}

/* ── Assemblage ───────────────────────────────────────────────────────── */

export default function Atelier({ etat, reglages, largeur = PORTE.largeur }) {
  return (
    <group>
      <Sol reflets={reglages.reflets} />
      <Coque largeur={largeur} />
      <Neons largeur={largeur} />
      <Montants />
      <RaiDeLumiere etat={etat} largeur={largeur} />

      <ambientLight intensity={0.05} color="#7f8ea6" />

      {/* Éclairage extérieur : la rampe au-dessus de la porte.
          Trois foyers étalés en largeur plutôt qu'un spot unique. Un spotLight
          aurait demandé d'ajouter son `target` au graphe — sans quoi three le
          laisse à l'origine et la porte n'est plus éclairée qu'en rasant. */}
      {[-0.42, -0.21, 0, 0.21, 0.42].map((fraction) => (
        <pointLight
          key={fraction}
          position={[fraction * largeur, PORTE.hauteur + 1.25, 4.3]}
          color={BLANC_FROID}
          intensity={13}
          distance={17}
          decay={1.4}
        />
      ))}

      {/* Éclairage intérieur : quatre foyers le long du couloir. */}
      {[-3, -10, -18, -26].map((z) => (
        <pointLight
          key={z}
          position={[0, ATELIER.hauteur - 0.6, z]}
          color={BLANC_FROID}
          intensity={26}
          distance={17}
          decay={2}
        />
      ))}

      {/* Rebond rouge unique, au fond : l'enseigne de l'atelier. */}
      <pointLight
        position={[3.4, 2.2, -ATELIER.profondeur + 2.5]}
        color="#d90429"
        intensity={14}
        distance={11}
        decay={2}
      />
    </group>
  );
}
