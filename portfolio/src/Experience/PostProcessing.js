import { PostProcessing as ThreePostProcessing } from 'three/webgpu'
import { pass, mrt, output, emissive } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'

import Experience from './Experience.js'

// Pipeline de post-processing base sur les nodes TSL (approche 2026, commune
// aux backends WebGPU et WebGL2). On isole la lumiere emissive de la scene
// pour appliquer un bloom selectif facon igloo.inc, plutot qu'un bloom global.
export default class PostProcessing {
  constructor() {
    this.experience = new Experience()
    this.renderer = this.experience.renderer.instance
    this.scene = this.experience.scene
    this.camera = this.experience.camera.instance
    this.debug = this.experience.debug

    this.setInstance()
    this.setDebug()
  }

  setInstance() {
    this.instance = new ThreePostProcessing(this.renderer)

    // Passe de scene avec Multiple Render Targets : on separe la couleur
    // finale et la composante emissive pour un bloom selectif.
    const scenePass = pass(this.scene, this.camera)
    scenePass.setMRT(
      mrt({
        output,
        emissive,
      })
    )

    const outputPass = scenePass.getTextureNode('output')
    const emissivePass = scenePass.getTextureNode('emissive')

    // Bloom applique uniquement sur l'emissive (etoiles, halos, materiaux
    // lumineux). Parametres : (input, strength, radius, threshold)
    this.bloomPass = bloom(emissivePass, 0.8, 0.6, 0.0)

    this.instance.outputNode = outputPass.add(this.bloomPass)
  }

  setDebug() {
    if (!this.debug.active) return

    const folder = this.debug.pane.addFolder({ title: 'Bloom' })
    folder.addBinding(this.bloomPass.strength, 'value', {
      label: 'strength',
      min: 0,
      max: 3,
      step: 0.01,
    })
    folder.addBinding(this.bloomPass.radius, 'value', {
      label: 'radius',
      min: 0,
      max: 1,
      step: 0.01,
    })
  }

  resize() {
    // ThreePostProcessing suit la taille du renderer automatiquement ;
    // hook conserve pour d'eventuels passes a taille fixe.
  }

  update() {
    this.instance.renderAsync()
  }

  dispose() {
    this.instance.dispose()
  }
}
