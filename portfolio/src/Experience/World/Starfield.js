import { BufferGeometry, BufferAttribute, Points, AdditiveBlending, Color } from 'three'
import { PointsNodeMaterial } from 'three/webgpu'

import Experience from '../Experience.js'

// Champ d'etoiles procedural reparti dans une coquille spherique autour de la
// camera. Materiau node avec composante emissive pour que le bloom selectif
// du PostProcessing les fasse rayonner. Aucun asset externe requis.
export default class Starfield {
  constructor(count = 4000) {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.time = this.experience.time

    this.count = count
    this.setPoints()
  }

  setPoints() {
    const positions = new Float32Array(this.count * 3)
    const colors = new Float32Array(this.count * 3)

    const inner = 20
    const outer = 90
    const palette = [new Color('#ffffff'), new Color('#9db4ff'), new Color('#ffd9a0')]

    for (let i = 0; i < this.count; i++) {
      // Position aleatoire dans une coquille spherique (distribution uniforme)
      const r = inner + Math.cbrt(Math.random()) * (outer - inner)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3 + 0] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    this.geometry = new BufferGeometry()
    this.geometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.geometry.setAttribute('color', new BufferAttribute(colors, 3))

    this.material = new PointsNodeMaterial({
      size: 0.08,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    this.points = new Points(this.geometry, this.material)
    this.points.frustumCulled = false
    this.scene.add(this.points)
  }

  update() {
    // Rotation tres lente pour donner vie au fond stellaire.
    this.points.rotation.y = this.time.elapsed * 0.000015
  }

  destroy() {
    this.geometry.dispose()
    this.material.dispose()
    this.scene.remove(this.points)
  }
}
