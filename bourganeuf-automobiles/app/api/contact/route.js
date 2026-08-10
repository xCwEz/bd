import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Réception des demandes du formulaire.
 *
 * Validation identique à celle du client — un formulaire ne se valide jamais
 * uniquement dans le navigateur.
 *
 * Acheminement : si la variable d'environnement CONTACT_WEBHOOK_URL est
 * définie, la demande y est transmise ; sinon elle est journalisée côté
 * serveur. Aucun fournisseur d'e-mail n'est câblé ici : le brancher relève
 * du déploiement, pas du code du site.
 */

const LIMITE = { nom: 120, email: 180, telephone: 40, message: 4000 };

function nettoyer(valeur, taille) {
  return String(valeur ?? "")
    .slice(0, taille)
    .trim();
}

function valider(donnees) {
  const erreurs = {};

  if (donnees.nom.length < 2) erreurs.nom = "Nom manquant.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(donnees.email)) {
    erreurs.email = "Adresse e-mail invalide.";
  }
  const telephone = donnees.telephone.replace(/[\s.\-()]/g, "");
  if (telephone && !/^\+?\d{9,15}$/.test(telephone)) {
    erreurs.telephone = "Numéro invalide.";
  }
  if (donnees.message.length < 12) erreurs.message = "Message trop court.";

  return erreurs;
}

export async function POST(requete) {
  let corps;
  try {
    corps = await requete.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Requête illisible." },
      { status: 400 }
    );
  }

  const donnees = {
    nom: nettoyer(corps.nom, LIMITE.nom),
    email: nettoyer(corps.email, LIMITE.email),
    telephone: nettoyer(corps.telephone, LIMITE.telephone),
    message: nettoyer(corps.message, LIMITE.message),
  };

  const erreurs = valider(donnees);
  if (Object.keys(erreurs).length > 0) {
    return NextResponse.json({ ok: false, erreurs }, { status: 400 });
  }

  const demande = { ...donnees, recuLe: new Date().toISOString() };
  const destination = process.env.CONTACT_WEBHOOK_URL;

  if (destination) {
    try {
      const reponse = await fetch(destination, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demande),
      });
      if (!reponse.ok) throw new Error(`Statut ${reponse.status}`);
    } catch (erreur) {
      console.error("[contact] transmission impossible :", erreur);
      return NextResponse.json(
        { ok: false, message: "Transmission impossible." },
        { status: 502 }
      );
    }
  } else {
    console.info("[contact] demande reçue :", demande);
  }

  return NextResponse.json({ ok: true });
}
