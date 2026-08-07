"use client";

import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/**
 * Post-traitement. En qualité basse, la chaîne entière est retirée : c'est
 * une passe plein écran de moins, et le rendu direct reste lisible.
 *
 * Les effets sont assemblés dans un tableau plutôt qu'en JSX conditionnel :
 * EffectComposer n'accepte pas d'enfant nul.
 */
export default function Effets({ reglages }) {
  if (!reglages.bloom) return null;

  const chaine = [
    <Bloom
      key="bloom"
      intensity={0.85}
      luminanceThreshold={0.72}
      luminanceSmoothing={0.28}
      mipmapBlur
      radius={0.72}
    />,
  ];

  if (reglages.profondeurDeChamp) {
    chaine.push(
      <DepthOfField
        key="dof"
        focusDistance={0.012}
        focalLength={0.05}
        bokehScale={2.6}
      />
    );
  }

  chaine.push(
    // Grain de pellicule, volontairement à la limite du perceptible.
    // `premultiply` multiplie le bruit par la couleur d'entrée : sur les
    // surfaces cramées — tubes de néon, rai de lumière — il creusait des
    // points noirs au lieu d'un grain. Écarté, et opacité ramenée au niveau
    // d'un vrai grain argentique.
    <Noise key="grain" blendFunction={BlendFunction.OVERLAY} opacity={0.035} />,
    <Vignette key="vignette" offset={0.28} darkness={0.72} eskil={false} />
  );

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {chaine}
    </EffectComposer>
  );
}
