import { redirect, notFound } from "next/navigation";
import { estAdminConnecte } from "@/lib/auth";
import { trouverProduit } from "@/lib/produits";
import EditeurProduit from "@/components/ui/EditeurProduit";

export const dynamic = "force-dynamic";

const PRODUIT_VIERGE = {
  ref: "",
  marque: "",
  annee: new Date().getFullYear(),
  nom: "",
  description: "",
  conditionScore: 8,
  conditionCommentaire: "",
  statut: "brouillon",
  badge: null,
  variantes: [{ taille: "", prix: "", stock: 0 }],
  medias: [],
};

export default async function PageEditionProduit({ params }) {
  if (!(await estAdminConnecte())) redirect("/admin/connexion");
  const { ref } = await params;

  if (ref === "nouveau") {
    return <EditeurProduit produitInitial={PRODUIT_VIERGE} nouveau />;
  }

  const produit = await trouverProduit(ref);
  if (!produit) notFound();
  return <EditeurProduit produitInitial={produit} />;
}
