import { readFile, writeFile } from "fs/promises";
import path from "path";
import { listerProduits, enregistrerProduits } from "@/lib/produits";
import { DUREE_RESERVATION_HEURES, FRAIS_REMISE, SEUIL_VERIFICATION_ID, genererCodeRemise } from "@/lib/config";

const CHEMIN_DONNEES = path.join(process.cwd(), "data", "commandes.json");

export class ErreurMetier extends Error {
  constructor(message) {
    super(message);
    this.name = "ErreurMetier";
  }
}

/**
 * Verrou en mémoire, propre au processus : sérialise toutes les opérations
 * qui lisent-modifient-écrivent produits.json / commandes.json. Sans lui,
 * deux requêtes concurrentes peuvent lire le même stock avant que l'une des
 * deux ait écrit sa décrémentation — exactement la double réservation que la
 * règle métier n°2 interdit. Suffisant pour un seul processus Node ; ne
 * protégerait pas plusieurs instances derrière un load-balancer.
 */
let verrou = Promise.resolve();
function serialise(tache) {
  return (...args) => {
    const resultat = verrou.then(() => tache(...args), () => tache(...args));
    verrou = resultat.then(
      () => {},
      () => {}
    );
    return resultat;
  };
}

async function listerCommandesBrut() {
  const brut = await readFile(CHEMIN_DONNEES, "utf-8");
  return JSON.parse(brut);
}

async function enregistrerCommandesBrut(commandes) {
  await writeFile(CHEMIN_DONNEES, JSON.stringify(commandes, null, 2) + "\n", "utf-8");
}

/**
 * Restaure le stock des paniers dont la réservation de 12h a expiré et les
 * marque « expiree » (règle métier n°3). Appelée en tête de chaque opération
 * touchant au panier — pas de tâche planifiée réelle derrière ce fichier
 * JSON, la purge est donc paresseuse (vérifiée à la prochaine requête).
 */
export const purgerReservationsExpirees = serialise(async function purgerReservationsExpirees() {
  const commandes = await listerCommandesBrut();
  const maintenant = Date.now();
  const aExpirer = commandes.filter(
    (c) => c.statut === "panier" && c.reservationExpire && new Date(c.reservationExpire).getTime() < maintenant
  );
  if (aExpirer.length === 0) return [];

  const produits = await listerProduits();
  for (const commande of aExpirer) {
    for (const ligne of commande.lignes) {
      const produit = produits.find((p) => p.ref === ligne.ref);
      const variante = produit?.variantes.find((v) => v.taille === ligne.taille);
      if (variante) variante.stock += 1;
    }
    commande.statut = "expiree";
    commande.lignesExpirees = commande.lignes;
    commande.lignes = [];
  }
  await enregistrerProduits(produits);
  await enregistrerCommandesBrut(commandes);
  return aExpirer;
});

export async function listerCommandes() {
  await purgerReservationsExpirees();
  return listerCommandesBrut();
}

export async function trouverPanierActif(telegramUserId) {
  await purgerReservationsExpirees();
  const commandes = await listerCommandesBrut();
  return commandes.find((c) => c.telegramUserId === telegramUserId && c.statut === "panier") ?? null;
}

export function calculerTotaux(commande) {
  const sousTotal = commande.lignes.reduce((somme, l) => somme + l.prixUnitaire, 0);
  const frais = commande.modeRemise ? FRAIS_REMISE[commande.modeRemise] ?? 0 : 0;
  return { sousTotal, frais, total: sousTotal + frais };
}

export const ajouterAuPanier = serialise(async function ajouterAuPanier(telegramUserId, ref, taille) {
  await purgerReservationsExpireesSansVerrou();

  const produits = await listerProduits();
  const produit = produits.find((p) => p.ref === ref && p.statut === "en_ligne");
  if (!produit) throw new ErreurMetier("Cette pièce n'est plus disponible.");
  const variante = produit.variantes.find((v) => v.taille === taille);
  if (!variante || variante.stock <= 0) {
    throw new ErreurMetier("Cette taille vient d'être réservée par quelqu'un d'autre.");
  }

  variante.stock -= 1;
  await enregistrerProduits(produits);

  const commandes = await listerCommandesBrut();
  let commande = commandes.find((c) => c.telegramUserId === telegramUserId && c.statut === "panier");
  if (!commande) {
    commande = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      telegramUserId,
      statut: "panier",
      lignes: [],
      modeRemise: null,
      creneau: null,
      codeRemise: null,
      reservationExpire: null,
      dateCreation: new Date().toISOString(),
      dateConfirmation: null,
      dateRemise: null,
    };
    commandes.push(commande);
  }

  commande.lignes.push({
    ref: produit.ref,
    taille,
    nom: produit.nom,
    marque: produit.marque,
    prixUnitaire: variante.prix,
  });
  commande.reservationExpire = new Date(Date.now() + DUREE_RESERVATION_HEURES * 60 * 60 * 1000).toISOString();

  await enregistrerCommandesBrut(commandes);
  return commande;
});

