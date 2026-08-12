import RechercheClient from "@/components/ui/RechercheClient";
import { listerProduitsEnLigne } from "@/lib/produits";

export const dynamic = "force-dynamic";

export default async function PageRecherche() {
  const produits = await listerProduitsEnLigne();
  return <RechercheClient produits={produits} />;
}
