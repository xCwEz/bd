import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Experience from './Experience.js'

gsap.registerPlugin(ScrollTrigger)

// Pilote la camera le long d'un parcours defini par une suite de "waypoints",
// un par section HTML (voir index.html). Le scroll (scrub) interpole en continu
// la position et la cible de la camera : c'est le coeur de la narration facon
// igloo.inc. Ajoute/retire des waypoints en meme temps que les <section>.
export default class ScrollController {
  constructor() {
    this.experience = new Experience()
    this.camera = this.experience.camera.instance

    // Un waypoint par section : ou se trouve la camera et ce qu'elle regarde.
    this.waypoints = [
      { pos: { x: 0, y: 0, z: 12 }, look: { x: 0, y: 0, z: 0 } }, // intro
      { pos: { x: 4, y: 1, z: 7 }, look: { x: 0, y: 0, z: 0 } }, // planet-1
      { pos: { x: -3, y: -1, z: 6 }, look: { x: 0, y: 0, z: 0 } }, // planet-2
      { pos: { x: 0, y: 2, z: 14 }, look: { x: 0, y: 0, z: 0 } }, // contact
    ]

    // Etat interpole (mis a jour par GSAP, lu dans update()).
    this.state = {
      x: this.waypoints[0].pos.x,
      y: this.waypoints[0].pos.y,
      z: this.waypoints[0].pos.z,
      lx: this.waypoints[0].look.x,
      ly: this.waypoints[0].look.y,
      lz: this.waypoints[0].look.z,
    }

    this.setTimeline()
  }

  setTimeline() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.content',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1, // lissage : la camera "rattrape" le scroll en douceur
      },
    })

    // Enchaine les segments entre waypoints consecutifs.
    for (let i = 1; i < this.waypoints.length; i++) {
      const wp = this.waypoints[i]
      tl.to(this.state, {
        x: wp.pos.x,
        y: wp.pos.y,
        z: wp.pos.z,
        lx: wp.look.x,
        ly: wp.look.y,
        lz: wp.look.z,
        ease: 'power2.inOut',
      })
    }
  }

  update() {
    // Applique l'etat interpole a la camera a chaque frame.
    this.camera.position.set(this.state.x, this.state.y, this.state.z)
    this.camera.lookAt(this.state.lx, this.state.ly, this.state.lz)
  }
}
