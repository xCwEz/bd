import Experience from './Experience/Experience.js'

// Point d'entree unique. On instancie l'Experience une seule fois (singleton)
// en lui passant le canvas. Tout le reste est orchestre a l'interieur.
const canvas = document.querySelector('canvas.webgl')
const experience = new Experience(canvas)

// --- Ecran de chargement ---
// On branche la barre de progression sur les evenements des Resources, puis
// on masque le loader quand tout est pret.
const loader = document.querySelector('[data-loader]')
const loaderBar = document.querySelector('[data-loader-bar]')

experience.resources.on('progress', (ratio) => {
  if (loaderBar) loaderBar.style.transform = `scaleX(${ratio})`
})

experience.resources.on('ready', () => {
  if (loaderBar) loaderBar.style.transform = 'scaleX(1)'
  if (loader) {
    loader.classList.add('is-hidden')
    // Retire le noeud apres la transition pour liberer le DOM.
    setTimeout(() => loader.remove(), 800)
  }
})
