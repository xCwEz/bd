import Link from "next/link";

export default function IntrouvableGlobal() {
  return (
    <div className="ecran-404">
      <span className="ecran-404-code mono">404</span>
      <p className="ecran-404-titre">Page introuvable</p>
      <Link href="/" className="ecran-404-lien">
        Retour au catalogue
      </Link>
    </div>
  );
}
