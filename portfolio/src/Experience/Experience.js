import { Scene } from 'three'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Resources from './Utils/Resources.js'
import Debug from './Utils/Debug.js'
import Renderer from './Renderer.js'
import Camera from './Camera.js'
import World from './World/World.js'
import PostProcessing from './PostProcessing.js'
import ScrollController from './ScrollController.js'
import sources from './sources.js'

// Experience : chef d'orchestre de toute l'application (pattern singleton
// inspire de la structure Bruno Simon / igloo.inc). N'importe quel module
// peut faire `new Experience()` sans argument pour recuperer l'instance
// partagee et acceder a la camera, au renderer, aux ressources, etc.
let instance = null

export default class Experience {
  constructor(canvas) {
    if (instance) return instance
    instance = this

    // Acces global pratique en dev (a retirer en prod si besoin)
    window.experience = this

    this.canvas = canvas

    // --- Briques utilitaires (l'ordre compte) ---
    this.debug = new Debug() // panneau Tweakpane, actif seulement avec #debug dans l'URL
    this.sizes = new Sizes() // dimensions + pixelRatio, emet 'resize'
    this.time = new Time() // boucle requestAnimationFrame, emet 'tick'
    this.scene = new Scene()
    this.camera = new Camera()
    this.renderer = new Renderer() // WebGPU + fallback WebGL2
    this.resources = new Resources(sources) // loaders GLTF/DRACO/KTX2/texture
    this.world = new World() // contenu de la scene (planetes, particules...)
    this.post = new PostProcessing() // pipeline de post-processing (nodes TSL)
    this.scroll = new ScrollController() // pilotage camera/animations au scroll

    // Le renderer est asynchrone (init WebGPU). On demarre la boucle une fois pret.
    this.init()
  }

  async init() {
    await this.renderer.init()

    // Branchement des evenements globaux une fois tout construit
    this.sizes.on('resize', () => this.resize())
    this.time.on('tick', () => this.update())
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
    this.post.resize()
  }

  update() {
    this.camera.update()
    this.world.update()
    this.scroll.update()
    // Le rendu final passe par le post-processing (qui appelle le renderer)
    this.post.update()
  }

  // Nettoyage complet (utile si l'experience est montee/demontee dans une SPA)
  destroy() {
    this.sizes.off('resize')
    this.time.off('tick')
    this.world.destroy?.()
    this.post.dispose?.()
    this.renderer.dispose()
    instance = null
  }
}
