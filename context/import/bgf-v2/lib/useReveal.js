"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Révélation à l'entrée dans le viewport, une seule fois.
 * L'observateur se déconnecte au premier déclenchement : pas de rejeu au
 * scroll inverse, conformément à la direction artistique.
 */
export function useReveal({ seuil = 0.25, marge = "0px 0px -12% 0px" } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return undefined;
    }

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      { threshold: seuil, rootMargin: marge }
    );

    observateur.observe(element);
    return () => observateur.disconnect();
  }, [seuil, marge]);

  return [ref, visible];
}

/**
 * Suit l'intersection d'un élément en continu — utilisé pour suspendre le
 * rendu d'un canvas dès qu'il quitte le viewport.
 */
export function useDansLeViewport(marge = "20% 0px 20% 0px") {
  const ref = useRef(null);
  const [croise, setCroise] = useState(false);
  const [ongletActif, setOngletActif] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setCroise(true);
      return undefined;
    }

    const observateur = new IntersectionObserver(
      ([entree]) => setCroise(entree.isIntersecting),
      { rootMargin: marge }
    );
    observateur.observe(element);

    const surVisibilite = () =>
      setOngletActif(document.visibilityState !== "hidden");
    surVisibilite();
    document.addEventListener("visibilitychange", surVisibilite);

    return () => {
      observateur.disconnect();
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [marge]);

  return [ref, croise && ongletActif];
}
