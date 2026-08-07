# BGF — site immersif

Next.js (App Router) · React Three Fiber · drei · GSAP ScrollTrigger.
Trois sections, et rien d'autre : **Hero**, **Services**, **Contact**.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

L'entrée de preview du poste est `bgf-v2`, port **8774**.

## Règle absolue du projet : tout est procédural

`public/` est vide et doit le rester. Aucun `.glb`, aucune texture bitmap,
aucune photo, aucune police en binaire dans le dépôt.

- Les textures (béton, tôle, grain de poussière, panorama de reflets) sont
  peintes au canvas à l'exécution — `lib/textures.js`.
- L'environnement de reflets est un panorama équirectangulaire maison filtré
  par PMREM, partagé entre toutes les scènes — `lib/envPartage.js`.
- Les géométries sont primitives ou déformées en code — le panneau de
  carrosserie est une grille de 96 × 64 galbée à la main.
- Les polices viennent de `next/font/google` : rien n'est versionné.

## Structure

```
app/
  layout.js            polices, métadonnées, JSON-LD, repli sans JavaScript
  page.js              les trois sections, rendues côté serveur
  globals.css          tout le style du site
  api/contact/route.js réception et validation du formulaire
components/
  ui/                  Hero, Services, Contact, Plan, Entête, Pied, repli statique
  three/               scène du héros, porte, atelier, atmosphère, visuels de services
lib/
  data.js              contenu éditorial + coordonnées  ← le seul fichier à éditer
  porte.js             géométrie de rail de la porte sectionnelle
  quality.js           détection WebGL / qualité / mobile / mouvement réduit
  scroll.js            progression de scroll (GSAP ScrollTrigger)
  textures.js          textures procédurales
  envPartage.js        PMREM partagé
  useReveal.js         révélations et suspension de rendu hors viewport
```

## Coordonnées

`lib/data.js` → objet `contact` et tableau `horaires`. **Les valeurs sont
fictives** : adresse Lyon plausible, et numéro pris dans la plage
`0X 99 00 XX XX` que l'ARCEP réserve à la fiction. Rien d'autre dans le projet
ne duplique ces valeurs — ni le pied de page, ni le JSON-LD, ni le plan.

## Formulaire de contact

`POST /api/contact` valide côté serveur, puis :

- transmet la demande à `CONTACT_WEBHOOK_URL` si la variable est définie ;
- sinon la journalise côté serveur.

Aucun fournisseur d'e-mail n'est câblé — c'est un choix de déploiement.

## Performance

- `devicePixelRatio` plafonné à 2.
- Instancing pour les panneaux de porte, les néons, les montants, les
  glissières, les nappes de fumée, les faisceaux, les rainures de disque.
- Boucle de rendu coupée (`frameloop="never"`) dès qu'un canvas quitte le
  viewport, et quand l'onglet passe en arrière-plan.
- Trois niveaux détectés au chargement (`lib/quality.js`) : en **low**, ni
  volumétrique, ni depth of field, ni particules, ni sol réfléchissant.
- Deux contextes WebGL au total : un pour le héros, un pour les cinq visuels
  de services (drei `View`).
- Le texte est peint avant que la moindre ligne de Three.js ne soit évaluée :
  les scènes sont chargées en `dynamic(..., { ssr: false })` après deux images.

## Accessibilité et repli

- Tout le contenu textuel est dans le DOM, rendu côté serveur.
- `prefers-reduced-motion` : la porte s'affiche ouverte, aucune animation de
  scroll, le héros retombe à 100vh.
- Sans WebGL : porte, néons et sol dessinés en dégradés CSS, page complète.
- Sans JavaScript : un `<noscript>` annule l'état initial des révélations.
- Cibles tactiles à 44 px, aucune interaction dépendant du survol.

## Vérification visuelle

Le panneau navigateur intégré gèle `requestAnimationFrame` quand il n'est pas
affiché : la 3D et les animations de scroll y apparaissent figées **alors que
le site n'a rien de cassé**. Toute vérification de mouvement doit se faire
dans un vrai navigateur.
