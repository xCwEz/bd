"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import * as THREE from "three";
import { Invalidation } from "./Sequence";

/**
 * Canvas unique de la section Services. Il ne contient aucun objet : chaque
 * `EmplacementVisuel` y projette sa propre fenêtre de rendu. Le canvas est
 * masqué et sa boucle coupée dès que la section quitte le viewport.
 */
export default function CanvasServices({ actif, dpr, mobile, mouvementReduit }) {
  // Même parade que sur le héros : forcer une mesure de taille au montage.
  useEffect(() => {
    const identifiants = [0, 60, 220, 700].map((delai) =>
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), delai)
    );
    return () => identifiants.forEach(window.clearTimeout);
  }, []);

  const boucle = mouvementReduit ? "demand" : actif ? "always" : "never";

  return (
    <div
      className={`services__canvas${actif ? " services__canvas--actif" : ""}`}
      aria-hidden="true"
    >
      <Canvas
        dpr={dpr}
        frameloop={boucle}
        gl={{
          antialias: !mobile,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.setClearAlpha(0);
        }}
      >
        <Invalidation actif={mouvementReduit} />
        <View.Port />
      </Canvas>
    </div>
  );
}
