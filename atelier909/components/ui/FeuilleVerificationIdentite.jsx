"use client";

import { useState } from "react";

const DOCUMENTS = ["Carte d'identité", "Passeport", "Permis de conduire", "Titre de séjour"];

const REGLES = [
  "Photo prise directement dans l'app, jamais importée depuis la galerie.",
  "Document entier et lisible : une photo floue ou coupée sera refusée.",
  "En cas de refus, le panier est libéré et la pièce repart en ligne.",
];

export default function FeuilleVerificationIdentite({ onFermer, onEnvoye }) {
  const [fichier, setFichier] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  function choisirPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFichier(f);
    setApercu(URL.createObjectURL(f));
    setErreur(null);
  }

  async function envoyer() {
    if (!fichier) return;
    setEnvoi(true);
    setErreur(null);
    const donnees = new FormData();
    donnees.append("photo", fichier);
    try {
      const reponse = await fetch("/api/panier/verification", { method: "POST", body: donnees });
      const corps = await reponse.json();
      if (!reponse.ok) {
        setErreur(corps.message || "Échec de l'envoi.");
        setEnvoi(false);
        return;
      }
      onEnvoye(corps.commande);
    } catch {
      setErreur("Connexion impossible. Réessayez.");
      setEnvoi(false);
    }
  }

  return (
    <>
      <div className="voile-feuille" onClick={onFermer} />
      <div className="feuille" role="dialog" aria-modal="true">
        <div className="feuille-poignee" />
        <div className="feuille-entete">
          <h2 className="feuille-titre">Pièce d'identité demandée pour cette commande</h2>
          <button type="button" className="feuille-fermer" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </div>
        <p className="feuille-texte">
          Contrôle appliqué à partir de 500 €. Il limite les faux comptes et les arnaques. La photo est supprimée dès
          la remise effectuée.
        </p>

        <div className="documents-titre mono">DOCUMENTS ACCEPTÉS</div>
        <div className="documents-puces">
          {DOCUMENTS.map((d) => (
            <span key={d} className="puce-filtre">
              {d}
            </span>
          ))}
        </div>

        <label className={`cadre-prise-vue ${apercu ? "avec-apercu" : ""}`}>
          {apercu ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apercu} alt="Aperçu de la pièce d'identité" />
          ) : (
            <div className="cadre-prise-vue-gabarit">
              <div className="maquette-carte">
                <span className="maquette-carte-ligne" />
                <span className="maquette-carte-ligne" style={{ width: 22 }} />
                <span className="maquette-carte-ligne" style={{ width: 28 }} />
              </div>
            </div>
          )}
          <span className="cadre-prise-vue-legende mono">RECTO · ALIGNER SUR LE GABARIT</span>
          <input type="file" accept="image/*" capture="environment" onChange={choisirPhoto} />
        </label>

        <div className="regles-verification">
          {REGLES.map((regle, i) => (
            <div key={i} className="regle-verification">
              <span className="regle-verification-numero mono">0{i + 1}</span>
              <span>{regle}</span>
            </div>
          ))}
        </div>

        {erreur && <p className="barre-action-produit-erreur" style={{ position: "static", marginTop: 16 }}>{erreur}</p>}

        <button type="button" className="bouton-verification chrome-bouton" disabled={!fichier || envoi} onClick={envoyer}>
          {envoi ? "Envoi…" : "Vérifier mon identité"}
        </button>
        <p className="mention-verification">Notification Telegram dès la validation. Aucun autre usage du document.</p>
      </div>
    </>
  );
}
