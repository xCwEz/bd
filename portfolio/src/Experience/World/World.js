import Experience from '../Experience.js'
import Environment from './Environment.js'
import Starfield from './Starfield.js'
import Planet from './Planet.js'

// World : conteneur de tout ce qui peuple la scene. On attend le signal
// 'ready' des Resources avant de construire les objets qui dependent d'assets.
// Le contenu purement procedural (starfield) peut etre monte immediatement.
export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.items = []

    // Contenu procedural : disponible tout de suite, aucun asset requis.
    this.starfield = new Starfield()
    this.items.push(this.starfield)

    // Contenu dependant d'assets : monte quand tout est charge.
    this.resources.on('ready', () => {
      this.environment = new Environment()
      this.planet = new Planet()
      this.items.push(this.planet)
    })
  }

  update() {
    for (const item of this.items) item.update?.()
  }

  destroy() {
    for (const item of this.items) item.destroy?.()
  }
}
