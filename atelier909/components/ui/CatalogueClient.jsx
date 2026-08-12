"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

export default function CatalogueClient({ produits }) {
  const marques = useMemo(
    () => Array.from(new Set(produits.map((p) => p.marque))).sort(),
    [produits]
  );
  const [marqueActive, setMarqueActive] = useState("Tout");

  const produitsFiltres = useMemo(() => {
    if (marqueActive === "Tout") return produits;
    return produits.filter((p) => p.marque === marqueActive);
  }, [produits, marqueActive]);

  const derniereMaj = useMemo(() => {
    const maintenant = new Date();
    const h = String(maintenant.getHours()).padStart(2, "0");
    const m = String(maintenant.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }, []);

  return (
    <>
      <Link href="/recherche" className="barre-recherche">
        <span>Rechercher une pièce…</span>
        <span className="barre-recherche-separateur" />
        <span className="barre-recherche-filtres mono">FILTRES</span>
      </Link>

      <div className="rangee-filtres">
        <button
          type="button"
          className={`puce-filtre ${marqueActive === "Tout" ? "actif chrome-selection" : ""}`}
          onClick={() => setMarqueActive("Tout")}
        >
          Tout
        </button>
        {marques.map((marque) => (
          <button
            key={marque}
            type="button"
            className={`puce-filtre ${marqueActive === marque ? "actif chrome-selection" : ""}`}
            onClick={() => setMarqueActive(marque)}
          >
            {marque}
          </button>
        ))}
      </div>

      <div className="section-titre-ligne">
        <span className="section-titre">Arrivages</span>
        <span className="section-maj mono">MAJ {derniereMaj}</span>
      </div>

      <div className="grille-produits">
        {produitsFiltres.map((produit, index) => (
          <ProductCard key={produit.ref} produit={produit} index={index} />
        ))}
      </div>

      {produitsFiltres.length === 0 && (
        <p style={{ padding: "0 16px", color: "var(--texte-discret)", fontSize: 13 }}>
          Aucune pièce dans cette catégorie pour le moment.
        </p>
      )}
    </>
  );
}
