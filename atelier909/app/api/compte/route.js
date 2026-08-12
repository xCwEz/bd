import { NextResponse } from "next/server";
import { utilisateurCourant } from "@/lib/session";
import { commandesUtilisateur, commandeEnCoursUtilisateur, membreDepuis, aEteVerifieAuMoinsUneFois } from "@/lib/commandes";

export async function GET() {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return NextResponse.json({ profil: null });

  const [commandeEnCours, commandes, verifie] = await Promise.all([
    commandeEnCoursUtilisateur(utilisateur.id),
    commandesUtilisateur(utilisateur.id),
    aEteVerifieAuMoinsUneFois(utilisateur.id),
  ]);
  const historique = commandes.filter((c) => c.statut === "remise");

  return NextResponse.json({
    profil: {
      handle: utilisateur.username ? `@${utilisateur.username}` : utilisateur.prenom || "Compte Telegram",
      membreDepuis: await membreDepuis(utilisateur.id),
      verifie,
    },
    compteurs: {
      dealsConclus: historique.length,
      litiges: 0,
    },
    commandeEnCours,
    historique,
  });
}
