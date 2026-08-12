import { NextResponse } from "next/server";
import { utilisateurCourant } from "@/lib/session";
import { confirmerRendezVous, calculerTotaux, ErreurMetier } from "@/lib/commandes";
import { envoyerMessageTelegram, chatIdOperateur } from "@/lib/telegram";
import { FORMATEUR_PRIX } from "@/lib/formatage";

export async function POST(requete) {
  const utilisateur = await utilisateurCourant();
  const telegramUserId = utilisateur?.id;
  if (!telegramUserId) return NextResponse.json({ message: "Session absente." }, { status: 401 });

  const { creneau } = await requete.json();

  try {
    const commande = await confirmerRendezVous(telegramUserId, creneau);
    const { total } = calculerTotaux(commande);
    const lignes = commande.lignes.map((l) => `• ${l.marque} ${l.nom} (${l.taille})`).join("\n");

    if (commande.statut === "attente_verification") {
      await envoyerMessageTelegram(
        chatIdOperateur(),
        `<b>Créneau retenu, en attente de vérification</b>\nCommande ${commande.id}\n${lignes}\n\nCréneau : ${creneau}\nÀ valider dans /admin/verifications avant confirmation.`
      );
    } else {
      await envoyerMessageTelegram(
        chatIdOperateur(),
        `<b>Rendez-vous confirmé — ${commande.id}</b>\n${lignes}\n\nCréneau : ${creneau}\nTotal espèces : ${FORMATEUR_PRIX.format(total)}\nCode de remise : ${commande.codeRemise}`
      );
    }

    return NextResponse.json({ commande });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
