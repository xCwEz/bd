import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { estAdminConnecte } from "@/lib/auth";

function nettoyerSegment(valeur) {
  return valeur.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(requete) {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const donnees = await requete.formData();
  const ref = donnees.get("ref");
  const fichier = donnees.get("fichier");

  if (!ref || !fichier) {
    return NextResponse.json({ message: "Référence et fichier requis." }, { status: 400 });
  }

  const refPropre = nettoyerSegment(String(ref));
  const type = fichier.type.startsWith("video/") ? "video" : "photo";
  const extension = path.extname(fichier.name) || (type === "video" ? ".mp4" : ".jpg");
  const nomFichier = `${Date.now()}${nettoyerSegment(extension)}`;

  const dossier = path.join(process.cwd(), "public", "produits", refPropre);
  await mkdir(dossier, { recursive: true });

  const octets = Buffer.from(await fichier.arrayBuffer());
  await writeFile(path.join(dossier, nomFichier), octets);

  return NextResponse.json({ cle: `/produits/${refPropre}/${nomFichier}`, type });
}
