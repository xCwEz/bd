import { WebGPURenderer } from 'three/webgpu'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'

import Experience from './Experience.js'

// Renderer unifie 2026 : WebGPURenderer de Three.js, qui bascule
// automatiquement sur un backend WebGL2 quand WebGPU n'est pas disponible
// (~5% des utilisateurs). Un seul pipeline, un seul jeu de shaders (TSL).
export default class Renderer {
  constructor() {
    this.experience = new Experience()
    this.canvas = this.experience.canvas
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.camera = this.experience.camera

    this.setInstance()
  }

  setInstance() {
    this.instance = new WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      // forceWebGL: true, // decommenter pour tester le fallback WebGL2
    })

    this.instance.setClearColor('#05060a') // fond spatial sombre
    this.instance.toneMapping = ACESFilmicToneMapping
    this.instance.toneMappingExposure = 1.0
    this.instance.outputColorSpace = SRGBColorSpace

    this.resize()
  }

  // Initialisation asynchrone du backend (obligatoire pour WebGPU).
  // Une fois pret, on connait le backend reel et on peut brancher le KTX2Loader.
  async init() {
    await this.instance.init()
    this.backend = this.instance.backend?.isWebGPUBackend ? 'webgpu' : 'webgl2'
    console.info(`[Renderer] backend actif : ${this.backend}`)

    this.experience.resources.detectKTX2Support(this.instance)
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
  }

  // Rendu direct (sans post-processing). Le PostProcessing appelle ceci
  // indirectement via son propre passe ; expose ici pour debug/fallback.
  render() {
    this.instance.render(this.scene, this.camera.instance)
  }

  dispose() {
    this.instance.dispose()
  }
}
