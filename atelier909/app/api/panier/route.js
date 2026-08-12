import { NextResponse } from "next/server";
import { utilisateurDeLaRequete } from "@/lib/session";
import { trouverPanierActif, calculerTotaux } from "@/lib/commandes";
import { SEUIL_VERIFICATION_ID } from "@/lib/config";

export async function GET(requete) {
  const utilisateur = await utilisateurDeLaRequete(requete);
  const telegramUserId = utilisateur?.id;
  if (!telegramUserId) return NextResponse.json({ commande: null });

  const commande = await trouverPanierActif(telegramUserId);
  if (!commande) return NextResponse.json({ commande: null });

  return NextResponse.json({
    commande,
    totaux: calculerTotaux(commande),
    seuilVerification: SEUIL_VERIFICATION_ID,
  });
}
