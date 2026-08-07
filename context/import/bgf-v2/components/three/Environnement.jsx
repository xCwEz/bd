"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { acquerirEnvironnement, relacherEnvironnement } from "@/lib/envPartage";

/**
 * Applique l'environnement de reflets à la scène courante.
 *
 * Monté dans le canvas racine, il équipe la scène principale ; monté dans une
 * `View` de drei, il équipe la scène virtuelle de cette vue. Dans les deux
 * cas la texture PMREM sous-jacente est la même.
 */
export default function EnvironnementProcedural({
  resolution = 1024,
  intensite = 0.55,
}) {
  const gl = useThree((etat) => etat.gl);
  const scene = useThree((etat) => etat.scene);

  useEffect(() => {
    scene.environment = acquerirEnvironnement(gl, resolution);
    scene.environmentIntensity = intensite;

    return () => {
      scene.environment = null;
      relacherEnvironnement(gl);
    };
  }, [gl, scene, resolution, intensite]);

  return null;
}
