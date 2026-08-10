import { DirectionalLight, AmbientLight } from 'three'

import Experience from '../Experience.js'

// Eclairage de la scene. Volontairement simple pour le starter : une lumiere
// directionnelle (soleil) + un ambient doux. A remplacer par un environnement
// HDRI (scene.environment) quand tu ajouteras des materiaux physiques
// (clearcoat / transmission) qui reagissent aux reflexions.
export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.setLights()
  }

  setLights() {
    this.sun = new DirectionalLight('#ffffff', 3)
    this.sun.position.set(5, 3, 4)
    this.scene.add(this.sun)

    this.ambient = new AmbientLight('#38406b', 0.6)
    this.scene.add(this.ambient)
  }
}
