"use client";

import * as THREE from "three";
import { panoramaAtelier } from "./textures";

/**
 * Le panorama d'atelier est filtré une seule fois par contexte WebGL, puis
 * partagé. Les cinq visuels de services vivent chacun dans une scène séparée
 * (drei `View` crée une scène virtuelle par vue) : sans ce partage, on
 * paierait cinq fois la génération PMREM pour un résultat identique.
 */
const registre = new WeakMap();

export function acquerirEnvironnement(gl, resolution = 512) {
  let entree = registre.get(gl);

  if (!entree) {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const source = panoramaAtelier(resolution);
    const cible = pmrem.fromEquirectangular(source);
    source.dispose();
    pmrem.dispose();
    entree = { texture: cible.texture, cible, compteur: 0 };
    registre.set(gl, entree);
  }

  entree.compteur += 1;
  return entree.texture;
}

export function relacherEnvironnement(gl) {
  const entree = registre.get(gl);
  if (!entree) return;
  entree.compteur -= 1;
  if (entree.compteur <= 0) {
    entree.cible.dispose();
    registre.delete(gl);
  }
}
