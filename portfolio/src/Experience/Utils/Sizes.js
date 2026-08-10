import EventEmitter from './EventEmitter.js'

// Gestion centralisee des dimensions et du pixelRatio.
// Emet 'resize' a chaque redimensionnement (avec un pixelRatio plafonne a 2
// pour ne pas exploser la charge GPU sur les ecrans retina).
export default class Sizes extends EventEmitter {
  constructor() {
    super()

    this.update()

    window.addEventListener('resize', () => {
      this.update()
      this.trigger('resize')
    })
  }

  update() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.aspect = this.width / this.height
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)
  }
}
