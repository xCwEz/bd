export default function EcranAttente({ titre, texte }) {
  return (
    <div className="ecran-attente">
      <p className="ecran-attente-titre">{titre}</p>
      <p className="ecran-attente-texte">{texte}</p>
    </div>
  );
}
