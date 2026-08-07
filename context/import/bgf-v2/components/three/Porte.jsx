"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  HAUTEUR_ESCAMOTAGE,
  PORTE,
  abscissePanneau,
  pointDeRail,
} from "@/lib/porte";
import { rugositeTole } from "@/lib/textures";

const pion = new THREE.Object3D();

/* ── Glissières ───────────────────────────────────────────────────────── */

/**
 * Les deux rails latéraux : segment vertical, coude, segment horizontal.
 * Six segments identiques suffisent, on les instancie.
 */
function Glissieres({ largeur }) {
  const rails = useRef(null);

  const segments = useMemo(() => {
    const x = largeur / 2 + 0.09;
    const liste = [];
    [-x, x].forEach((cote) => {
      // Montant vertical, du seuil au linteau
      liste.push({
        position: [cote, PORTE.hauteur / 2, 0.06],
        rotation: [0, 0, 0],
        echelle: [1, PORTE.hauteur, 1],
      });
      // Coude approché par un segment incliné à 45°
      liste.push({
        position: [
          cote,
          PORTE.hauteur + PORTE.rayonCoude * 0.34,
          -PORTE.rayonCoude * 0.34,
        ],
        rotation: [Math.PI / 4, 0, 0],
        echelle: [1, PORTE.rayonCoude * 1.45, 1],
      });
      // Rail horizontal sous le plafond
      liste.push({
        position: [cote, HAUTEUR_ESCAMOTAGE, -PORTE.rayonCoude - 2.6],
        rotation: [Math.PI / 2, 0, 0],
        echelle: [1, 5.4, 1],
      });
    });
    return liste;
  }, [largeur]);

  useLayoutEffect(() => {
    segments.forEach(({ position, rotation, echelle }, index) => {
      pion.position.set(...position);
      pion.rotation.set(...rotation);
      pion.scale.set(...echelle);
      pion.updateMatrix();
      rails.current.setMatrixAt(index, pion.matrix);
    });
    rails.current.instanceMatrix.needsUpdate = true;
  }, [segments]);

  return (
    <instancedMesh ref={rails} args={[undefined, undefined, segments.length]}>
      <boxGeometry args={[0.1, 1, 0.12]} />
      <meshStandardMaterial color="#1b1f25" metalness={0.9} roughness={0.36} />
    </instancedMesh>
  );
}

/* ── Porte sectionnelle ───────────────────────────────────────────────── */

/**
 * Six panneaux instanciés, chacun placé sur le rail à son abscisse propre.
 * `etat.current.ouverture` va de 0 (fermée) à 1 (escamotée sous le plafond).
 */
export default function PorteSectionnelle({ etat, largeur = PORTE.largeur }) {
  const panneaux = useRef(null);
  const joints = useRef(null);

  const tole = useMemo(() => rugositeTole(512), []);
  useLayoutEffect(() => () => tole.dispose(), [tole]);

  useFrame(() => {
    const ouverture = etat.current.ouverture;
    if (!panneaux.current || !joints.current) return;

    for (let i = 0; i < PORTE.nombrePanneaux; i += 1) {
      const s = abscissePanneau(i, ouverture);
      const { y, z, angle } = pointDeRail(s);

      pion.position.set(0, y, z);
      pion.rotation.set(angle, 0, 0);
      pion.scale.set(1, 1, 1);
      pion.updateMatrix();
      panneaux.current.setMatrixAt(i, pion.matrix);

      // Trait d'ombre en bas de chaque panneau : c'est ce creux qui donne
      // la lecture « sectionnelle » plutôt que « plaque unique ».
      pion.position.set(0, y, z);
      pion.rotation.set(angle, 0, 0);
      pion.translateY(-PORTE.hauteurPanneau / 2 + 0.012);
      pion.translateZ(0.005);
      pion.updateMatrix();
      joints.current.setMatrixAt(i, pion.matrix);
    }

    panneaux.current.instanceMatrix.needsUpdate = true;
    joints.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Glissieres largeur={largeur} />

      <instancedMesh
        ref={panneaux}
        args={[undefined, undefined, PORTE.nombrePanneaux]}
        castShadow
      >
        <boxGeometry
          args={[largeur, PORTE.hauteurPanneau - PORTE.jeu, PORTE.epaisseur]}
        />
        <meshStandardMaterial
          color="#191d24"
          metalness={0.78}
          roughness={0.62}
          roughnessMap={tole}
          envMapIntensity={1.15}
        />
      </instancedMesh>

      <instancedMesh ref={joints} args={[undefined, undefined, PORTE.nombrePanneaux]}>
        <boxGeometry args={[largeur, 0.026, PORTE.epaisseur + 0.014]} />
        <meshStandardMaterial color="#050607" roughness={1} metalness={0} />
      </instancedMesh>
    </group>
  );
}
