import Link from "next/link";
import MediaPlaceholder from "./MediaPlaceholder";
import { FORMATEUR_PRIX, libelleBadge, prixAffiche } from "@/lib/formatage";

export default function ProductCard({ produit, index = 0 }) {
  const badge = libelleBadge(produit.badge);
  const prix = prixAffiche(produit);
  const media = produit.medias?.[0];

  return (
    <Link
      href={`/produit/${produit.ref}`}
      className="carte-produit"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <MediaPlaceholder graine={index} cle={media?.cle} />
      <div className="carte-produit-voile" />
      {badge && (
        <span className={`carte-produit-badge ${produit.badge === "video" ? "video" : "piece"}`}>
          {badge}
        </span>
      )}
      <div className="carte-produit-bas">
        <div className="carte-produit-ref mono">{produit.ref}</div>
        <div className="carte-produit-nom">{produit.nom}</div>
        <div className="carte-produit-ligne-prix">
          <span className="carte-produit-prix mono">
            {prix != null ? FORMATEUR_PRIX.format(prix) : "—"}
          </span>
          <span className="carte-produit-condition mono">{produit.conditionScore}/10</span>
        </div>
      </div>
    </Link>
  );
}
