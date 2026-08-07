"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Atelier from "./Atelier";
import Atmosphere from "./Atmosphere";
import PorteSectionnelle from "./Porte";
import EnvironnementProcedural from "./Environnement";
import Effets from "./Effets";
import { CameraRig, Invalidation, Pilote } from "./Sequence";
import { reglages as calculerReglages } from "@/lib/quality";
import { largeurPorte } from "@/lib/porte";

/**
 * Largeur de porte suivie au format d'écran. Recalculée au redimensionnement
 * et à la rotation, jamais pendant le scroll : la géométrie n'est reconstruite
 * qu'aux changements de cadre.
 */
function useLargeurPorte() {
  const [largeur, setLargeur] = useState(() =>
    typeof window === "undefined"
      ? 6.4
      : largeurPorte(window.innerWidth / window.innerHeight)
  );

  useEffect(() => {
    const mesurer = () => {
      const suivante = largeurPorte(window.innerWidth / window.innerHeight);
      // Seuil d'hystérésis : sans lui, la barre d'adresse mobile qui se replie
      // reconstruirait la porte à chaque pixel gagné.
      setLargeur((actuelle) =>
        Math.abs(actuelle - suivante) > 0.25 ? suivante : actuelle
      );
    };
    mesurer();
    window.addEventListener("resize", mesurer);
    window.addEventListener("orientationchange", mesurer);
    return () => {
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("orientationchange", mesurer);
    };
  }, []);

  return largeur;
}

/**
 * Corrige un défaut connu de React Three Fiber : si le canvas est monté dans
 * un conteneur dont la taille n'est pas encore stabilisée, la mesure initiale
 * échoue et le rendu reste bloqué en 300×150. Quelques événements de
 * redimensionnement échelonnés suffisent à débloquer la mesure.
 */
function useReveilDuCanvas(actif) {
  useEffect(() => {
    if (!actif) return undefined;
    const identifiants = [0, 60, 220, 700].map((delai) =>
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), delai)
    );
    return () => identifiants.forEach(window.clearTimeout);
  }, [actif]);
}

export default function SceneHero({
  progression,
  actif,
  qualite,
  mobile,
  mouvementReduit,
  dpr,
}) {
  const etat = useRef({ ouverture: 0, avancee: 0, progression: 0 });
  const reglages = calculerReglages(qualite, mobile);

  // Le mouvement réduit coupe tout ce qui bouge de lui-même.
  const reglagesFinaux = mouvementReduit
    ? { ...reglages, volumetrique: false, particules: false, profondeurDeChamp: false }
    : reglages;

  const largeur = useLargeurPorte();

  useReveilDuCanvas(true);

  const boucle = mouvementReduit ? "demand" : actif ? "always" : "never";

  return (
    <Canvas
      className="hero__canvas"
      dpr={dpr}
      frameloop={boucle}
      shadows={false}
      gl={{
        antialias: !mobile,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 46, near: 0.1, far: 120, position: [0, 1.72, 11.5] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = new THREE.Color("#040405");
        scene.fog = new THREE.FogExp2("#060709", 0.028);
      }}
    >
      <Suspense fallback={null}>
        <EnvironnementProcedural resolution={mobile ? 512 : 1024} />
        <Pilote
          etat={etat}
          progression={progression}
          mobile={mobile}
          mouvementReduit={mouvementReduit}
        />
        <CameraRig
          etat={etat}
          mouvementReduit={mouvementReduit}
          largeur={largeur}
        />
        <Invalidation actif={mouvementReduit} />

        <Atelier etat={etat} reglages={reglagesFinaux} largeur={largeur} />
        <PorteSectionnelle etat={etat} largeur={largeur} />
        <Atmosphere reglages={reglagesFinaux} />

        <Effets reglages={reglagesFinaux} />
      </Suspense>
    </Canvas>
  );
}
