"use client";

import { useEffect, useRef } from "react";

/**
 * Visuel photographique d'un bloc de service, monté en trois couches :
 *
 *   1. l'image, décalée verticalement selon sa position dans le viewport ;
 *   2. un voile de lumière froide, décalé en sens inverse et plus lentement ;
 *   3. un filet rouge qui se tend à la révélation.
 *
 * Seules `transform` et `opacity` sont animées, toujours en translate3d :
 * la composition reste sur le GPU. Le calcul est amorti par requestAnimationFrame,
 * et l'écouteur de scroll est passif.
 */
export default function VisuelParallaxe({
  src,
  alt,
  prioritaire = false,
  amplitude = 46,
  immobile = false,
}) {
  const cadre = useRef(null);
  const image = useRef(null);
  const voile = useRef(null);

  useEffect(() => {
    if (immobile) return undefined;

    const elementCadre = cadre.current;
    const elementImage = image.current;
    const elementVoile = voile.current;
    if (!elementCadre || !elementImage) return undefined;

    let trame = 0;

    const placer = () => {
      trame = 0;
      const rect = elementCadre.getBoundingClientRect();
      const hauteurVue = window.innerHeight || 1;
      // -1 quand le bloc est en bas de l'écran, +1 quand il en sort par le haut.
      const position = (rect.top + rect.height / 2 - hauteurVue / 2) / (hauteurVue / 2);
      const borne = Math.max(-1, Math.min(1, position));

      elementImage.style.transform = `translate3d(0, ${(borne * amplitude).toFixed(2)}px, 0) scale(1.16)`;
      if (elementVoile) {
        elementVoile.style.transform = `translate3d(0, ${(borne * -amplitude * 0.45).toFixed(2)}px, 0)`;
        elementVoile.style.opacity = (0.55 - Math.abs(borne) * 0.3).toFixed(3);
      }
    };

    const surDefilement = () => {
      if (!trame) trame = requestAnimationFrame(placer);
    };

    placer();
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);

    return () => {
      if (trame) cancelAnimationFrame(trame);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
    };
  }, [amplitude, immobile]);

  return (
    <div ref={cadre} className="parallaxe">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={image}
        className="parallaxe__image"
        src={src}
        alt={alt}
        loading={prioritaire ? "eager" : "lazy"}
        decoding={prioritaire ? "sync" : "async"}
        fetchPriority={prioritaire ? "high" : "auto"}
        draggable="false"
      />
      <span ref={voile} className="parallaxe__lumiere" aria-hidden="true" />
      <span className="parallaxe__grain" aria-hidden="true" />
      <span className="parallaxe__cadre" aria-hidden="true" />
    </div>
  );
}
