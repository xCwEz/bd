import { NextResponse } from "next/server";
import { utilisateurDeLaRequete } from "@/lib/session";
import { ajouterAuPanier, calculerTotaux, ErreurMetier } from "@/lib/commandes";

export async function POST(requete) {
  const utilisateur = await utilisateurDeLaRequete(requete);
  const telegramUserId = utilisateur?.id;
  if (!telegramUserId) return NextResponse.json({ message: "Session absente." }, { status: 401 });

  const { ref, taille } = await requete.json();
  if (!ref || !taille) return NextResponse.json({ message: "Référence et taille requises." }, { status: 400 });

  try {
    const commande = await ajouterAuPanier(telegramUserId, ref, taille, {
      username: utilisateur.username,
      prenom: utilisateur.prenom,
    });
    return NextResponse.json({ commande, totaux: calculerTotaux(commande) });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
