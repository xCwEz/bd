"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import EnvironnementProcedural from "./Environnement";
import VisuelService from "./VisuelService";

/**
 * Une vue 3D calée sur son emplacement dans la page.
 *
 * `View` rend lui-même le div qui sert de repère : le canvas unique de la
 * section découpe une fenêtre de rendu exactement à cet endroit. Cinq visuels,
 * un seul contexte WebGL.
 */
export default function EmplacementVisuel({ type, index }) {
  return (
    <View className="service__cible" index={index}>
      {/* Léger contre-plongée inversée : on regarde la pièce d'un peu au-dessus,
          comme sur un établi. */}
      <PerspectiveCamera
        makeDefault
        fov={38}
        position={[0, 1.05, 4.6]}
        rotation={[-0.22, 0, 0]}
      />
      <EnvironnementProcedural resolution={512} intensite={0.9} />
      <VisuelService type={type} />
    </View>
  );
}
