import { contact } from "@/lib/data";

export default function Pied() {
  return (
    <footer className="pied">
      <div className="pied__contenu">
        <span>
          © {new Date().getFullYear()} {contact.raisonSociale} — {contact.baseline}
        </span>
        <span>
          {contact.adresse.ligne1}, {contact.adresse.codePostal}{" "}
          {contact.adresse.ville} — {contact.telephone}
        </span>
      </div>
    </footer>
  );
}
