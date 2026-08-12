import { redirect } from "next/navigation";
import Link from "next/link";
import { estAdminConnecte } from "@/lib/auth";
import { commandesConfirmees, calculerTotaux } from "@/lib/commandes";
import { libelleModeRemise } from "@/lib/config";
import { FORMATEUR_PRIX } from "@/lib/formatage";
import BoutonMarquerRemis from "@/components/ui/BoutonMarquerRemis";

export const dynamic = "force-dynamic";

export default async function PageAdminCommandes() {
  if (!(await estAdminConnecte())) redirect("/admin/connexion");
  const commandes = await commandesConfirmees();

  return (
    <div className="admin">
      <div className="admin-entete">
        <h1>Commandes</h1>
        <Link href="/admin" className="admin-bouton">
          ← Retour
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Commande</th>
            <th>Pièces</th>
            <th>Créneau</th>
            <th>Remise</th>
            <th>Total</th>
            <th>Code</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {commandes.map((commande) => {
            const { total } = calculerTotaux(commande);
            const mode = libelleModeRemise(commande.modeRemise);
            return (
              <tr key={commande.id}>
                <td className="mono">{commande.id.slice(-8).toUpperCase()}</td>
                <td>{commande.lignes.map((l) => `${l.nom} (${l.taille})`).join(", ")}</td>
                <td>{commande.creneau}</td>
                <td>{mode?.titre ?? "—"}</td>
                <td className="mono">{FORMATEUR_PRIX.format(total)}</td>
                <td className="mono">{commande.codeRemise}</td>
                <td>{commande.statut}</td>
                <td>{commande.statut === "confirmee" && <BoutonMarquerRemis id={commande.id} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {commandes.length === 0 && (
        <p style={{ color: "var(--texte-discret)", marginTop: 20 }}>Aucune commande confirmée pour l'instant.</p>
      )}
    </div>
  );
}
