import path from "path";
import { lireJson, ecrireJsonAtomique } from "@/lib/stockage-json";
import { listerProduits, enregistrerProduits } from "@/lib/produits";
import {
  DUREE_RESERVATION_HEURES,
  DELAI_TRAITEMENT_VERIFICATION_HEURES,
  FRAIS_REMISE,
  SEUIL_VERIFICATION_ID,
  genererCodeRemise,
} from "@/lib/config";
import { chiffrerEtEnregistrer, supprimerPhoto } from "@/lib/identite";

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
  return lireJson(CHEMIN_DONNEES);
}

async function enregistrerCommandesBrut(commandes) {
  await ecrireJsonAtomique(CHEMIN_DONNEES, commandes);
}

/**
 * Restaure le stock des paniers dont la réservation de 12h a expiré et les
 * marque « expiree » (règle métier n°3). Appelée en tête de chaque opération
 * touchant au panier — pas de tâche planifiée réelle derrière ce fichier
 * JSON, la purge est donc paresseuse (vérifiée à la prochaine requête).
 */
export const purgerReservationsExpirees = serialise(async function purgerReservationsExpirees() {
  return purgerReservationsExpireesSansVerrou();
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

export async function trouverCommande(id) {
  const commandes = await listerCommandesBrut();
  return commandes.find((c) => c.id === id) ?? null;
}

export function calculerTotaux(commande) {
  const sousTotal = commande.lignes.reduce((somme, l) => somme + l.prixUnitaire, 0);
  const frais = commande.modeRemise ? FRAIS_REMISE[commande.modeRemise] ?? 0 : 0;
  return { sousTotal, frais, total: sousTotal + frais };
}

export const ajouterAuPanier = serialise(async function ajouterAuPanier(telegramUserId, ref, taille, acheteur = {}) {
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
      acheteur: { username: acheteur.username ?? null, prenom: acheteur.prenom ?? null },
      statut: "panier",
      lignes: [],
      modeRemise: null,
      creneau: null,
      codeRemise: null,
      reservationExpire: null,
      verification: null,
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

/**
 * Envoi de la pièce d'identité (règle n°5-6) : non bloquant, la commande
 * reste au statut « panier » et l'acheteur peut continuer immédiatement
 * vers le rendez-vous. Seule la confirmation finale attend la validation.
 */
export const envoyerVerificationIdentite = serialise(async function envoyerVerificationIdentite(
  telegramUserId,
  octets,
  mimeType
) {
  await purgerReservationsExpireesSansVerrou();
  const commandes = await listerCommandesBrut();
  const commande = commandes.find((c) => c.telegramUserId === telegramUserId && c.statut === "panier");
  if (!commande || commande.lignes.length === 0) throw new ErreurMetier("Panier vide.");

  const { total } = calculerTotaux(commande);
  if (total < SEUIL_VERIFICATION_ID) {
    throw new ErreurMetier("Aucune vérification d'identité requise pour ce montant.");
  }

  const meta = await chiffrerEtEnregistrer(commande.id, octets, mimeType);
  commande.verification = {
    statut: "en_attente",
    envoyeeLe: new Date().toISOString(),
    fichier: meta.fichier,
    iv: meta.iv,
    authTag: meta.authTag,
    mimeType: meta.mimeType,
    valideeLe: null,
    refuseeLe: null,
  };
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
  const verificationRequise = total >= SEUIL_VERIFICATION_ID;
  const dejaValidee = commande.verification?.statut === "validee";

  if (verificationRequise && !commande.verification) {
    throw new ErreurMetier("Envoyez votre pièce d'identité avant de convenir de la remise.");
  }

  commande.creneau = creneau;

  if (verificationRequise && !dejaValidee) {
    // Règle n°6 : bloquante à la confirmation — le créneau est retenu mais
    // la commande n'est confirmée (code de remise généré) qu'après la
    // validation manuelle de l'opérateur, voir validerVerification().
    commande.statut = "attente_verification";
    await enregistrerCommandesBrut(commandes);
    return commande;
  }

  commande.statut = "confirmee";
  commande.codeRemise = genererCodeRemise();
  commande.dateConfirmation = new Date().toISOString();
  await enregistrerCommandesBrut(commandes);
  return commande;
});

/** Validation manuelle par l'opérateur (règle n°6, n°8). */
export const validerVerification = serialise(async function validerVerification(commandeId) {
  const commandes = await listerCommandesBrut();
  const commande = commandes.find((c) => c.id === commandeId);
  if (!commande?.verification) throw new ErreurMetier("Vérification introuvable.");
  if (commande.verification.statut !== "en_attente") throw new ErreurMetier("Cette vérification a déjà été traitée.");

  commande.verification.statut = "validee";
  commande.verification.valideeLe = new Date().toISOString();

  if (commande.statut === "attente_verification") {
    commande.statut = "confirmee";
    commande.codeRemise = genererCodeRemise();
    commande.dateConfirmation = new Date().toISOString();
  }

  await enregistrerCommandesBrut(commandes);
  return commande;
});

/** Refus par l'opérateur (règle n°7) : panier libéré, variante remise en ligne. */
export const refuserVerification = serialise(async function refuserVerification(commandeId) {
  const commandes = await listerCommandesBrut();
  const commande = commandes.find((c) => c.id === commandeId);
  if (!commande?.verification) throw new ErreurMetier("Vérification introuvable.");
  if (commande.verification.statut !== "en_attente") throw new ErreurMetier("Cette vérification a déjà été traitée.");

  const produits = await listerProduits();
  for (const ligne of commande.lignes) {
    const produit = produits.find((p) => p.ref === ligne.ref);
    const variante = produit?.variantes.find((v) => v.taille === ligne.taille);
    if (variante) variante.stock += 1;
  }
  await enregistrerProduits(produits);

  await supprimerPhoto(commande.verification.fichier);
  commande.verification.statut = "refusee";
  commande.verification.refuseeLe = new Date().toISOString();
  commande.verification.fichier = null;
  commande.verification.iv = null;
  commande.verification.authTag = null;

  commande.statut = "refusee";
  commande.lignesExpirees = commande.lignes;
  commande.lignes = [];

  await enregistrerCommandesBrut(commandes);
  return commande;
});

export async function verificationsEnAttente() {
  const commandes = await listerCommandesBrut();
  return commandes
    .filter((c) => c.verification?.statut === "en_attente")
    .sort((a, b) => new Date(a.verification.envoyeeLe) - new Date(b.verification.envoyeeLe));
}

export async function commandesUtilisateur(telegramUserId) {
  await purgerReservationsExpirees();
  const commandes = await listerCommandesBrut();
  return commandes
    .filter((c) => c.telegramUserId === telegramUserId && ["confirmee", "remise"].includes(c.statut))
    .sort((a, b) => new Date(b.dateConfirmation) - new Date(a.dateConfirmation));
}

export async function commandeEnCoursUtilisateur(telegramUserId) {
  await purgerReservationsExpirees();
  const commandes = await listerCommandesBrut();
  return (
    commandes
      .filter((c) => c.telegramUserId === telegramUserId && ["attente_verification", "confirmee"].includes(c.statut))
      .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))[0] ?? null
  );
}

export async function aEteVerifieAuMoinsUneFois(telegramUserId) {
  const commandes = await listerCommandesBrut();
  return commandes.some((c) => c.telegramUserId === telegramUserId && c.verification?.statut === "validee");
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

  // « Suppression automatique dès la remise effectuée » : ne garder que
  // valideeLe comme trace, jamais l'image (voir README, Confidentialité).
  if (commande.verification?.fichier) {
    await supprimerPhoto(commande.verification.fichier);
    commande.verification.fichier = null;
    commande.verification.iv = null;
    commande.verification.authTag = null;
  }

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
  const aExpirer = commandes.filter((commande) => {
    // Panier ordinaire : la réservation de 12h fait foi (règle n°3).
    if (commande.statut === "panier") {
      return (
        commande.reservationExpire && new Date(commande.reservationExpire).getTime() < maintenant
      );
    }
    // Créneau retenu mais vérification jamais traitée : la réservation de
    // 12h ne court plus, c'est le délai de traitement qui borne l'attente.
    // Sans cette branche, une commande oubliée par l'opérateur retient la
    // pièce indéfiniment et conserve la pièce d'identité sans terme.
    if (commande.statut === "attente_verification") {
      const envoyeeLe = commande.verification?.envoyeeLe;
      return (
        commande.verification?.statut === "en_attente" &&
        envoyeeLe &&
        new Date(envoyeeLe).getTime() +
          DELAI_TRAITEMENT_VERIFICATION_HEURES * 60 * 60 * 1000 <
          maintenant
      );
    }
    return false;
  });
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
    // Deux chemins mènent ici avec une photo encore en attente : un panier
    // expiré alors que l'envoi n'avait pas encore été traité (l'envoi
    // n'interrompt pas la réservation, règle n°6), et une commande dont
    // l'opérateur n'a jamais traité la vérification. Dans les deux cas la
    // photo n'a plus aucun usage : elle part avec la réservation.
    if (commande.verification?.statut === "en_attente") {
      await supprimerPhoto(commande.verification.fichier);
      commande.verification.statut = "expiree";
      commande.verification.fichier = null;
      commande.verification.iv = null;
      commande.verification.authTag = null;
    }
  }
  await enregistrerProduits(produits);
  await enregistrerCommandesBrut(commandes);
  return aExpirer;
}
