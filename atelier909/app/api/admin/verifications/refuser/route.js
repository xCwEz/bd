import { NextResponse } from "next/server";
import { estAdminConnecte } from "@/lib/auth";
import { refuserVerification, ErreurMetier } from "@/lib/commandes";
import { envoyerMessageTelegram, chatIdDepuisUtilisateur } from "@/lib/telegram";

export async function POST(requete) {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  const { id } = await requete.json();

  try {
    const commande = await refuserVerification(id);
    const chatId = chatIdDepuisUtilisateur(commande.telegramUserId);
    await envoyerMessageTelegram(
      chatId,
      "Vérification d'identité refusée (document illisible ou non conforme). Votre panier a été libéré, vous pouvez recommencer."
    );
    return NextResponse.json({ commande });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
