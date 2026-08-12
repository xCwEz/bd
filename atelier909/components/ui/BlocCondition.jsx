export default function BlocCondition({ score, commentaire }) {
  return (
    <div className="bloc-condition">
      <div className="bloc-condition-ligne">
        <span className="bloc-condition-label mono">SCORE DE CONDITION</span>
        <span className="bloc-condition-note mono">
          {score}
          <span className="bloc-condition-note-sur10">/10</span>
        </span>
      </div>
      <div className="bloc-condition-segments">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`bloc-condition-segment ${i < score ? "rempli" : ""}`}
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
      {commentaire && <p className="bloc-condition-commentaire">{commentaire}</p>}
    </div>
  );
}
