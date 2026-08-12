import Link from "next/link";

export default function IntrouvableBoutique() {
  return (
    <div className="ecran-404">
      <span className="ecran-404-code mono">404</span>
      <p className="ecran-404-titre">Cette pièce n'est plus disponible</p>
      <Link href="/" className="ecran-404-lien">
        Retour au catalogue
      </Link>
    </div>
  );
}
