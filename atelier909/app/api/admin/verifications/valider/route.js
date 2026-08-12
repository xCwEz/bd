import { NextResponse } from "next/server";
import { estAdminConnecte } from "@/lib/auth";
import { validerVerification, ErreurMetier } from "@/lib/commandes";
import { envoyerMessageTelegram, chatIdDepuisUtilisateur } from "@/lib/telegram";

export async function POST(requete) {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  const { id } = await requete.json();

  try {
    const commande = await validerVerification(id);
    const chatId = chatIdDepuisUtilisateur(commande.telegramUserId);
    const texte =
      commande.statut === "confirmee"
        ? `Identité vérifiée. Votre rendez-vous est confirmé — code de remise ${commande.codeRemise}.`
        : "Identité vérifiée. Vous pouvez convenir de la remise.";
    await envoyerMessageTelegram(chatId, texte);
    return NextResponse.json({ commande });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
