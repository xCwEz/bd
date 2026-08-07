"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useEnvironnement } from "@/lib/quality";
import { palier, useProgressionEntree } from "@/lib/scroll";
import ReplieStatique from "./ReplieStatique";

/* La scène n'est chargée qu'après le premier rendu : le texte est à l'écran
   avant que la moindre ligne de Three.js ne soit évaluée. */
const SceneHero = dynamic(() => import("@/components/three/SceneHero"), {
  ssr: false,
});

export default function Hero() {
  const environnement = useEnvironnement();
  const section = useRef(null);
  const voile = useRef(null);
  const [sceneMontee, setSceneMontee] = useState(false);

  const anime =
    environnement.pret && environnement.webgl && !environnement.mouvementReduit;

  // Estompe du logo et de l'invite sur les 15 premiers pour cent.
  const surProgression = useCallback((p) => {
    if (!voile.current) return;
    const restant = 1 - palier(p, 0, 0.15);
    voile.current.style.opacity = String(restant);
    voile.current.style.transform = `translateY(${-p * 46}px)`;
    voile.current.style.visibility = restant < 0.02 ? "hidden" : "visible";
  }, []);

  const progression = useProgressionEntree(section, {
    actif: anime,
    onProgression: surProgression,
  });

  useEffect(() => {
    if (!environnement.pret || !environnement.webgl) return undefined;
    // Deux images d'attente : le premier rendu HTML est peint, ensuite
    // seulement on paie l'initialisation WebGL.
    let interne;
    const externe = requestAnimationFrame(() => {
      interne = requestAnimationFrame(() => setSceneMontee(true));
    });
    return () => {
      cancelAnimationFrame(externe);
      if (interne) cancelAnimationFrame(interne);
    };
  }, [environnement.pret, environnement.webgl]);

  return (
    <section
      id="top"
      ref={section}
      className={`hero${anime ? "" : " hero--fige"}`}
      aria-label="Entrée du garage BGF"
    >
      <div className="hero__cadre">
        {environnement.pret && !environnement.webgl ? <ReplieStatique /> : null}

        {sceneMontee ? (
          <SceneHero
            progression={progression}
            actif
            qualite={environnement.qualite}
            mobile={environnement.mobile}
            mouvementReduit={environnement.mouvementReduit}
            dpr={environnement.dpr}
          />
        ) : null}

        <div className="hero__voile" ref={voile}>
          <div>
            <h1 className="hero__titre">
              BG<span className="accent">F</span>
              <span className="lien-invisible">
                {" "}
                — garage d&rsquo;exception à Lyon
              </span>
            </h1>
            <p className="hero__baseline">
              Garage d&rsquo;exception <span>—</span> Lyon
            </p>
          </div>

          <p className="hero__invite">
            <span className="hero__rail" aria-hidden="true" />
            {anime ? "Défiler pour entrer" : "Bienvenue dans l’atelier"}
          </p>
        </div>
      </div>
    </section>
  );
}
