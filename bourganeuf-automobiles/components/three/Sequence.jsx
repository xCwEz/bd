"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { adoucir, palier, rapprocher } from "@/lib/scroll";
import { PORTE, reculPourCadrer } from "@/lib/porte";

/* Bornes de la séquence, en fraction des 300vh de scroll. */
const OUVERTURE = [0.06, 0.62];
const AVANCEE = [0.55, 1];

const cible = new THREE.Vector3();

/**
 * Traduit la progression de scroll en état de scène.
 *
 * Sur mobile, la porte ne suit pas le scrub : elle passe par deux paliers
 * francs (entrouverte, puis ouverte) que l'on rejoint par amortissement.
 * C'est plus lisible au pouce, et beaucoup moins coûteux à animer.
 */
export function Pilote({ etat, progression, mobile, mouvementReduit }) {
  useFrame((_, delta) => {
    const p = progression.current;
    const pas = Math.min(delta, 0.05);

    if (mouvementReduit) {
      etat.current.ouverture = 1;
      etat.current.avancee = 1;
      etat.current.progression = 1;
      return;
    }

    let ouvertureVisee;
    if (mobile) {
      ouvertureVisee = p < 0.28 ? 0 : p < 0.62 ? 0.55 : 1;
    } else {
      ouvertureVisee = adoucir(palier(p, OUVERTURE[0], OUVERTURE[1]));
    }

    etat.current.ouverture = rapprocher(
      etat.current.ouverture,
      ouvertureVisee,
      mobile ? 4.5 : 12,
      pas
    );
    etat.current.avancee = rapprocher(
      etat.current.avancee,
      adoucir(palier(p, AVANCEE[0], AVANCEE[1])),
      10,
      pas
    );
    etat.current.progression = p;
  });

  return null;
}

/**
 * Caméra : immobile devant la façade tant que la porte s'ouvre, puis
 * translation franche dans l'atelier. Aucun contrôle utilisateur, aucune
 * dépendance au survol.
 */
const FOV_BASE = 46;

export function CameraRig({ etat, mouvementReduit, largeur = PORTE.largeur }) {
  const camera = useThree((s) => s.camera);
  const taille = useThree((s) => s.size);
  const horloge = useRef(0);
  const recul = useRef(11.5);

  // Recul de départ : la porte et ses jambages occupent exactement la largeur
  // du cadre. C'est ce qui donne le « je suis devant la porte » plutôt qu'une
  // porte posée au milieu d'un grand vide noir.
  useEffect(() => {
    const aspect = Math.max(0.3, taille.width / Math.max(1, taille.height));
    recul.current = reculPourCadrer(aspect, largeur, FOV_BASE);

    camera.fov = FOV_BASE;
    camera.near = 0.1;
    camera.far = 120;
    camera.position.set(0, PORTE.hauteur * 0.5, recul.current);
    camera.updateProjectionMatrix();
  }, [camera, largeur, taille.width, taille.height]);

  useFrame((_, delta) => {
    horloge.current += delta;
    const a = etat.current.avancee;

    // Respiration très légère : sans elle, le plan fixe paraît mort.
    const souffle = mouvementReduit ? 0 : Math.sin(horloge.current * 0.45) * 0.035;
    const derive = mouvementReduit ? 0 : Math.sin(horloge.current * 0.31) * 0.06;

    camera.position.set(
      derive * (1 - a * 0.6),
      THREE.MathUtils.lerp(PORTE.hauteur * 0.5, 1.54, a) + souffle,
      THREE.MathUtils.lerp(recul.current, -9.5, a)
    );

    cible.set(
      0,
      THREE.MathUtils.lerp(PORTE.hauteur * 0.52, 1.85, a),
      THREE.MathUtils.lerp(0, -26, a)
    );
    camera.lookAt(cible);

    const fov = THREE.MathUtils.lerp(FOV_BASE, 41, a);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * En mouvement réduit la boucle de rendu est en « demand » : rien ne bouge,
 * donc rien ne doit tourner. On force alors quelques images au montage et à
 * chaque redimensionnement, sinon le canvas resterait vide.
 */
export function Invalidation({ actif }) {
  const invalider = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!actif) return undefined;

    let compteur = 0;
    let id;
    const pousser = () => {
      invalider();
      compteur += 1;
      if (compteur < 8) id = requestAnimationFrame(pousser);
    };
    id = requestAnimationFrame(pousser);

    const surRedimensionnement = () => invalider();
    window.addEventListener("resize", surRedimensionnement);
    window.addEventListener("orientationchange", surRedimensionnement);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", surRedimensionnement);
      window.removeEventListener("orientationchange", surRedimensionnement);
    };
  }, [actif, invalider]);

  return null;
}
