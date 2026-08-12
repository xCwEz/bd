import { NextResponse } from "next/server";
import { estAdminConnecte } from "@/lib/auth";
import { listerProduits, enregistrerProduits } from "@/lib/produits";

export async function GET() {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await listerProduits());
}

export async function POST(requete) {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { produit, refOriginale } = await requete.json();

  if (!produit?.ref || !produit?.marque || !produit?.nom) {
    return NextResponse.json({ message: "Référence, marque et nom sont obligatoires." }, { status: 400 });
  }

  const produits = await listerProduits();

  if (refOriginale) {
    const index = produits.findIndex((p) => p.ref === refOriginale);
    if (index === -1) {
      return NextResponse.json({ message: "Pièce introuvable." }, { status: 404 });
    }
    if (produit.ref !== refOriginale && produits.some((p) => p.ref === produit.ref)) {
      return NextResponse.json({ message: "Cette référence existe déjà." }, { status: 409 });
    }
    produits[index] = produit;
  } else {
    if (produits.some((p) => p.ref === produit.ref)) {
      return NextResponse.json({ message: "Cette référence existe déjà." }, { status: 409 });
    }
    produits.push(produit);
  }

  await enregistrerProduits(produits);
  return NextResponse.json({ ok: true });
}