export const retirerDuPanier = serialise(async function retirerDuPanier(telegramUserId, indexLigne) {
  await purgerReservationsExpireesSansVerrou();

  const commandes = await listerCommandesBrut();
  const commande = commandes.find((c) => c.telegramUserId === telegramUserId && c.statut === "panier");
  if (!commande) throw new ErreurMetier("Panier introuvable.");
  const ligne = commande.lignes[indexLigne];
  if (!ligne) throw new ErreurMetier("Article introuvable.");

  const produits = await listerProduits();
  const produit = produits.find((p) => p.ref === ligne.ref);
  const variante = produit?.variantes.find((v) => v.taille === ligne.taille);
  if (variante) variante.stock += 1;
  await enregistrerProduits(produits);

  commande.lignes.splice(indexLigne, 1);
  if (commande.lignes.length === 0) commande.reservationExpire = null;
  await enregistrerCommandesBrut(commandes);
  return commande;
});

export const definirModeRemise = serialise(async function definirModeRemise(telegramUserId, modeRemise) {
  await purgerReservationsExpireesSansVerrou();
  const commandes = await listerCommandesBrut();
  const commande = commandes.find((c) => c.telegramUserId === telegramUserId && c.statut === "panier");
  if (!commande) throw new ErreurMetier("Panier introuvable.");
  if (!Object.keys(FRAIS_REMISE).includes(modeRemise)) throw new ErreurMetier("Mode de remise inconnu.");
  commande.modeRemise = modeRemise;
  await enregistrerCommandesBrut(commandes);
  return commande;
});

export const confirmerRendezVous = serialise(async function confirmerRendezVous(telegramUserId, creneau) {
  await purgerReservationsExpireesSansVerrou();
  const commandes = await listerCommandesBrut();
  const commande = commandes.find((c) => c.telegramUserId === telegramUserId && c.statut === "panier");
  if (!commande || commande.lignes.length === 0) throw new ErreurMetier("Panier vide.");
  if (!commande.modeRemise) throw new ErreurMetier("Choisissez un mode de remise.");
  if (!creneau) throw new ErreurMetier("Choisissez un créneau.");

  const { total } = calculerTotaux(commande);
  if (total >= SEUIL_VERIFICATION_ID) {
    throw new ErreurMetier(
      "La vérification d'identité au-delà de 500 € n'est pas encore disponible. Cette commande ne peut pas être confirmée pour l'instant."
    );
  }

  commande.statut = "confirmee";
  commande.creneau = creneau;
  commande.codeRemise = genererCodeRemise();
  commande.dateConfirmation = new Date().toISOString();
  await enregistrerCommandesBrut(commandes);
  return commande;
});

export async function commandesUtilisateur(telegramUserId) {
  await purgerReservationsExpirees();
  const commandes = await listerCommandesBrut();
  return commandes
    .filter((c) => c.telegramUserId === telegramUserId && ["confirmee", "remise"].includes(c.statut))
    .sort((a, b) => new Date(b.dateConfirmation) - new Date(a.dateConfirmation));
}

export async function commandesConfirmees() {
  await purgerReservationsExpirees();
  const commandes = await listerCommandesBrut();
  return commandes
    .filter((c) => ["confirmee", "remise"].includes(c.statut))
    .sort((a, b) => new Date(b.dateConfirmation) - new Date(a.dateConfirmation));
}

export async function membreDepuis(telegramUserId) {
  const commandes = await listerCommandesBrut();
  const lesSiennes = commandes.filter((c) => c.telegramUserId === telegramUserId);
  if (lesSiennes.length === 0) return null;
  return lesSiennes.reduce((min, c) => (c.dateCreation < min ? c.dateCreation : min), lesSiennes[0].dateCreation);
}

export const marquerCommandeRemise = serialise(async function marquerCommandeRemise(id) {
  const commandes = await listerCommandesBrut();
  const commande = commandes.find((c) => c.id === id);
  if (!commande) throw new ErreurMetier("Commande introuvable.");
  commande.statut = "remise";
  commande.dateRemise = new Date().toISOString();
  await enregistrerCommandesBrut(commandes);
  return commande;
});

// Version non verrouillée, à usage interne uniquement : les fonctions déjà
// sérialisées ci-dessus l'appellent depuis l'intérieur de leur propre
// section critique — elles ne doivent pas re-entrer dans la file d'attente
// du verrou, ce qui provoquerait un blocage (deadlock).
async function purgerReservationsExpireesSansVerrou() {
  const commandes = await listerCommandesBrut();
  const maintenant = Date.now();
  const aExpirer = commandes.filter(
    (c) => c.statut === "panier" && c.reservationExpire && new Date(c.reservationExpire).getTime() < maintenant
  );
  if (aExpirer.length === 0) return [];

  const produits = await listerProduits();
  for (const commande of aExpirer) {
    for (const ligne of commande.lignes) {
      const produit = produits.find((p) => p.ref === ligne.ref);
      const variante = produit?.variantes.find((v) => v.taille === ligne.taille);
      if (variante) variante.stock += 1;
    }
    commande.statut = "expiree";
    commande.lignesExpirees = commande.lignes;
    commande.lignes = [];
  }
  await enregistrerProduits(produits);
  await enregistrerCommandesBrut(commandes);
  return aExpirer;
}
