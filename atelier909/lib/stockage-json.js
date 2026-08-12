import { readFile, writeFile, rename, copyFile } from "fs/promises";

/**
 * Lecture / écriture des fichiers de données JSON.
 *
 * L'écriture est **atomique** : on écrit dans un fichier temporaire, puis on
 * le renomme. `rename()` est atomique sur un même système de fichiers, donc
 * le fichier de destination est toujours soit l'ancienne version complète,
 * soit la nouvelle — jamais un contenu tronqué.
 *
 * Sans cette précaution, un arrêt du processus en cours d'écriture (arrêt du
 * conteneur, dépassement mémoire, redéploiement) laissait un JSON incomplet.
 * Vérifié : le fichier devenait illisible, et comme catalogue et commandes
 * sont lus par toutes les pages, la boutique entière et le back-office
 * tombaient d'un coup, sans copie de secours.
 *
 * Une copie `.bak` de la version précédente est conservée à chaque écriture
 * réussie : dernier recours manuel si le fichier courant venait malgré tout
 * à être perdu.
 */
export async function lireJson(chemin) {
  const brut = await readFile(chemin, "utf-8");
  return JSON.parse(brut);
}

export async function ecrireJsonAtomique(chemin, donnees) {
  const contenu = JSON.stringify(donnees, null, 2) + "\n";
  const temporaire = `${chemin}.tmp`;

  // Sauvegarde de la version en place avant de la remplacer. Absente au
  // tout premier enregistrement : ce n'est pas une erreur.
  try {
    await copyFile(chemin, `${chemin}.bak`);
  } catch (erreur) {
    if (erreur.code !== "ENOENT") throw erreur;
  }

  await writeFile(temporaire, contenu, "utf-8");
  await rename(temporaire, chemin);
}
