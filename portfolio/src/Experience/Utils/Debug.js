import { Pane } from 'tweakpane'

// Panneau de reglages (Tweakpane, comme igloo.inc) actif uniquement quand
// l'URL contient le hash #debug. En production normale, il ne se charge pas
// et `this.active` reste false : les modules testent ce flag avant d'ajouter
// leurs controles.
export default class Debug {
  constructor() {
    this.active = window.location.hash === '#debug'

    if (this.active) {
      this.pane = new Pane({ title: 'Réglages' })
    }
  }
}
