import { NextResponse } from "next/server";
import { utilisateurCourant } from "@/lib/session";
import { envoyerVerificationIdentite, ErreurMetier } from "@/lib/commandes";
import { envoyerMessageTelegram, chatIdOperateur } from "@/lib/telegram";

const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const TAILLE_MAX_OCTETS = 12 * 1024 * 1024;

export async function POST(requete) {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return NextResponse.json({ message: "Session absente." }, { status: 401 });

  const donnees = await requete.formData();
  const photo = donnees.get("photo");
  if (!photo || typeof photo === "string") {
    return NextResponse.json({ message: "Photo manquante." }, { status: 400 });
  }
  if (!TYPES_ACCEPTES.includes(photo.type)) {
    return NextResponse.json({ message: "Format d'image non pris en charge." }, { status: 400 });
  }
  if (photo.size > TAILLE_MAX_OCTETS) {
    return NextResponse.json({ message: "Photo trop volumineuse." }, { status: 400 });
  }

  try {
    const octets = Buffer.from(await photo.arrayBuffer());
    const commande = await envoyerVerificationIdentite(utilisateur.id, octets, photo.type);

    await envoyerMessageTelegram(
      chatIdOperateur(),
      `<b>Vérification d'identité à traiter</b>\nCommande ${commande.id}\nÀ examiner dans le back-office (/admin/verifications).`
    );

    return NextResponse.json({ commande });
  } catch (erreur) {
    if (erreur instanceof ErreurMetier) return NextResponse.json({ message: erreur.message }, { status: 409 });
    throw erreur;
  }
}
