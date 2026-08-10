# Portfolio immersif — architecture de base

Starter d'un portfolio 3D immersif (univers spatial), pensé pour viser le
niveau technique d'igloo.inc. Stack **Three.js vanilla + Vite**, renderer
**WebGPU avec fallback WebGL2 automatique**, post-processing par **nodes TSL**,
narration pilotée au **scroll (GSAP ScrollTrigger)**.

---

## Démarrer

```bash
cd portfolio
npm install
npm run dev        # http://localhost:5173
npm run build      # build de prod dans dist/
npm run preview    # sert le build
```

Panneau de réglages (Tweakpane) : ajouter `#debug` à l'URL, ex. `http://localhost:5173/#debug`.

> Le starter tourne **out of the box** en 100 % procédural (champ d'étoiles +
> planète placeholder). Aucun asset externe requis pour lancer.

---

## Le stack, et pourquoi

| Choix | Raison |
|-------|--------|
| **Three.js vanilla** (pas R3F) | Contrôle total sur la boucle de rendu, le post-processing et les shaders. C'est l'approche d'igloo.inc, la bonne pour viser leur niveau. |
| **Vite** | Dev server instantané, build optimisé, import natif des shaders `.glsl` via `vite-plugin-glsl`. |
| **WebGPURenderer + fallback WebGL2** | Standard 2026 : ~95 % des navigateurs en WebGPU, repli automatique pour le reste. Un seul pipeline, un seul jeu de shaders. 2 à 10x de perf sur les scènes lourdes. |
| **TSL (Three Shader Language)** | Shaders écrits une fois, compilés vers WGSL (WebGPU) et GLSL (WebGL). Plus de code shader dupliqué. |
| **Post-processing par nodes** | Bloom sélectif via MRT (Multiple Render Targets) sur la seule composante émissive, comme igloo.inc, pas un bloom global. |
| **GSAP + ScrollTrigger** | Narration au scroll : la caméra suit un parcours de waypoints. |
| **Tweakpane** | Tuning temps réel en dev (l'outil qu'utilise igloo.inc). |

---

## Architecture des fichiers

```
portfolio/
├── index.html                  # canvas + loader + sections HTML (ancres de scroll)
├── vite.config.js              # base relative, plugin glsl, target esnext
├── package.json
└── src/
    ├── main.js                 # point d'entree : instancie Experience + cable le loader
    ├── styles/main.css         # canvas fixe plein ecran, sections 100vh, loader
    └── Experience/
        ├── Experience.js       # SINGLETON chef d'orchestre (scene, camera, renderer...)
        ├── sources.js          # liste des assets a charger (vide au depart)
        ├── Renderer.js         # WebGPURenderer + init async + fallback + tone mapping
        ├── Camera.js           # PerspectiveCamera (pilotee par le ScrollController)
        ├── PostProcessing.js   # pipeline nodes TSL, bloom selectif via MRT
        ├── ScrollController.js # waypoints camera <-> sections, scrub GSAP
        ├── Utils/
        │   ├── EventEmitter.js # on/off/trigger, base de Sizes/Time/Resources
        │   ├── Sizes.js        # dimensions + pixelRatio (plafonne a 2), emet 'resize'
        │   ├── Time.js         # boucle rAF, emet 'tick' (elapsed, delta clampe)
        │   ├── Resources.js    # loaders GLTF/DRACO/KTX2/texture, emet 'progress'/'ready'
        │   └── Debug.js        # Tweakpane, actif seulement avec #debug
        └── World/
            ├── World.js        # conteneur du contenu, attend 'ready' pour les assets
            ├── Environment.js  # lumieres (a remplacer par un HDRI plus tard)
            ├── Starfield.js    # particules procedurales (emissives -> bloom)
            └── Planet.js       # planete placeholder (icosahedron, materiau node)
```

### Le pattern central : Experience singleton

`Experience` est instancié **une seule fois** dans `main.js`. Tous les autres
modules font `new Experience()` **sans argument** pour récupérer l'instance
partagée et accéder à `scene`, `camera`, `renderer`, `resources`, `time`,
`sizes`, `debug`. Ça évite de passer des références partout et garde un seul
point de vérité. (Structure inspirée de Bruno Simon, alignée sur l'organisation
d'igloo.inc.)

### La boucle de rendu

`Time` émet `tick` à chaque frame → `Experience.update()` met à jour caméra,
monde et scroll, puis appelle `PostProcessing.update()` qui rend la scène **à
travers le pipeline de post-processing** (jamais le renderer en direct, pour que
le bloom s'applique toujours).

### La narration au scroll

Chaque `<section>` de `index.html` est une étape. `ScrollController` définit un
**waypoint** (position + cible caméra) par section et interpole entre eux au
scroll via GSAP `scrub`. Pour ajouter une étape : ajoute une `<section>` **et**
un waypoint, dans le même ordre.

---

## Ajouter tes assets (modèles / textures)

1. Place tes fichiers dans `public/` (ex. `public/models/planete.glb`).
2. Déclare-les dans `src/Experience/sources.js` (voir exemples commentés).
3. Récupère-les dans un module via `this.experience.resources.items.<name>`
   une fois l'événement `ready` reçu (voir `World.js`).

### Décodeurs DRACO / KTX2 (à copier une fois)

Les modèles compressés ont besoin des décodeurs, servis depuis `public/` :

```bash
# depuis portfolio/
mkdir -p public/draco public/basis
cp node_modules/three/examples/jsm/libs/draco/gltf/* public/draco/
cp node_modules/three/examples/jsm/libs/basis/* public/basis/
```

Les chemins sont déjà configurés dans `Resources.js`
(`/draco/` et `/basis/`).

---

## Prochaines étapes suggérées

- [ ] Remplacer `Environment` par un environnement HDRI (`scene.environment`)
      pour des matériaux physiques crédibles (clearcoat / transmission).
- [ ] Écrire un premier shader TSL (déformation de la planète, atmosphère).
- [ ] Ajouter le God Rays / Depth of Field au pipeline de post-processing.
- [ ] Injecter le vrai contenu éditorial dans les `<section>` (titres, projets).
- [ ] Curseur physique élastique et recoloring au scroll (réfs CodePen du dossier
      `context/import/design/`).
