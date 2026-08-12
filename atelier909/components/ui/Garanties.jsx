const GARANTIES = [
  { numero: "01", texte: "Paiement en espèces, à la remise en main propre." },
  { numero: "02", texte: "Aucune identité demandée en dessous de 500 €." },
  { numero: "03", texte: "Audit public de la boutique, sur demande." },
];

export default function Garanties() {
  return (
    <div className="garanties">
      {GARANTIES.map((g) => (
        <div key={g.numero} className="garantie">
          <span className="garantie-numero mono">{g.numero}</span>
          <span className="garantie-texte">{g.texte}</span>
        </div>
      ))}
    </div>
  );
}
