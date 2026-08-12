const TEINTES = [
  ["#171a1d", "#0a0b0c"],
  ["#15181b", "#0c0d0f"],
  ["#191c1f", "#0b0c0e"],
  ["#13161a", "#0a0b0c"],
];

/**
 * Emplacement média procédural. Sert de repli tant qu'aucune vraie photo ou
 * vidéo n'a été fournie par l'opérateur (voir README, section Ressources).
 * `graine` fait varier la teinte et la durée du reflet pour éviter la
 * synchronisation visuelle entre cartes.
 */
export default function MediaPlaceholder({ graine = 0, cle = null, className = "" }) {
  if (cle) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cle} alt="" className={className} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
  }

  const [t1, t2] = TEINTES[graine % TEINTES.length];
  const duree = 5 + (graine % 6) * 0.5; // 5 à 7.5s, par pas de 0.5

  return (
    <div
      className={`emplacement-media ${className}`}
      style={{ "--teinte-1": t1, "--teinte-2": t2 }}
    >
      <div className="chrome-reflet" style={{ animationDuration: `${duree}s` }} />
    </div>
  );
}
