import { NextResponse } from "next/server";
import { estAdminConnecte } from "@/lib/auth";
import { verificationsEnAttente, calculerTotaux } from "@/lib/commandes";

export async function GET() {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  const commandes = await verificationsEnAttente();
  return NextResponse.json(commandes.map((c) => ({ ...c, totaux: calculerTotaux(c) })));
}
