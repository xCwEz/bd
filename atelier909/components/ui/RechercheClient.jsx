"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ORDRE_TAILLES = ["XS", "S", "M", "L", "XL", "XXL", "Unique"];
const PALIERS_CONDITION = [6, 7, 8, 9];
const MODES_REMISE = ["RDV point neutre", "Casier / consigne", "Point relais anonyme", "Coursier de confiance"];

export default function RechercheClient({ produits }) {
  const router = useRouter();
  const [requete, setRequete] = useState("");
  const [taillesChoisies, setTaillesChoisies] = useState(new Set());
  const [conditionMin, setConditionMin] = useState(null);
  const [modesChoisis, setModesChoisis] = useState(new Set());

  const toutesLesTailles = useMemo(() => {
    const ensemble = new Set();
    produits.forEach((p) => p.variantes.forEach((v) => ensemble.add(v.taille)));
    return Array.from(ensemble).sort(
      (a, b) => ORDRE_TAILLES.indexOf(a) - ORDRE_TAILLES.indexOf(b)
    );
  }, [produits]);

  const bornesPrix = useMemo(() => {
    const prix = produits.flatMap((p) => p.variantes.map((v) => v.prix).filter(Boolean));
    return { min: Math.min(...prix), max: Math.max(...prix) };
  }, [produits]);

  const [budget, setBudget] = useState(bornesPrix);

  function basculerTaille(taille) {
    setTaillesChoisies((precedent) => {
      const suivant = new Set(precedent);
      suivant.has(taille) ? suivant.delete(taille) : suivant.add(taille);
      return suivant;
    });
  }

  function basculerMode(mode) {
    setModesChoisis((precedent) => {
      const suivant = new Set(precedent);
      suivant.has(mode) ? suivant.delete(mode) : suivant.add(mode);
      return suivant;
    });
  }

  const resultats = useMemo(() => {
    return produits.filter((p) => {
      if (requete && !`${p.marque} ${p.nom} ${p.ref}`.toLowerCase().includes(requete.toLowerCase())) {
        return false;
      }
      if (taillesChoisies.size > 0 && !p.variantes.some((v) => taillesChoisies.has(v.taille))) {
        return false;
      }
      if (!p.variantes.some((v) => v.prix != null && v.prix >= budget.min && v.prix <= budget.max)) {
        return false;
      }
      if (conditionMin != null && p.conditionScore < conditionMin) {
        return false;
      }
      return true;
    });
  }, [produits, requete, taillesChoisies, budget, conditionMin]);

  return (
    <div className="ecran-recherche">
      <div className="champ-recherche-actif">
        <input
          autoFocus
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Marque, modèle, référence…"
        />
        <span className="champ-recherche-curseur" aria-hidden="true" />
        <button type="button" className="champ-recherche-annuler mono" onClick={() => router.push("/")}>
          ANNULER
        </button>
      </div>

      <div className="groupe-filtre">
        <div className="groupe-filtre-titre mono">TAILLE</div>
        <div className="groupe-puces">
          {toutesLesTailles.map((taille) => (
            <button
              key={taille}
              type="button"
              className={`puce-filtre ${taillesChoisies.has(taille) ? "actif chrome-selection" : ""}`}
              onClick={() => basculerTaille(taille)}
            >
              {taille}
            </button>
          ))}
        </div>
      </div>

      <div className="groupe-filtre">
        <div className="groupe-filtre-titre mono">
          <span>BUDGET ESPÈCES</span>
          <span>
            {budget.min} € – {budget.max} €
          </span>
        </div>
        <div className="rail-budget">
          <div
            className="rail-budget-segment"
            style={{
              left: `${((budget.min - bornesPrix.min) / (bornesPrix.max - bornesPrix.min || 1)) * 100}%`,
              right: `${100 - ((budget.max - bornesPrix.min) / (bornesPrix.max - bornesPrix.min || 1)) * 100}%`,
            }}
          />
          <input
            type="range"
            min={bornesPrix.min}
            max={bornesPrix.max}
            value={budget.min}
            onChange={(e) => setBudget((b) => ({ ...b, min: Math.min(Number(e.target.value), b.max) }))}
          />
          <input
            type="range"
            min={bornesPrix.min}
            max={bornesPrix.max}
            value={budget.max}
            onChange={(e) => setBudget((b) => ({ ...b, max: Math.max(Number(e.target.value), b.min) }))}
          />
        </div>
      </div>

      <div className="groupe-filtre">
        <div className="groupe-filtre-titre mono">CONDITION MINIMALE</div>
        <div className="groupe-puces">
          {PALIERS_CONDITION.map((palier) => (
            <button
              key={palier}
              type="button"
              className={`puce-filtre ${conditionMin === palier ? "actif chrome-selection" : ""}`}
              onClick={() => setConditionMin((c) => (c === palier ? null : palier))}
            >
              {palier}+
            </button>
          ))}
        </div>
      </div>

      <div className="groupe-filtre">
        <div className="groupe-filtre-titre mono">MODE DE REMISE</div>
        <div className="groupe-puces">
          {MODES_REMISE.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`puce-filtre ${modesChoisis.has(mode) ? "actif chrome-selection" : ""}`}
              onClick={() => basculerMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="bouton-validation chrome-bouton" onClick={() => router.push("/")}>
        Voir {resultats.length} pièce{resultats.length > 1 ? "s" : ""}
      </button>
    </div>
  );
}
