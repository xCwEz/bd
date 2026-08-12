"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUTS = ["brouillon", "en_ligne", "reserve", "vendu", "retire"];
const BADGES = [
  { valeur: "", label: "Aucun" },
  { valeur: "video", label: "VIDÉO" },
  { valeur: "1_piece", label: "1 PIÈCE" },
];

export default function EditeurProduit({ produitInitial, nouveau = false }) {
  const router = useRouter();
  const [produit, setProduit] = useState(produitInitial);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  function majChamp(champ, valeur) {
    setProduit((p) => ({ ...p, [champ]: valeur }));
  }

  function majVariante(index, champ, valeur) {
    setProduit((p) => {
      const variantes = [...p.variantes];
      variantes[index] = { ...variantes[index], [champ]: valeur };
      return { ...p, variantes };
    });
  }

  function ajouterVariante() {
    setProduit((p) => ({ ...p, variantes: [...p.variantes, { taille: "", prix: "", stock: 0 }] }));
  }

  function retirerVariante(index) {
    setProduit((p) => ({ ...p, variantes: p.variantes.filter((_, i) => i !== index) }));
  }

  function deplacerMedia(index, direction) {
    setProduit((p) => {
      const medias = [...p.medias];
      const cible = index + direction;
      if (cible < 0 || cible >= medias.length) return p;
      [medias[index], medias[cible]] = [medias[cible], medias[index]];
      medias.forEach((m, i) => (m.ordre = i + 1));
      return { ...p, medias };
    });
  }

  function retirerMedia(index) {
    setProduit((p) => {
      const medias = p.medias.filter((_, i) => i !== index);
      medias.forEach((m, i) => (m.ordre = i + 1));
      return { ...p, medias };
    });
  }

  async function televerserMedia(fichier) {
    if (!produit.ref) {
      setErreur("Renseignez la référence de la pièce avant d'ajouter un média.");
      return;
    }
    const donnees = new FormData();
    donnees.append("ref", produit.ref);
    donnees.append("fichier", fichier);
    const reponse = await fetch("/api/admin/upload", { method: "POST", body: donnees });
    if (!reponse.ok) {
      setErreur("Échec du téléversement.");
      return;
    }
    const { cle, type } = await reponse.json();
    setProduit((p) => ({
      ...p,
      medias: [...p.medias, { type, cle, ordre: p.medias.length + 1 }],
    }));
  }

  async function enregistrer(e) {
    e.preventDefault();
    setErreur(null);
    if (!produit.ref) {
      setErreur("La référence est obligatoire.");
      return;
    }
    setEnvoi(true);
    const corps = {
      ...produit,
      annee: Number(produit.annee),
      conditionScore: Number(produit.conditionScore),
      badge: produit.badge || null,
      variantes: produit.variantes
        .filter((v) => v.taille)
        .map((v) => ({
          taille: v.taille,
          prix: v.prix === "" || v.prix === null ? null : Number(v.prix),
          stock: Number(v.stock) || 0,
        })),
    };
    const reponse = await fetch("/api/admin/produits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit: corps, refOriginale: nouveau ? null : produitInitial.ref }),
    });
    setEnvoi(false);
    if (!reponse.ok) {
      const { message } = await reponse.json().catch(() => ({}));
      setErreur(message || "Échec de l'enregistrement.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin">
      <div className="admin-entete">
        <h1>{nouveau ? "Nouvelle pièce" : `Modifier ${produitInitial.ref}`}</h1>
        <a href="/admin" className="admin-bouton">
          ← Retour
        </a>
      </div>

      <form onSubmit={enregistrer}>
        <div className="admin-champ">
          <label>Référence</label>
          <input
            value={produit.ref}
            disabled={!nouveau}
            onChange={(e) => majChamp("ref", e.target.value.toUpperCase())}
            placeholder="SI-94-ICE"
            required
          />
        </div>

        <div className="admin-champ">
          <label>Marque</label>
          <input value={produit.marque} onChange={(e) => majChamp("marque", e.target.value)} required />
        </div>

        <div className="admin-champ">
          <label>Année</label>
          <input type="number" value={produit.annee} onChange={(e) => majChamp("annee", e.target.value)} required />
        </div>

        <div className="admin-champ">
          <label>Nom</label>
          <input value={produit.nom} onChange={(e) => majChamp("nom", e.target.value)} required />
        </div>

        <div className="admin-champ">
          <label>Description</label>
          <textarea rows={3} value={produit.description} onChange={(e) => majChamp("description", e.target.value)} />
        </div>

        <div className="admin-champ">
          <label>Score de condition (0–10)</label>
          <input
            type="number"
            min={0}
            max={10}
            value={produit.conditionScore}
            onChange={(e) => majChamp("conditionScore", e.target.value)}
          />
        </div>

        <div className="admin-champ">
          <label>Commentaire de condition</label>
          <input value={produit.conditionCommentaire} onChange={(e) => majChamp("conditionCommentaire", e.target.value)} />
        </div>

        <div className="admin-champ">
          <label>Statut</label>
          <select value={produit.statut} onChange={(e) => majChamp("statut", e.target.value)}>
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-champ">
          <label>Badge</label>
          <select value={produit.badge || ""} onChange={(e) => majChamp("badge", e.target.value)}>
            {BADGES.map((b) => (
              <option key={b.valeur} value={b.valeur}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-champ">
          <label>Tailles, prix et stock</label>
          {produit.variantes.map((v, i) => (
            <div key={i} className="admin-variante-ligne">
              <input
                placeholder="Taille"
                value={v.taille}
                onChange={(e) => majVariante(i, "taille", e.target.value)}
                style={{ width: 70 }}
              />
              <input
                placeholder="Prix €"
                type="number"
                value={v.prix ?? ""}
                onChange={(e) => majVariante(i, "prix", e.target.value)}
                style={{ width: 90 }}
              />
              <input
                placeholder="Stock"
                type="number"
                value={v.stock}
                onChange={(e) => majVariante(i, "stock", e.target.value)}
                style={{ width: 70 }}
              />
              <button type="button" className="admin-bouton admin-bouton-danger" onClick={() => retirerVariante(i)}>
                Retirer
              </button>
            </div>
          ))}
          <button type="button" className="admin-bouton" onClick={ajouterVariante}>
            + Taille
          </button>
        </div>

        <div className="admin-champ">
          <label>Médias (photos et vidéo)</label>
          {produit.medias.map((m, i) => (
            <div key={i} className="admin-media-ligne">
              <span className="mono" style={{ fontSize: 12 }}>
                {i + 1}. {m.type} — {m.cle}
              </span>
              <button type="button" className="admin-bouton" onClick={() => deplacerMedia(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button
                type="button"
                className="admin-bouton"
                onClick={() => deplacerMedia(i, 1)}
                disabled={i === produit.medias.length - 1}
              >
                ↓
              </button>
              <button type="button" className="admin-bouton admin-bouton-danger" onClick={() => retirerMedia(i)}>
                Retirer
              </button>
            </div>
          ))}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const fichier = e.target.files?.[0];
              if (fichier) televerserMedia(fichier);
              e.target.value = "";
            }}
          />
        </div>

        {erreur && <p style={{ color: "var(--accent-alerte)", marginBottom: 12 }}>{erreur}</p>}

        <button type="submit" className="chrome-bouton" disabled={envoi} style={{ padding: 13, borderRadius: 10, fontWeight: 700, width: "100%" }}>
          {envoi ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
