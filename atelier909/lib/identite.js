import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import path from "path";

// Hors public/ : jamais servi statiquement, jamais accessible par URL directe.
const DOSSIER_STOCKAGE = path.join(process.cwd(), "stockage", "identites");

function cle() {
  const valeur = process.env.IDENTITE_CHIFFREMENT_CLE;
  if (!valeur) throw new Error("IDENTITE_CHIFFREMENT_CLE manquant (voir .env.example).");
  // AES-256 exige une clé de 32 octets : dérivée par hash plutôt que de
  // contraindre la valeur en variable d'env à une longueur exacte.
  return createHash("sha256").update(valeur).digest();
}

/** Chiffre une photo et l'écrit sur disque. Retourne les métadonnées à stocker (jamais la clé). */
export async function chiffrerEtEnregistrer(commandeId, octets, mimeType) {
  await mkdir(DOSSIER_STOCKAGE, { recursive: true });

  const iv = randomBytes(12); // recommandé pour GCM
  const chiffreur = createCipheriv("aes-256-gcm", cle(), iv);
  const chiffre = Buffer.concat([chiffreur.update(octets), chiffreur.final()]);
  const authTag = chiffreur.getAuthTag();

  const nomFichier = `${commandeId}.enc`;
  await writeFile(path.join(DOSSIER_STOCKAGE, nomFichier), chiffre);

  return {
    fichier: nomFichier,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    mimeType,
  };
}

/** Déchiffre une photo pour affichage à l'opérateur uniquement. */
export async function dechiffrer({ fichier, iv, authTag }) {
  const chemin = path.join(DOSSIER_STOCKAGE, fichier);
  const chiffre = await readFile(chemin);

  const dechiffreur = createDecipheriv("aes-256-gcm", cle(), Buffer.from(iv, "hex"));
  dechiffreur.setAuthTag(Buffer.from(authTag, "hex"));
  return Buffer.concat([dechiffreur.update(chiffre), dechiffreur.final()]);
}

/** Supprime définitivement le fichier chiffré — remise effectuée, refus, ou nettoyage. */
export async function supprimerPhoto(fichier) {
  if (!fichier) return;
  try {
    await unlink(path.join(DOSSIER_STOCKAGE, fichier));
  } catch (erreur) {
    if (erreur.code !== "ENOENT") throw erreur;
  }
}
