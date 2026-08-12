import { NextResponse } from "next/server";
import { utilisateurDeLaRequete } from "@/lib/session";
import { definirModeRemise, calculerTotaux, ErreurMetier } from "@/lib/commandes";

export async function POST(requete) {
  const utilisateur = await utilisateurDeLaRequete(requete);
  const telegramUserId = utilisateur?.id;
  if (!telegramUserId) return NextResponse.json({ message: "Session absente." }, { status: 401 });

  const { mode } = await requete.json();

  try {
    const commande = await definirModeRemise(telegramUserId, mode);
    return NextResponse.json({ commande, totaux: calculerTotaux(commande) });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
