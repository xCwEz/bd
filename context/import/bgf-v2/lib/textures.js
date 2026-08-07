"use client";

import * as THREE from "three";

/**
 * Toutes les textures du site sont peintes au canvas à l'exécution.
 * Aucun fichier bitmap n'est chargé, aucun chemin d'image n'existe.
 */

/* ── Bruit de valeur + fbm, en JS ─────────────────────────────────────── */

function melange(a, b, t) {
  return a + (b - a) * t;
}

function lisser(t) {
  return t * t * (3 - 2 * t);
}

function hash2(x, y, graine) {
  const n = Math.sin(x * 127.1 + y * 311.7 + graine * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function bruitValeur(x, y, graine) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = lisser(x - xi);
  const yf = lisser(y - yi);
  const a = hash2(xi, yi, graine);
  const b = hash2(xi + 1, yi, graine);
  const c = hash2(xi, yi + 1, graine);
  const d = hash2(xi + 1, yi + 1, graine);
  return melange(melange(a, b, xf), melange(c, d, xf), yf);
}

function fbm(x, y, octaves = 5, graine = 1) {
  let valeur = 0;
  let amplitude = 0.5;
  let frequence = 1;
  let total = 0;
  for (let i = 0; i < octaves; i += 1) {
    valeur += bruitValeur(x * frequence, y * frequence, graine + i) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequence *= 2;
  }
  return valeur / total;
}

function nouveauCanvas(taille) {
  const canvas = document.createElement("canvas");
  canvas.width = taille;
  canvas.height = taille;
  return canvas;
}

function finaliser(canvas, { repeat = 1, srgb = false } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/* ── Béton ciré humide ────────────────────────────────────────────────── */

/**
 * Carte de rugosité du sol : le béton ciré n'est jamais uniforme. Les zones
 * sombres de la carte sont les flaques — lisses, donc très réfléchissantes.
 */
export function rugositeBeton(taille = 512) {
  const canvas = nouveauCanvas(taille);
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(taille, taille);

  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      const u = (x / taille) * 6;
      const v = (y / taille) * 6;
      const grain = fbm(u * 8, v * 8, 4, 3);
      const flaques = fbm(u * 1.1, v * 1.1, 4, 11);
      // Flaques : large tache basse fréquence qui fait chuter la rugosité.
      const humidite = Math.pow(Math.max(0, flaques - 0.42) * 2.4, 1.6);
      const rugosite = Math.min(1, Math.max(0.04, 0.42 + grain * 0.32 - humidite));
      const octet = Math.round(rugosite * 255);
      const i = (y * taille + x) * 4;
      image.data[i] = octet;
      image.data[i + 1] = octet;
      image.data[i + 2] = octet;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finaliser(canvas, { repeat: 3 });
}

/** Carte de relief très douce : le béton reste plan, il n'est pas rugueux. */
export function reliefBeton(taille = 512) {
  const canvas = nouveauCanvas(taille);
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(taille, taille);

  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      const u = (x / taille) * 6;
      const v = (y / taille) * 6;
      const h = fbm(u * 14, v * 14, 3, 7);
      const octet = Math.round((0.5 + (h - 0.5) * 0.35) * 255);
      const i = (y * taille + x) * 4;
      image.data[i] = octet;
      image.data[i + 1] = octet;
      image.data[i + 2] = octet;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finaliser(canvas, { repeat: 3 });
}

/* ── Tôle laquée des panneaux de porte ────────────────────────────────── */

/**
 * Rugosité de la tôle : micro-grain + nervures horizontales très légères,
 * ce qui suffit à casser le reflet plat d'un métal parfait.
 */
export function rugositeTole(taille = 512) {
  const canvas = nouveauCanvas(taille);
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(taille, taille);

  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      const u = x / taille;
      const v = y / taille;
      // Grain très fin et de faible amplitude : à basse fréquence, le bruit
      // de valeur dessine des cellules qui lisent comme un appareillage de
      // briques au lieu d'une tôle laquée.
      const grain = fbm(u * 210, v * 190, 3, 17);
      // Brossage horizontal, signature d'un panneau de sectionnelle.
      const brossage = Math.sin(v * Math.PI * 96) * 0.5 + 0.5;
      const rugosite = 0.44 + (grain - 0.5) * 0.09 + brossage * 0.05;
      const octet = Math.round(Math.min(1, Math.max(0, rugosite)) * 255);
      const i = (y * taille + x) * 4;
      image.data[i] = octet;
      image.data[i + 1] = octet;
      image.data[i + 2] = octet;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finaliser(canvas, { repeat: 2 });
}

/* ── Sprite de poussière ──────────────────────────────────────────────── */

/** Petit disque dégradé, seul « bitmap » du site — dessiné en 6 lignes. */
export function grainPoussiere(taille = 64) {
  const canvas = nouveauCanvas(taille);
  const ctx = canvas.getContext("2d");
  const r = taille / 2;
  const degrade = ctx.createRadialGradient(r, r, 0, r, r, r);
  degrade.addColorStop(0, "rgba(255,255,255,1)");
  degrade.addColorStop(0.35, "rgba(255,255,255,0.35)");
  degrade.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, taille, taille);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ── Environnement de reflets ─────────────────────────────────────────── */

/**
 * Panorama équirectangulaire maison : plafond sombre, rampes de néons
 * blancs froids, murs béton, sol noir. Filtré par PMREM, il donne aux
 * matériaux métalliques des reflets crédibles sans le moindre HDRI externe.
 */
export function panoramaAtelier(largeur = 1024) {
  const hauteur = largeur / 2;
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext("2d");

  // Fond : plafond noir en haut, béton au milieu, sol très sombre en bas.
  const fond = ctx.createLinearGradient(0, 0, 0, hauteur);
  fond.addColorStop(0, "#050505");
  fond.addColorStop(0.34, "#0d0f12");
  fond.addColorStop(0.52, "#22262c");
  fond.addColorStop(0.62, "#14171b");
  fond.addColorStop(1, "#030303");
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, largeur, hauteur);

  // Rampes de néons : bandes horizontales très lumineuses près du plafond.
  const rampes = [0.14, 0.2, 0.27];
  rampes.forEach((position, index) => {
    const y = hauteur * position;
    const epaisseur = hauteur * (0.014 - index * 0.003);
    const halo = ctx.createLinearGradient(0, y - epaisseur * 8, 0, y + epaisseur * 8);
    halo.addColorStop(0, "rgba(198,220,255,0)");
    halo.addColorStop(0.5, `rgba(206,226,255,${0.5 - index * 0.13})`);
    halo.addColorStop(1, "rgba(198,220,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, y - epaisseur * 8, largeur, epaisseur * 16);

    // Tubes segmentés le long de la rampe.
    const nombre = 7 + index * 2;
    for (let i = 0; i < nombre; i += 1) {
      const largeurTube = largeur / nombre;
      const x = i * largeurTube + largeurTube * 0.12;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y - epaisseur / 2, largeurTube * 0.76, epaisseur);
    }
  });

  // Trace rouge unique : une enseigne au fond de l'atelier, discrète.
  const enseigne = ctx.createRadialGradient(
    largeur * 0.72,
    hauteur * 0.44,
    0,
    largeur * 0.72,
    hauteur * 0.44,
    largeur * 0.06
  );
  enseigne.addColorStop(0, "rgba(217,4,41,0.55)");
  enseigne.addColorStop(1, "rgba(217,4,41,0)");
  ctx.fillStyle = enseigne;
  ctx.fillRect(largeur * 0.6, hauteur * 0.3, largeur * 0.25, hauteur * 0.3);

  // Salissures du béton, pour que les reflets ne soient jamais parfaits.
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * largeur;
    const y = hauteur * 0.36 + Math.random() * hauteur * 0.4;
    const r = 8 + Math.random() * 70;
    const tache = ctx.createRadialGradient(x, y, 0, x, y, r);
    const clair = Math.random() > 0.5;
    tache.addColorStop(0, clair ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)");
    tache.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tache;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
