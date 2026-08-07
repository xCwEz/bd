import { navigation } from "@/lib/data";

export default function Entete() {
  return (
    <header className="entete">
      <a className="entete__marque" href="#top" aria-label="BGF, retour en haut">
        BG<span className="accent">F</span>
      </a>
      <nav className="entete__nav" aria-label="Navigation principale">
        {navigation.map((lien) => (
          <a key={lien.href} className="entete__lien" href={lien.href}>
            {lien.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
