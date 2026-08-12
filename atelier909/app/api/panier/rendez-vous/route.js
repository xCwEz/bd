import { NextResponse } from "next/server";
import { utilisateurDeLaRequete } from "@/lib/session";
import { confirmerRendezVous, calculerTotaux, ErreurMetier } from "@/lib/commandes";
import { envoyerMessageTelegram, chatIdOperateur, echapperHtml } from "@/lib/telegram";
import { FORMATEUR_PRIX } from "@/lib/formatage";

export async function POST(requete) {
  const utilisateur = await utilisateurDeLaRequete(requete);
  const telegramUserId = utilisateur?.id;
  if (!telegramUserId) return NextResponse.json({ message: "Session absente." }, { status: 401 });

  const { creneau } = await requete.json();

  try {
    const commande = await confirmerRendezVous(telegramUserId, creneau);
    const { total } = calculerTotaux(commande);
    const lignes = commande.lignes
      .map((l) => `• ${echapperHtml(l.marque)} ${echapperHtml(l.nom)} (${echapperHtml(l.taille)})`)
      .join("\n");
    const creneauSur = echapperHtml(creneau);

    if (commande.statut === "attente_verification") {
      await envoyerMessageTelegram(
        chatIdOperateur(),
        `<b>Créneau retenu, en attente de vérification</b>\nCommande ${commande.id}\n${lignes}\n\nCréneau : ${creneauSur}\nÀ valider dans /admin/verifications avant confirmation.`
      );
    } else {
      await envoyerMessageTelegram(
        chatIdOperateur(),
        `<b>Rendez-vous confirmé — ${commande.id}</b>\n${lignes}\n\nCréneau : ${creneauSur}\nTotal espèces : ${FORMATEUR_PRIX.format(total)}\nCode de remise : ${commande.codeRemise}`
      );
    }

    return NextResponse.json({ commande });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
