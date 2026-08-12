/**
 * Validation de la forme d'une pièce avant écriture dans data/produits.json.
 *
 * Le back-office n'est pas une surface hostile (un seul opérateur, protégé
 * par mot de passe), mais le fichier qu'il écrit alimente toute la vitrine :
 * une seule sauvegarde malformée — `variantes` absent, prix en texte —
 * casse le catalogue pour l'ensemble des visiteurs. La validation protège
 * donc surtout de l'erreur, pas de l'attaque.
 */

export const REFERENCE_VALIDE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const STATUTS = new Set(["brouillon", "en_ligne", "reserve", "vendu", "retire"]);
const BADGES = new Set(["video", "1_piece"]);
const TYPES_MEDIA = new Set(["photo", "video"]);

function estTexte(valeur) {
  return typeof valeur === "string";
}

/** Retourne { valide: true, produit } ou { valide: false, message }. */
export function validerProduit(brut) {
  if (!brut || typeof brut !== "object") return { valide: false, message: "Pièce absente." };

  if (!estTexte(brut.ref) || !REFERENCE_VALIDE.test(brut.ref)) {
    return { valide: false, message: "Référence invalide (lettres, chiffres, tiret et souligné)." };
  }
  if (!estTexte(brut.marque) || !brut.marque.trim()) return { valide: false, message: "Marque obligatoire." };
  if (!estTexte(brut.nom) || !brut.nom.trim()) return { valide: false, message: "Nom obligatoire." };

  const annee = Number(brut.annee);
  if (!Number.isInteger(annee) || annee < 1900 || annee > 2100) {
    return { valide: false, message: "Année invalide." };
  }

  const conditionScore = Number(brut.conditionScore);
  if (!Number.isInteger(conditionScore) || conditionScore < 0 || conditionScore > 10) {
    return { valide: false, message: "Score de condition attendu entre 0 et 10." };
  }

  const statut = estTexte(brut.statut) ? brut.statut : "brouillon";
  if (!STATUTS.has(statut)) return { valide: false, message: "Statut inconnu." };

  const badge = brut.badge == null || brut.badge === "" ? null : brut.badge;
  if (badge !== null && !BADGES.has(badge)) return { valide: false, message: "Badge inconnu." };

  if (!Array.isArray(brut.variantes) || brut.variantes.length === 0) {
    return { valide: false, message: "Au moins une taille est nécessaire." };
  }
  const variantes = [];
  for (const v of brut.variantes) {
    if (!v || typeof v !== "object") return { valide: false, message: "Taille malformée." };
    if (!estTexte(v.taille) || !v.taille.trim()) return { valide: false, message: "Libellé de taille obligatoire." };
    const stock = Number(v.stock);
    if (!Number.isInteger(stock) || stock < 0) return { valide: false, message: `Stock invalide pour ${v.taille}.` };
    let prix = null;
    if (v.prix !== null && v.prix !== undefined && v.prix !== "") {
      prix = Number(v.prix);
      if (!Number.isFinite(prix) || prix < 0) return { valide: false, message: `Prix invalide pour ${v.taille}.` };
    }
    if (stock > 0 && prix === null) {
      return { valide: false, message: `Une taille en stock doit avoir un prix (${v.taille}).` };
    }
    variantes.push({ taille: v.taille.trim(), prix, stock });
  }
  if (new Set(variantes.map((v) => v.taille)).size !== variantes.length) {
    return { valide: false, message: "Deux tailles portent le même libellé." };
  }

  const mediasBruts = Array.isArray(brut.medias) ? brut.medias : [];
  const medias = [];
  for (const [i, m] of mediasBruts.entries()) {
    if (!m || typeof m !== "object") return { valide: false, message: "Média malformé." };
    const type = TYPES_MEDIA.has(m.type) ? m.type : "photo";
    // Seuls des chemins internes servis par l'app : jamais une URL externe,
    // qui ferait fuiter la consultation du catalogue vers un tiers.
    if (m.cle != null && (!estTexte(m.cle) || !m.cle.startsWith("/produits/"))) {
      return { valide: false, message: "Chemin de média invalide." };
    }
    const media = { type, ordre: i + 1, cle: m.cle ?? null };
    if (type === "video" && m.duree != null) {
      const duree = Number(m.duree);
      if (Number.isFinite(duree) && duree >= 0) media.duree = duree;
    }
    medias.push(media);
  }

  return {
    valide: true,
    produit: {
      ref: brut.ref,
      marque: brut.marque.trim(),
      annee,
      nom: brut.nom.trim(),
      description: estTexte(brut.description) ? brut.description : "",
      conditionScore,
      conditionCommentaire: estTexte(brut.conditionCommentaire) ? brut.conditionCommentaire : "",
      statut,
      badge,
      variantes,
      medias,
    },
  };
}
