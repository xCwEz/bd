/**
 * Repli sans WebGL. La porte, les néons, le rai de lumière et le sol sont
 * dessinés en dégradés CSS : aucune image, et la page reste entièrement
 * lisible. Le contenu textuel des trois sections est le même que celui de la
 * version 3D — seule l'animation disparaît.
 */
export default function ReplieStatique() {
  return (
    <div className="repli" aria-hidden="true">
      <div className="repli__porte" />
      <div className="repli__neon" />
      <div className="repli__seuil" />
      <div className="repli__sol" />
    </div>
  );
}
