import { NextResponse } from "next/server";
import { estAdminConnecte } from "@/lib/auth";
import { listerProduits, enregistrerProduits } from "@/lib/produits";
import { validerProduit } from "@/lib/validation";

export async function GET() {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await listerProduits());
}

export async function POST(requete) {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const { produit: brut, refOriginale } = await requete.json();

  const controle = validerProduit(brut);
  if (!controle.valide) {
    return NextResponse.json({ message: controle.message }, { status: 400 });
  }
  const produit = controle.produit;

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
