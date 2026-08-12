import { NextResponse } from "next/server";
import { utilisateurCourant } from "@/lib/session";
import { commandesUtilisateur, membreDepuis } from "@/lib/commandes";

export async function GET() {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return NextResponse.json({ profil: null });

  const commandes = await commandesUtilisateur(utilisateur.id);
  const commandeEnCours = commandes.find((c) => c.statut === "confirmee") ?? null;
  const historique = commandes.filter((c) => c.statut === "remise");

  return NextResponse.json({
    profil: {
      handle: utilisateur.username ? `@${utilisateur.username}` : utilisateur.prenom || "Compte Telegram",
      membreDepuis: await membreDepuis(utilisateur.id),
    },
    compteurs: {
      dealsConclus: historique.length,
      litiges: 0,
    },
    commandeEnCours,
    historique,
  });
}
