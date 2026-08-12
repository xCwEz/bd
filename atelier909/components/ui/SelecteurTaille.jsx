"use client";

import { FORMATEUR_PRIX } from "@/lib/formatage";

export default function SelecteurTaille({ variantes, tailleChoisie, onChanger }) {
  return (
    <div className="selecteur-taille">
      {variantes.map((variante) => {
        const epuisee = variante.stock <= 0;
        const selectionnee = variante.taille === tailleChoisie && !epuisee;
        return (
          <button
            key={variante.taille}
            type="button"
            disabled={epuisee}
            className={`case-taille ${selectionnee ? "selectionnee chrome-selection" : ""} ${epuisee ? "epuisee" : ""}`}
            onClick={() => onChanger(variante.taille)}
          >
            <div className="case-taille-ligne">
              <span className="case-taille-nom">{variante.taille}</span>
              <span className="case-taille-prix mono">
                {epuisee ? "—" : FORMATEUR_PRIX.format(variante.prix)}
              </span>
            </div>
            <div className="case-taille-stock mono">
              {epuisee ? "ÉPUISÉ" : `${variante.stock} EN STOCK`}
            </div>
          </button>
        );
      })}
    </div>
  );
}
