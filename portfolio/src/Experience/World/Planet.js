import { Mesh, IcosahedronGeometry, Color } from 'three'
import { MeshStandardNodeMaterial } from 'three/webgpu'

import Experience from '../Experience.js'

// Planete de reference (placeholder procedural). Des que tu auras un modele
// GLTF, remplace la geometrie/material ici par `this.resources.items.maPlanete`.
// Le materiau node standard est deja compatible bloom via son emissive.
export default class Planet {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time
    this.debug = this.experience.debug

    this.setMesh()
    this.setDebug()
  }

  setMesh() {
    // Icosahedron subdivise : bonne base pour deformer via un shader TSL plus tard.
    this.geometry = new IcosahedronGeometry(2.4, 24)

    this.material = new MeshStandardNodeMaterial({
      color: new Color('#c86b4a'),
      roughness: 0.7,
      metalness: 0.1,
      emissive: new Color('#210a05'),
      emissiveIntensity: 1,
    })

    this.mesh = new Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  setDebug() {
    if (!this.debug.active) return
    const folder = this.debug.pane.addFolder({ title: 'Planète' })
    folder.addBinding(this.material, 'roughness', { min: 0, max: 1, step: 0.01 })
    folder.addBinding(this.material, 'metalness', { min: 0, max: 1, step: 0.01 })
  }

  update() {
    this.mesh.rotation.y = this.time.elapsed * 0.0001
  }

  destroy() {
    this.geometry.dispose()
    this.material.dispose()
    this.scene.remove(this.mesh)
  }
}
