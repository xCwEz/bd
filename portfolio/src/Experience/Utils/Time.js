import EventEmitter from './EventEmitter.js'

// Horloge de l'application. Emet 'tick' a chaque frame avec :
// - elapsed : temps ecoule depuis le demarrage (ms)
// - delta   : temps depuis la frame precedente (ms), plafonne pour eviter
//   les sauts apres un changement d'onglet.
export default class Time extends EventEmitter {
  constructor() {
    super()

    this.start = performance.now()
    this.current = this.start
    this.elapsed = 0
    this.delta = 16 // valeur de depart raisonnable (~60fps)

    // On demarre au prochain frame pour laisser le reste s'initialiser
    window.requestAnimationFrame(() => this.tick())
  }

  tick() {
    const current = performance.now()
    this.delta = Math.min(current - this.current, 64) // clamp anti-freeze
    this.current = current
    this.elapsed = this.current - this.start

    this.trigger('tick')

    window.requestAnimationFrame(() => this.tick())
  }
}
