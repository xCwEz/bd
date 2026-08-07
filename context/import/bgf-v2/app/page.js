import Entete from "@/components/ui/Entete";
import Hero from "@/components/ui/Hero";
import Services from "@/components/ui/Services";
import Contact from "@/components/ui/Contact";
import Pied from "@/components/ui/Pied";
import { visuelsDisponibles } from "@/lib/visuelsDisponibles";

/**
 * Trois sections, et rien d'autre : l'entrée du garage, les cinq métiers,
 * le bureau. Tout le texte est rendu côté serveur — la 3D ne fait que
 * s'ajouter par-dessus une page déjà complète et lisible.
 */
export default function Page() {
  // Relevé côté serveur des visuels réellement présents sur le disque.
  const images = visuelsDisponibles();

  return (
    <>
      <Entete />
      <main>
        <Hero />
        <Services images={images} />
        <Contact />
      </main>
      <Pied />
    </>
  );
}
