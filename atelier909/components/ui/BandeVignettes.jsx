import MediaPlaceholder from "./MediaPlaceholder";

export default function BandeVignettes({ medias }) {
  if (!medias || medias.length === 0) return null;

  const visibles = medias.slice(0, 5);
  const restant = medias.length - visibles.length;

  return (
    <div className="bande-vignettes">
      {visibles.map((media, i) => {
        const estDerniereAvecReste = i === visibles.length - 1 && restant > 0;
        return (
          <div key={i} className={`vignette ${i === 0 ? "active" : ""}`}>
            <MediaPlaceholder graine={i + 1} cle={media.cle} />
            {i === 0 && <span className="vignette-glyphe">▶</span>}
            {estDerniereAvecReste && <span className="vignette-plus">+{restant}</span>}
          </div>
        );
      })}
    </div>
  );
}
