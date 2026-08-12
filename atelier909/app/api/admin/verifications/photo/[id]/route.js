import { NextResponse } from "next/server";
import { estAdminConnecte } from "@/lib/auth";
import { trouverCommande } from "@/lib/commandes";
import { dechiffrer } from "@/lib/identite";

export async function GET(_requete, { params }) {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const commande = await trouverCommande(id);
  const verification = commande?.verification;
  if (!verification?.fichier) {
    return NextResponse.json({ message: "Photo indisponible." }, { status: 404 });
  }

  const octets = await dechiffrer(verification);
  return new NextResponse(octets, {
    headers: {
      "Content-Type": verification.mimeType || "image/jpeg",
      "Cache-Control": "no-store, private",
    },
  });
}
