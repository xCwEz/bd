/**
 * Géométrie de rail d'une porte de garage sectionnelle.
 *
 * Une sectionnelle ne pivote pas : chaque panneau suit un rail qui monte à la
 * verticale, décrit un quart de cercle au linteau, puis file à l'horizontale
 * sous le plafond. On paramètre ce rail par l'abscisse curviligne `s`, ce qui
 * permet de placer les N panneaux à la file en n'animant qu'une seule valeur.
 */

export const PORTE = {
  largeur: 6.4, // valeur de référence ; la largeur réelle suit le format d'écran
  hauteur: 4.6,
  nombrePanneaux: 6,
  epaisseur: 0.16,
  rayonCoude: 0.7, // dégagement disponible entre le linteau et le plafond
};

/** Épaisseur cumulée des deux jambages visibles de part et d'autre. */
export const JAMBAGES = 0.9;

/**
 * Largeur de porte adaptée au format du viewport.
 *
 * Une sectionnelle réelle est plus large que haute, mais sur un écran de
 * téléphone ce format couché réduit la porte à un bandeau : elle n'occupe plus
 * qu'un tiers de la hauteur et l'effet « je suis devant la porte » disparaît.
 * On suit donc le format de l'écran, borné des deux côtés — porte de box en
 * portrait, porte d'atelier en paysage.
 */
export function largeurPorte(aspect) {
  const visee = aspect * PORTE.hauteur * 1.02;
  return Math.min(9.4, Math.max(3.3, visee));
}

/**
 * Recul de caméra qui met la porte et ses jambages exactement à la largeur du
 * cadre, quel que soit le format. La hauteur suit : elle occupe alors de 53 %
 * de l'écran en portrait étroit à près de 90 % en paysage.
 */
export function reculPourCadrer(aspect, largeur, fovVerticalDeg = 46) {
  const fovV = (fovVerticalDeg * Math.PI) / 180;
  const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
  return (largeur + JAMBAGES) / 2 / Math.tan(fovH / 2);
}

PORTE.hauteurPanneau = PORTE.hauteur / PORTE.nombrePanneaux;
PORTE.jeu = 0.012; // trait d'ombre entre deux panneaux

/**
 * Le coude ne commence qu'au linteau, pas avant : porte fermée, les six
 * panneaux doivent être strictement verticaux et remplir l'ouverture de 0 à
 * `hauteur`. Faire démarrer la courbe plus bas inclinait le panneau supérieur
 * alors que la porte était censée être close.
 */
const DEBUT_COUDE = PORTE.hauteur;
const LONGUEUR_COUDE = (Math.PI / 2) * PORTE.rayonCoude;

/** Hauteur du rail horizontal, sous le plafond. */
export const HAUTEUR_ESCAMOTAGE = PORTE.hauteur + PORTE.rayonCoude;

/**
 * Course totale : de quoi amener le panneau le plus bas jusqu'au segment
 * horizontal, sans quoi la porte « ouverte » laisserait encore un panneau
 * en travers du coude.
 */
PORTE.course = PORTE.hauteur + LONGUEUR_COUDE;

/**
 * Position et inclinaison d'un point du rail à l'abscisse `s`.
 * `s` = 0 correspond au seuil, au ras du sol, panneau vertical face au visiteur.
 * Renvoie { y, z, angle } : `angle` est la rotation autour de X, de 0 (vertical)
 * à π/2 (à plat sous le plafond).
 */
export function pointDeRail(s) {
  if (s <= DEBUT_COUDE) {
    return { y: s, z: 0, angle: 0 };
  }
  if (s <= DEBUT_COUDE + LONGUEUR_COUDE) {
    const theta = (s - DEBUT_COUDE) / PORTE.rayonCoude;
    return {
      y: DEBUT_COUDE + Math.sin(theta) * PORTE.rayonCoude,
      z: -PORTE.rayonCoude + Math.cos(theta) * PORTE.rayonCoude,
      angle: theta,
    };
  }
  const reste = s - DEBUT_COUDE - LONGUEUR_COUDE;
  return {
    y: HAUTEUR_ESCAMOTAGE,
    z: -PORTE.rayonCoude - reste,
    angle: Math.PI / 2,
  };
}

/**
 * Abscisse curviligne du centre du panneau `index` pour une ouverture donnée.
 * `ouverture` va de 0 (fermée) à 1 (entièrement escamotée).
 */
export function abscissePanneau(index, ouverture) {
  const base = ouverture * PORTE.course;
  return base + (index + 0.5) * PORTE.hauteurPanneau;
}
