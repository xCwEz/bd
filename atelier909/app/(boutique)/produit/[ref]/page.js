import { notFound } from "next/navigation";
import EnTeteMedia from "@/components/ui/EnTeteMedia";
import BandeVignettes from "@/components/ui/BandeVignettes";
import BlocCondition from "@/components/ui/BlocCondition";
import SelecteurTaille from "@/components/ui/SelecteurTaille";
import Garanties from "@/components/ui/Garanties";
import { trouverProduit } from "@/lib/produits";

export const dynamic = "force-dynamic";

export default async function PageProduit({ params }) {
  const { ref } = await params;
  const produit = await trouverProduit(ref);
  if (!produit || produit.statut !== "en_ligne") notFound();

  return (
    <>
      <EnTeteMedia produit={produit} />
      <BandeVignettes medias={produit.medias} />
      <div className="fiche-titre">
        <div className="fiche-ref mono">
          {produit.ref} — {produit.marque} · {produit.annee}
        </div>
        <h1 className="fiche-nom">{produit.nom}</h1>
        <p className="fiche-description">{produit.description}</p>
      </div>
      <BlocCondition score={produit.conditionScore} commentaire={produit.conditionCommentaire} />
      <SelecteurTaille variantes={produit.variantes} />
      <Garanties />
    </>
  );
}
