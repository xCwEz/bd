"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FORMATEUR_PRIX } from "@/lib/formatage";

export default function CarteVerification({ commande }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function agir(action) {
    setEnCours(true);
    await fetch(`/api/admin/verifications/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: commande.id }),
    });
    router.refresh();
  }

  const acheteur = commande.acheteur?.username
    ? `@${commande.acheteur.username}`
    : commande.acheteur?.prenom || commande.telegramUserId;

  return (
    <div className="admin-carte-verification">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="admin-verification-photo" src={`/api/admin/verifications/photo/${commande.id}`} alt="Pièce d'identité soumise" />
      <div className="admin-verification-corps">
        <div className="mono" style={{ fontSize: 12, color: "var(--texte-discret)" }}>
          {commande.id.slice(-8).toUpperCase()} · envoyée le {new Date(commande.verification.envoyeeLe).toLocaleString("fr-FR")}
        </div>
        <div style={{ marginTop: 6, fontWeight: 600 }}>Acheteur : {acheteur}</div>
        <div style={{ marginTop: 6 }}>{commande.lignes.map((l) => `${l.nom} (${l.taille})`).join(", ")}</div>
        <div className="mono" style={{ marginTop: 6 }}>Total : {FORMATEUR_PRIX.format(commande.totaux.total)}</div>

        <div className="admin-verification-actions">
          <button type="button" className="admin-bouton admin-bouton-positif" disabled={enCours} onClick={() => agir("valider")}>
            Valider
          </button>
          <button type="button" className="admin-bouton admin-bouton-danger" disabled={enCours} onClick={() => agir("refuser")}>
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
