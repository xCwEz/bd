"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Progression de la séquence d'entrée, lue au scroll.
 *
 * La valeur est stockée dans une ref et jamais dans un state : la scène la
 * consomme image par image, un re-rendu React à chaque pixel de scroll serait
 * du gaspillage pur.
 *
 * `actif` à faux (mouvement réduit, ou WebGL absent) fige la progression à 1 :
 * la porte est alors affichée ouverte, sans aucune animation de scroll.
 */
export function useProgressionEntree(refSection, { actif, onProgression }) {
  const progression = useRef(actif ? 0 : 1);
  const rappel = useRef(onProgression);
  rappel.current = onProgression;

  useEffect(() => {
    if (!actif) {
      progression.current = 1;
      rappel.current?.(1);
      return undefined;
    }

    const section = refSection.current;
    if (!section) return undefined;

    gsap.registerPlugin(ScrollTrigger);

    const declencheur = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progression.current = self.progress;
        rappel.current?.(self.progress);
      },
    });

    // ScrollTrigger n'émet `onUpdate` qu'au premier mouvement. Sans cette
    // synchronisation initiale, l'état posé avant la détection d'environnement
    // (progression figée à 1) resterait affiché au chargement.
    progression.current = declencheur.progress;
    rappel.current?.(declencheur.progress);

    // La hauteur des sections dépend des polices : on remesure une fois
    // qu'elles sont posées, sinon les bornes de scrub sont fausses.
    const remesurer = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(remesurer);
    window.addEventListener("load", remesurer);

    return () => {
      window.removeEventListener("load", remesurer);
      declencheur.kill();
    };
  }, [refSection, actif]);

  return progression;
}

/** Interpolation linéaire bornée, utilisée partout dans la scène. */
export function palier(valeur, min, max) {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (valeur - min) / (max - min)));
}

/** Adoucissement en cloche, pour les mouvements de caméra. */
export function adoucir(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Rapprochement image par image, indépendant du framerate. */
export function rapprocher(actuel, cible, vitesse, delta) {
  return actuel + (cible - actuel) * (1 - Math.exp(-vitesse * delta));
}
