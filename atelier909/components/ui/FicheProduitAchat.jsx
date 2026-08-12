"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SelecteurTaille from "./SelecteurTaille";
import { FORMATEUR_PRIX } from "@/lib/formatage";
import { assurerSession } from "@/lib/panier-client";

export default function FicheProduitAchat({ produit }) {
  const router = useRouter();
  const premiereDisponible = produit.variantes.find((v) => v.stock > 0)?.taille ?? null;
  const [tailleChoisie, setTailleChoisie] = useState(premiereDisponible);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  const variante = produit.variantes.find((v) => v.taille === tailleChoisie);

  async function reserver() {
    if (!variante || variante.stock <= 0) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await assurerSession();
      const reponse = await fetch("/api/panier/ajouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: produit.ref, taille: tailleChoisie }),
      });
      const donnees = await reponse.json();
      if (!reponse.ok) {
        setErreur(donnees.message || "Impossible de réserver cette pièce.");
        setEnvoi(false);
        router.refresh();
        return;
      }
      router.push("/panier");
    } catch {
      setErreur("Connexion impossible. Réessayez.");
      setEnvoi(false);
    }
  }

  return (
    <>
      <SelecteurTaille variantes={produit.variantes} tailleChoisie={tailleChoisie} onChanger={setTailleChoisie} />

      {/* Espace réservé pour ne pas laisser la barre fixe recouvrir la suite de la fiche. */}
      <div style={{ height: 92 }} aria-hidden="true" />

      {erreur && <p className="barre-action-produit-erreur">{erreur}</p>}

      <div className="barre-action-produit">
        <div>
          <div className="barre-action-produit-taille mono">
            {tailleChoisie ? `TAILLE ${tailleChoisie}` : "ÉPUISÉ"}
          </div>
          <div className="barre-action-produit-prix mono">
            {variante?.prix != null ? FORMATEUR_PRIX.format(variante.prix) : "—"}
          </div>
        </div>
        <button
          type="button"
          className="barre-action-produit-bouton chrome-bouton"
          disabled={!variante || variante.stock <= 0 || envoi}
          onClick={reserver}
        >
          {envoi ? "Réservation…" : "Réserver la pièce"}
        </button>
      </div>
    </>
  );
}
