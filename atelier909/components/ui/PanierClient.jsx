"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MediaPlaceholder from "./MediaPlaceholder";
import EcranAttente from "./EcranAttente";
import { FORMATEUR_PRIX } from "@/lib/formatage";
import { MODES_REMISE } from "@/lib/config";
import { assurerSession } from "@/lib/panier-client";

function formaterDureeRestante(ms) {
  if (ms <= 0) return "00:00:00";
  const heures = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const secondes = Math.floor((ms % 60_000) / 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(heures)}:${p(minutes)}:${p(secondes)}`;
}

export default function PanierClient() {
  const router = useRouter();
  const [etat, setEtat] = useState({ chargement: true, commande: null, totaux: null, seuil: 500 });
  const [restant, setRestant] = useState(0);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(async () => {
    await assurerSession();
    const reponse = await fetch("/api/panier");
    const donnees = await reponse.json();
    setEtat({
      chargement: false,
      commande: donnees.commande,
      totaux: donnees.totaux ?? null,
      seuil: donnees.seuilVerification ?? 500,
    });
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    if (!etat.commande?.reservationExpire) return;
    const tick = () => {
      const ms = new Date(etat.commande.reservationExpire).getTime() - Date.now();
      setRestant(ms);
      if (ms <= 0) charger();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [etat.commande?.reservationExpire, charger]);

  async function retirer(index) {
    setEnCours(true);
    const reponse = await fetch("/api/panier/retirer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const donnees = await reponse.json();
    setEnCours(false);
    if (reponse.ok) setEtat((e) => ({ ...e, commande: donnees.commande, totaux: donnees.totaux }));
  }

  async function choisirMode(mode) {
    setEnCours(true);
    const reponse = await fetch("/api/panier/mode-remise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const donnees = await reponse.json();
    setEnCours(false);
    if (reponse.ok) setEtat((e) => ({ ...e, commande: donnees.commande, totaux: donnees.totaux }));
  }

  if (etat.chargement) return null;

  const { commande, totaux, seuil } = etat;

  if (!commande || commande.lignes.length === 0) {
    return (
      <EcranAttente
        titre="Panier vide"
        texte="Réservez une pièce depuis le catalogue pour la retrouver ici pendant 12 h."
      />
    );
  }

  const identiteRequise = totaux.total >= seuil;

  return (
    <div className="ecran-panier">
      <h1 className="panier-titre">Panier</h1>
      <p className="panier-compte-rebours mono">
        RÉSERVÉ 12H — <span className="panier-compte-rebours-temps">{formaterDureeRestante(restant)}</span> restant
      </p>

      {commande.lignes.map((ligne, index) => (
        <div key={`${ligne.ref}-${ligne.taille}-${index}`} className="ligne-article">
          <div className="ligne-article-vignette">
            <MediaPlaceholder graine={index} />
          </div>
          <div className="ligne-article-corps">
            <span className="ligne-article-marque mono">{ligne.marque}</span>
            <span className="ligne-article-nom">{ligne.nom}</span>
            <span className="ligne-article-taille">Taille {ligne.taille}</span>
            <span className="ligne-article-prix mono">{FORMATEUR_PRIX.format(ligne.prixUnitaire)}</span>
          </div>
          <button type="button" className="ligne-article-retirer" disabled={enCours} onClick={() => retirer(index)}>
            Retirer
          </button>
        </div>
      ))}

      <div className="groupe-remise">
        {MODES_REMISE.map((mode) => {
          const selectionne = commande.modeRemise === mode.cle;
          return (
            <button
              key={mode.cle}
              type="button"
              disabled={enCours}
              className={`option-remise ${selectionne ? "selectionnee" : ""}`}
              onClick={() => choisirMode(mode.cle)}
            >
              <div className="option-remise-ligne">
                <span className="option-remise-titre">{mode.titre}</span>
                <span className="option-remise-frais mono">
                  {FRAIS_LABEL(mode.cle)}
                </span>
              </div>
              <p className="option-remise-description">{mode.description}</p>
            </button>
          );
        })}
      </div>

      <div className="recapitulatif">
        <div className="recap-ligne">
          <span>Sous-total</span>
          <span className="mono">{FORMATEUR_PRIX.format(totaux.sousTotal)}</span>
        </div>
        <div className="recap-ligne">
          <span>Remise</span>
          <span className="mono">{totaux.frais > 0 ? `+ ${FORMATEUR_PRIX.format(totaux.frais)}` : "—"}</span>
        </div>
        <div className="recap-total">
          <span className="recap-total-label">Espèces à prévoir</span>
          <span className="recap-total-valeur mono">{FORMATEUR_PRIX.format(totaux.total)}</span>
        </div>
        <p className="recap-mention">Montant exact recommandé. Pas de monnaie rendue au-delà de 20 €.</p>
      </div>

      {identiteRequise && (
        <div className="encart-identite">
          <span className="encart-identite-prefixe mono">ID</span>
          <p className="encart-identite-texte">
            Pièce d'identité demandée au-delà de {FORMATEUR_PRIX.format(seuil)}. Cette étape n'est pas encore
            disponible dans la boutique — la commande ne peut pas être confirmée pour l'instant.
          </p>
        </div>
      )}

      <button
        type="button"
        className="bouton-panier-principal chrome-bouton"
        disabled={identiteRequise || !commande.modeRemise || enCours}
        onClick={() => router.push("/panier/rendez-vous")}
      >
        {identiteRequise ? "Vérification d'identité indisponible" : "Convenir de la remise"}
      </button>
      {!identiteRequise && !commande.modeRemise && (
        <p className="recap-mention" style={{ textAlign: "center" }}>
          Choisissez un mode de remise pour continuer.
        </p>
      )}
    </div>
  );
}

function FRAIS_LABEL(cle) {
  const valeurs = { point_neutre: "Gratuit", casier: "+ 8 €", relais: "+ 5 €", coursier: "+ 22 €" };
  return valeurs[cle] ?? "";
}
