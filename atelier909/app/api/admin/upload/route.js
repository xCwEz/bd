import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { estAdminConnecte } from "@/lib/auth";

// Forme attendue d'une référence : « SI-94-ICE ». Liste blanche stricte
// plutôt que nettoyage — un simple remplacement de caractères laissait
// passer « .. », qui remonte d'un dossier et écrit hors de l'arborescence
// prévue.
const REFERENCE_VALIDE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const EXTENSIONS_AUTORISEES = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".mp4", ".webm", ".mov"]);
// Large : une vidéo de présentation d'une quarantaine de secondes tient
// dessous, mais le corps n'est plus illimité.
const TAILLE_MAX_OCTETS = 200 * 1024 * 1024;

export async function POST(requete) {
  if (!(await estAdminConnecte())) return NextResponse.json({ message: "Non autorisé" }, { status: 401 });

  const annonce = Number(requete.headers.get("content-length"));
  if (Number.isFinite(annonce) && annonce > TAILLE_MAX_OCTETS) {
    return NextResponse.json({ message: "Fichier trop volumineux." }, { status: 413 });
  }

  const donnees = await requete.formData();
  const ref = donnees.get("ref");
  const fichier = donnees.get("fichier");

  if (!ref || !fichier || typeof fichier === "string") {
    return NextResponse.json({ message: "Référence et fichier requis." }, { status: 400 });
  }

  const refPropre = String(ref);
  if (!REFERENCE_VALIDE.test(refPropre)) {
    return NextResponse.json({ message: "Référence invalide." }, { status: 400 });
  }

  const type = fichier.type.startsWith("video/") ? "video" : "photo";
  const extension = (path.extname(fichier.name) || (type === "video" ? ".mp4" : ".jpg")).toLowerCase();
  if (!EXTENSIONS_AUTORISEES.has(extension)) {
    return NextResponse.json({ message: "Format de fichier non pris en charge." }, { status: 400 });
  }
  const nomFichier = `${Date.now()}${extension}`;

  const racine = path.join(process.cwd(), "public", "produits");
  const dossier = path.join(racine, refPropre);
  // Ceinture et bretelles : même avec la liste blanche ci-dessus, on refuse
  // d'écrire quoi que ce soit en dehors de public/produits/.
  if (path.relative(racine, dossier).startsWith("..")) {
    return NextResponse.json({ message: "Référence invalide." }, { status: 400 });
  }
  await mkdir(dossier, { recursive: true });

  const octets = Buffer.from(await fichier.arrayBuffer());
  await writeFile(path.join(dossier, nomFichier), octets);

  return NextResponse.json({ cle: `/produits/${refPropre}/${nomFichier}`, type });
}
