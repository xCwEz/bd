"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FORMATEUR_PRIX } from "@/lib/formatage";
import { HANDLE_OPERATEUR, ZONE_APPROXIMATIVE, SEUIL_VERIFICATION_ID, genererCreneaux, repartirEnCoupures } from "@/lib/config";
import { assurerSession } from "@/lib/panier-client";

export default function RendezVousClient() {
  const router = useRouter();
  const [totaux, setTotaux] = useState(null);
  const [creneauChoisi, setCreneauChoisi] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const creneaux = useMemo(() => genererCreneaux(), []);

  useEffect(() => {
    (async () => {
      await assurerSession();
      const reponse = await fetch("/api/panier");
      const donnees = await reponse.json();
      const total = donnees.totaux?.total ?? 0;
      if (!donnees.commande || donnees.commande.lignes.length === 0 || !donnees.commande.modeRemise || total >= SEUIL_VERIFICATION_ID) {
        router.replace("/panier");
        return;
      }
      setTotaux(donnees.totaux);
    })();
  }, [router]);

  async function verrouiller() {
    if (!creneauChoisi) return;
    setEnvoi(true);
    setErreur(null);
    const reponse = await fetch("/api/panier/rendez-vous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creneau: creneauChoisi }),
    });
    const donnees = await reponse.json();
    if (!reponse.ok) {
      setErreur(donnees.message || "Impossible de confirmer le rendez-vous.");
      setEnvoi(false);
      return;
    }
    router.push("/compte");
  }

  if (!totaux) return null;

  const coupures = repartirEnCoupures(totaux.total);

  return (
    <div className="ecran-rdv">
      <Link href="/panier" className="rdv-retour mono">
        ← PANIER
      </Link>
      <h1 className="rdv-titre">Convenir de la remise</h1>

      <div className="carte-zone">
        <span className="carte-zone-cercle" />
        <span className="carte-zone-point" />
        <span className="carte-zone-legende mono">ZONE APPROXIMATIVE · {ZONE_APPROXIMATIVE}</span>
      </div>

      <div className="creneaux">
        {creneaux.map((creneau) => (
          <button
            key={creneau}
            type="button"
            className={`creneau ${creneauChoisi === creneau ? "actif chrome-selection" : ""}`}
            onClick={() => setCreneauChoisi(creneau)}
          >
            {creneau}
          </button>
        ))}
      </div>

      <div className="contact-operateur">
        <span className="contact-operateur-handle">{HANDLE_OPERATEUR}</span>
        <span className="contact-operateur-mention mono">SEUL IDENTIFIANT</span>
        <p className="contact-operateur-texte">Ni nom, ni adresse, ni téléphone ne sont conservés.</p>
      </div>

      <div className="especes-bloc">
        <div className="especes-titre mono">ESPÈCES À APPORTER</div>
        <div className="especes-total mono">{FORMATEUR_PRIX.format(totaux.total)}</div>
        <div className="puces-coupures">
          {coupures.map((c) => (
            <span key={c.coupure} className="puce-coupure mono">
              {c.nombre} × {c.coupure}
            </span>
          ))}
        </div>
      </div>

      {erreur && <p className="barre-action-produit-erreur" style={{ position: "static", marginTop: 16 }}>{erreur}</p>}

      <button
        type="button"
        className="bouton-verrouiller chrome-bouton"
        disabled={!creneauChoisi || envoi}
        onClick={verrouiller}
      >
        {envoi ? "Confirmation…" : "Verrouiller le rendez-vous"}
      </button>
      <p className="mention-effacement">Le fil de discussion s'efface 24 h après la remise.</p>
    </div>
  );
}
