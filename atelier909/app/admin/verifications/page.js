import { redirect } from "next/navigation";
import Link from "next/link";
import { estAdminConnecte } from "@/lib/auth";
import { verificationsEnAttente, calculerTotaux } from "@/lib/commandes";
import CarteVerification from "@/components/ui/CarteVerification";

export const dynamic = "force-dynamic";

export default async function PageAdminVerifications() {
  if (!(await estAdminConnecte())) redirect("/admin/connexion");
  const commandes = (await verificationsEnAttente()).map((c) => ({ ...c, totaux: calculerTotaux(c) }));

  return (
    <div className="admin">
      <div className="admin-entete">
        <h1>Vérifications d'identité</h1>
        <Link href="/admin" className="admin-bouton">
          ← Retour
        </Link>
      </div>

      {commandes.map((commande) => (
        <CarteVerification key={commande.id} commande={commande} />
      ))}

      {commandes.length === 0 && (
        <p style={{ color: "var(--texte-discret)" }}>Aucune vérification en attente.</p>
      )}
    </div>
  );
}
