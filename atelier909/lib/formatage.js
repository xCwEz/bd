/** Utilitaires purs, sans accès disque : importables depuis le client. */

export const FORMATEUR_PRIX = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Prix à afficher sur la carte catalogue : le plus bas parmi les tailles en
 * stock, ou le plus bas prix connu si tout est épuisé. */
export function prixAffiche(produit) {
  const disponibles = produit.variantes.filter((v) => v.stock > 0 && v.prix != null);
  const source = disponibles.length > 0 ? disponibles : produit.variantes.filter((v) => v.prix != null);
  if (source.length === 0) return null;
  return Math.min(...source.map((v) => v.prix));
}

export function aDuStock(produit) {
  return produit.variantes.some((v) => v.stock > 0);
}

export function libelleBadge(badge) {
  if (badge === "video") return "VIDÉO";
  if (badge === "1_piece") return "1 PIÈCE";
  return null;
}
