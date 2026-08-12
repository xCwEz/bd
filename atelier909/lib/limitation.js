/**
 * Limitation des tentatives de connexion au back-office, en mémoire.
 *
 * Deux compteurs, parce qu'un seul ne suffit pas :
 *
 * - par appelant, pour ne pas punir tout le monde à cause d'une seule
 *   source ;
 * - **global**, parce que l'identifiant d'appelant vient d'un en-tête
 *   (`X-Forwarded-For`) que l'attaquant contrôle : il lui suffit d'en
 *   changer à chaque essai pour obtenir un compteur neuf. Vérifié — 40
 *   tentatives depuis 40 adresses passaient sans être bloquées. Le
 *   plafond global rend cette rotation inutile.
 *
 * Le back-office n'a qu'un seul utilisateur : quelques échecs par quart
 * d'heure suffisent largement à un usage légitime, et l'opérateur peut
 * toujours redémarrer l'application pour se débloquer lui-même.
 *
 * Limite connue : compteurs propres au processus, remis à zéro par un
 * redémarrage et non partagés entre instances. À déplacer dans un stockage
 * partagé si l'app tourne un jour en plusieurs exemplaires.
 */

const parAppelant = new Map();
let global = null;

const FENETRE_MS = 15 * 60 * 1000;
const MAX_PAR_APPELANT = 8;
const MAX_GLOBAL = 20;

function compteur(entree) {
  if (!entree || Date.now() > entree.expire) return null;
  return entree;
}

export function tropDeTentatives(cle) {
  const g = compteur(global);
  if (g && g.nombre >= MAX_GLOBAL) return true;

  const e = compteur(parAppelant.get(cle));
  if (!e) {
    parAppelant.delete(cle);
    return false;
  }
  return e.nombre >= MAX_PAR_APPELANT;
}

export function enregistrerEchec(cle) {
  const maintenant = Date.now();

  const g = compteur(global);
  global = g ? { ...g, nombre: g.nombre + 1 } : { nombre: 1, expire: maintenant + FENETRE_MS };

  const e = compteur(parAppelant.get(cle));
  parAppelant.set(cle, e ? { ...e, nombre: e.nombre + 1 } : { nombre: 1, expire: maintenant + FENETRE_MS });

  // Purge opportuniste : sans elle, une rotation d'adresses ferait enfler
  // la table indéfiniment.
  if (parAppelant.size > 1000) {
    for (const [k, v] of parAppelant) if (!compteur(v)) parAppelant.delete(k);
  }
}

/** Une connexion réussie efface l'ardoise, y compris le plafond global. */
export function reinitialiser(cle) {
  parAppelant.delete(cle);
  global = null;
}

/**
 * Identifiant d'appelant. À ne jamais considérer comme fiable : il provient
 * d'en-têtes que le client peut fabriquer si l'app n'est pas derrière un
 * reverse proxy qui les réécrit. Sert à ne pas bloquer tout le monde d'un
 * coup, jamais de seule barrière.
 */
export function cleAppelant(requete) {
  const entete = requete.headers.get("x-forwarded-for") || requete.headers.get("x-real-ip");
  return entete?.split(",")[0]?.trim() || "inconnu";
}
