import { redirect } from "next/navigation";
import Link from "next/link";
import { estAdminConnecte } from "@/lib/auth";
import { listerProduits } from "@/lib/produits";
import { verificationsEnAttente } from "@/lib/commandes";
import { FORMATEUR_PRIX, prixAffiche } from "@/lib/formatage";

export const dynamic = "force-dynamic";

export default async function PageAdmin() {
  if (!(await estAdminConnecte())) redirect("/admin/connexion");
  const produits = await listerProduits();
  const enAttente = await verificationsEnAttente();

  return (
    <div className="admin">
      <div className="admin-entete">
        <h1>ATELIER 909 — Back-office</h1>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className="admin-bouton">
            Se déconnecter
          </button>
        </form>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Link href="/admin/produit/nouveau" className="admin-lien-bouton">
          + Ajouter une pièce
        </Link>
        <Link href="/admin/commandes" className="admin-lien-bouton">
          Commandes
        </Link>
        <Link href="/admin/verifications" className="admin-lien-bouton" style={enAttente.length > 0 ? { borderColor: "var(--accent-alerte)", color: "var(--accent-alerte)" } : undefined}>
          Vérifications{enAttente.length > 0 ? ` (${enAttente.length})` : ""}
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Réf</th>
            <th>Pièce</th>
            <th>Prix</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {produits.map((p) => (
            <tr key={p.ref}>
              <td className="mono">{p.ref}</td>
              <td>
                {p.marque} — {p.nom}
              </td>
              <td className="mono">
                {prixAffiche(p) != null ? FORMATEUR_PRIX.format(prixAffiche(p)) : "—"}
              </td>
              <td>{p.statut}</td>
              <td>
                <Link href={`/admin/produit/${p.ref}`} className="admin-bouton" style={{ display: "inline-block" }}>
                  Modifier
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {produits.length === 0 && (
        <p style={{ color: "var(--texte-discret)", marginTop: 20 }}>Aucune pièce pour l'instant.</p>
      )}
    </div>
  );
}
