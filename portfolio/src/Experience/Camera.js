import { PerspectiveCamera } from 'three'

import Experience from './Experience.js'

// Camera perspective. Pas d'OrbitControls ici : dans une experience narrative
// pilotee au scroll (comme igloo.inc), c'est le ScrollController qui deplace
// la camera le long d'un parcours. On garde toutefois un point de mire (target)
// que les modules peuvent animer.
export default class Camera {
  constructor() {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene

    this.setInstance()
  }

  setInstance() {
    this.instance = new PerspectiveCamera(35, this.sizes.aspect, 0.1, 200)
    this.instance.position.set(0, 0, 12)
    this.scene.add(this.instance)
  }

  resize() {
    this.instance.aspect = this.sizes.aspect
    this.instance.updateProjectionMatrix()
  }

  update() {
    // Le mouvement reel est applique par le ScrollController.
    // Cette methode reste le point d'entree si on ajoute un leger parallax
    // souris ou un flottement d'idle.
  }
}
