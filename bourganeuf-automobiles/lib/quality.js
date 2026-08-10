"use client";

import { useEffect, useState } from "react";

/**
 * Détection d'environnement, faite une seule fois au chargement.
 *
 * Trois niveaux :
 *   low    → pas de volumétrique, pas de depth of field, pas de particules
 *   medium → volumétrique allégé, particules réduites, pas de depth of field
 *   high   → tout
 *
 * Rien ici ne touche au DOM textuel : le contenu est déjà rendu quand cette
 * détection s'exécute.
 */

export const QUALITE = { BASSE: "low", MOYENNE: "medium", HAUTE: "high" };

/** Le contexte WebGL est-il réellement obtenable ? */
export function testerWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    const perdu = gl.getExtension("WEBGL_lose_context");
    if (perdu) perdu.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Renvoie la chaîne du GPU quand le pilote l'expose, sinon "". */
function lireRenderer() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const nom = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    return String(nom || "").toLowerCase();
  } catch {
    return "";
  }
}

function detecterQualite() {
  const coeurs = navigator.hardwareConcurrency || 4;
  const memoire = navigator.deviceMemory || 4;
  const tactile = window.matchMedia("(pointer: coarse)").matches;
  const petitEcran = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = lireRenderer();

  // GPU logiciels ou intégrés anciens : on descend d'office.
  const logiciel =
    renderer.includes("swiftshader") ||
    renderer.includes("llvmpipe") ||
    renderer.includes("software") ||
    renderer.includes("microsoft basic");
  if (logiciel) return QUALITE.BASSE;

  if (coeurs <= 4 || memoire <= 4) return QUALITE.BASSE;
  if (tactile || petitEcran || coeurs <= 6) return QUALITE.MOYENNE;
  return QUALITE.HAUTE;
}

const ETAT_INITIAL = {
  pret: false,
  webgl: true,
  qualite: QUALITE.MOYENNE,
  mobile: false,
  mouvementReduit: false,
  dpr: 1,
};

/**
 * Hook unique consommé par toute l'expérience. Tant que `pret` est faux,
 * aucune scène 3D ne se monte : l'UI et le texte s'affichent d'abord.
 */
export function useEnvironnement() {
  const [etat, setEtat] = useState(ETAT_INITIAL);

  useEffect(() => {
    const mqMouvement = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 860px), (pointer: coarse)");

    const mesurer = () =>
      setEtat({
        pret: true,
        webgl: testerWebGL(),
        qualite: detecterQualite(),
        mobile: mqMobile.matches,
        mouvementReduit: mqMouvement.matches,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });

    mesurer();

    const surChangement = () => mesurer();
    mqMouvement.addEventListener("change", surChangement);
    mqMobile.addEventListener("change", surChangement);
    return () => {
      mqMouvement.removeEventListener("change", surChangement);
      mqMobile.removeEventListener("change", surChangement);
    };
  }, []);

  return etat;
}

/** Raccourcis de lisibilité côté scène. */
export function reglages(qualite, mobile) {
  const basse = qualite === QUALITE.BASSE;
  const haute = qualite === QUALITE.HAUTE && !mobile;
  return {
    volumetrique: !basse && !mobile,
    profondeurDeChamp: haute,
    particules: !basse,
    nombreParticules: haute ? 900 : 320,
    reflets: !basse,
    ombres: haute,
    bloom: !basse,
  };
}
