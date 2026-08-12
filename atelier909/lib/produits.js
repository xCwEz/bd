import { readFile, writeFile } from "fs/promises";
import path from "path";

const CHEMIN_DONNEES = path.join(process.cwd(), "data", "produits.json");

export async function listerProduits() {
  const brut = await readFile(CHEMIN_DONNEES, "utf-8");
  return JSON.parse(brut);
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
  await writeFile(CHEMIN_DONNEES, JSON.stringify(produits, null, 2) + "\n", "utf-8");
}
