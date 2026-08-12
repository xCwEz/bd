/**
 * Limitation de fréquence en mémoire, propre au processus. Suffisante pour
 * ralentir une attaque par force brute sur le mot de passe unique du
 * back-office ; elle ne survit pas à un redémarrage et ne se partage pas
 * entre instances — à remplacer par un stockage partagé si l'app venait à
 * tourner sur plusieurs processus.
 */
const tentatives = new Map();

const FENETRE_MS = 15 * 60 * 1000;
const MAX_TENTATIVES = 8;

export function tropDeTentatives(cle) {
  const entree = tentatives.get(cle);
  if (!entree) return false;
  if (Date.now() > entree.expire) {
    tentatives.delete(cle);
    return false;
  }
  return entree.nombre >= MAX_TENTATIVES;
}

export function enregistrerEchec(cle) {
  const entree = tentatives.get(cle);
  if (!entree || Date.now() > entree.expire) {
    tentatives.set(cle, { nombre: 1, expire: Date.now() + FENETRE_MS });
    return;
  }
  entree.nombre += 1;
}

export function reinitialiser(cle) {
  tentatives.delete(cle);
}

/** Identifiant d'appelant : IP transmise par le reverse proxy, à défaut une valeur globale. */
export function cleAppelant(requete) {
  const entete = requete.headers.get("x-forwarded-for") || requete.headers.get("x-real-ip");
  return entete?.split(",")[0]?.trim() || "inconnu";
}
