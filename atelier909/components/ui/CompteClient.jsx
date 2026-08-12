"use client";

import { useEffect, useState } from "react";
import MediaPlaceholder from "./MediaPlaceholder";
import EcranAttente from "./EcranAttente";
import { FORMATEUR_PRIX } from "@/lib/formatage";
import { libelleModeRemise } from "@/lib/config";
import { assurerSession } from "@/lib/panier-client";

const ETAPES = ["RÉSERVÉ", "VÉRIFIÉ", "RDV FIXÉ", "REMIS"];

function indexEtape(statut) {
  if (statut === "remise") return 3;
  if (statut === "confirmee") return 2; // RÉSERVÉ + VÉRIFIÉ (non requis) passés, RDV FIXÉ courant
  return 0;
}

function formaterMois(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" });
}

function formaterJour(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CompteClient() {
  const [donnees, setDonnees] = useState(null);

  useEffect(() => {
    (async () => {
      await assurerSession();
      const reponse = await fetch("/api/compte");
      setDonnees(await reponse.json());
    })();
  }, []);

  if (!donnees) return null;
  if (!donnees.profil) {
    return <EcranAttente titre="Compte" texte="Ouvrez ATELIER 909 depuis Telegram pour accéder à votre compte." />;
  }

  const { profil, compteurs, commandeEnCours, historique } = donnees;
  const etapeActuelle = commandeEnCours ? indexEtape(commandeEnCours.statut) : -1;
  const mode = commandeEnCours ? libelleModeRemise(commandeEnCours.modeRemise) : null;
  const totalCommande = commandeEnCours?.lignes.reduce((s, l) => s + l.prixUnitaire, 0) ?? 0;

  return (
    <div className="ecran-compte">
      <div className="compte-entete">
        <span className="compte-avatar chrome-surface" />
        <div>
          <div className="compte-handle-ligne">
            <span className="compte-handle">{profil.handle}</span>
          </div>
          {profil.membreDepuis && (
            <p className="compte-membre-depuis mono">MEMBRE DEPUIS {formaterMois(profil.membreDepuis)}</p>
          )}
        </div>
      </div>

      <div className="compte-compteurs">
        <div className="compte-compteur">
          <div className="compte-compteur-valeur mono">—</div>
          <div className="compte-compteur-label">Réputation</div>
        </div>
        <div className="compte-compteur">
          <div className="compte-compteur-valeur mono">{compteurs.dealsConclus}</div>
          <div className="compte-compteur-label">Deals conclus</div>
        </div>
        <div className="compte-compteur">
          <div className="compte-compteur-valeur mono" style={{ color: "var(--accent-positif)" }}>
            {compteurs.litiges}
          </div>
          <div className="compte-compteur-label">Litiges</div>
        </div>
      </div>

      {commandeEnCours && (
        <div className="commande-en-cours">
          <div className="commande-numero mono">CMD {commandeEnCours.id.slice(-8).toUpperCase()}</div>
          <div className="commande-intitule">
            {commandeEnCours.lignes[0].nom}
            {commandeEnCours.lignes.length > 1 ? ` et ${commandeEnCours.lignes.length - 1} autre(s)` : ""}
          </div>
          <div className="commande-montant mono">{FORMATEUR_PRIX.format(totalCommande)}</div>

          <div className="suivi-etapes">
            {ETAPES.map((etape, i) => (
              <div key={etape} style={{ display: "contents" }}>
                <div className="suivi-etape">
                  <span
                    className={`suivi-point ${i < etapeActuelle ? "passee" : ""} ${i === etapeActuelle ? "courante" : ""}`}
                  />
                  <span className="suivi-label mono">{etape}</span>
                </div>
                {i < ETAPES.length - 1 && <span className={`suivi-trait ${i < etapeActuelle ? "passe" : ""}`} />}
              </div>
            ))}
          </div>

          <div className="suivi-details">
            <span>Créneau : {commandeEnCours.creneau}</span>
            {mode && <span>Remise : {mode.titre}</span>}
            <span className="code-remise mono">CODE {commandeEnCours.codeRemise}</span>
          </div>
        </div>
      )}

      {historique.length > 0 && (
        <>
          <p className="historique-titre">Historique</p>
          {historique.map((commande) =>
            commande.lignes.map((ligne, i) => (
              <div key={`${commande.id}-${i}`} className="ligne-historique">
                <div className="ligne-historique-vignette">
                  <MediaPlaceholder graine={i} />
                </div>
                <div className="ligne-historique-corps">
                  <div className="ligne-historique-nom">{ligne.nom}</div>
                  <div className="ligne-historique-details mono">
                    {formaterJour(commande.dateRemise)} · TAILLE {ligne.taille}
                  </div>
                </div>
                <span className="ligne-historique-prix mono">{FORMATEUR_PRIX.format(ligne.prixUnitaire)}</span>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
