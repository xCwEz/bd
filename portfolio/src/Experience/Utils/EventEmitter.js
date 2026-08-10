// Emetteur d'evenements minimaliste (on / off / trigger) partage par
// Sizes, Time et Resources. Volontairement leger, sans dependance.
export default class EventEmitter {
  constructor() {
    this.callbacks = {}
  }

  on(name, callback) {
    if (!this.callbacks[name]) this.callbacks[name] = []
    this.callbacks[name].push(callback)
    return this
  }

  off(name) {
    if (this.callbacks[name]) delete this.callbacks[name]
    return this
  }

  trigger(name, args = []) {
    if (!this.callbacks[name]) return
    this.callbacks[name].forEach((callback) => callback.apply(this, args))
  }
}
