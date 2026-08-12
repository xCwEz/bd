import path from "path";
import { lireJson, ecrireJsonAtomique } from "@/lib/stockage-json";

const CHEMIN_DONNEES = path.join(process.cwd(), "data", "produits.json");

export async function listerProduits() {
  return lireJson(CHEMIN_DONNEES);
}

export async function listerProduitsEnLigne() {
  const produits = await listerProduits();
  return produits.filter((p) => p.statut === "en_ligne");
}

export async function trouverProduit(ref) {
  const produits = await listerProduits();
  return produits.find((p) => p.ref === ref) ?? null;
}

export async function enregistrerProduits(produits) {
  await ecrireJsonAtomique(CHEMIN_DONNEES, produits);
}
