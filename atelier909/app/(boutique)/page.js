import Entete from "@/components/ui/Entete";
import CatalogueClient from "@/components/ui/CatalogueClient";
import { listerProduitsEnLigne } from "@/lib/produits";

export const dynamic = "force-dynamic";

export default async function PageCatalogue() {
  const produits = await listerProduitsEnLigne();

  return (
    <>
      <Entete />
      <CatalogueClient produits={produits} />
    </>
  );
}
