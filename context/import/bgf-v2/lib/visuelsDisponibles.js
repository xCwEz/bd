import fs from "node:fs";
import path from "node:path";
import { services } from "./data";

/**
 * Recense les visuels réellement présents sur le disque.
 *
 * Le site ne référence jamais un chemin d'image inventé : un bloc de service
 * n'affiche une image que si le fichier existe. Tant qu'il manque, le bloc
 * retombe sur son visuel 3D procédural. Le dossier public/ peut donc rester
 * vide sans rien casser.
 *
 * Convention de nommage, une image par service :
 *   public/services/<identifiant>.webp   (ou .avif, .jpg, .png)
 * Les identifiants sont ceux de lib/data.js : entretien, reparation,
 * diagnostic, carrosserie, preparation.
 *
 * Cette lecture a lieu côté serveur. En production elle est figée au build :
 * après avoir ajouté des images, relancer `npm run build`.
 */

const EXTENSIONS = [".webp", ".avif", ".jpg", ".jpeg", ".png"];
const DOSSIER = path.join(process.cwd(), "public", "services");

export function visuelsDisponibles() {
  let fichiers;
  try {
    fichiers = fs.readdirSync(DOSSIER);
  } catch {
    // Dossier absent : c'est le cas nominal tant qu'aucune image n'est fournie.
    return {};
  }

  const table = {};
  for (const service of services) {
    const nom = EXTENSIONS.map((ext) => `${service.id}${ext}`).find((candidat) =>
      fichiers.includes(candidat)
    );
    if (nom) table[service.id] = `/services/${nom}`;
  }
  return table;
}
