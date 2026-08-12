import { NextResponse } from "next/server";
import { utilisateurCourant } from "@/lib/session";
import { retirerDuPanier, calculerTotaux, ErreurMetier } from "@/lib/commandes";

export async function POST(requete) {
  const utilisateur = await utilisateurCourant();
  const telegramUserId = utilisateur?.id;
  if (!telegramUserId) return NextResponse.json({ message: "Session absente." }, { status: 401 });

  const { index } = await requete.json();

  try {
    const commande = await retirerDuPanier(telegramUserId, index);
    return NextResponse.json({ commande, totaux: calculerTotaux(commande) });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
