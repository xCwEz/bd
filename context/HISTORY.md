# Workspace History

> Journal chronologique de toutes les sessions et décisions importantes.
> Le plus récent en haut. Mis à jour automatiquement par Claude.
>
> **Comment ça marche :** Quand je lance la commande `/update` après une session importante, ou quand je raconte un changement significatif, Claude ajoute une entrée ici automatiquement. Je n'ai pas à écrire ce fichier manuellement.

---

## 2026-08-10

### Premier client décroché : Bourganeuf Automobiles
- Nouveau client freelance : Bourganeuf Automobiles, garage automobile à Bourganeuf (Creuse). Deadline : 2 semaines
- Décision : reprendre le projet de site déjà entamé (Next.js + React Three Fiber + GSAP ScrollTrigger, porte de garage procédurale, scroll storytelling, contact fonctionnel) comme base, déplacé de context/import vers un dossier de projet actif à la racine
- Nouvelle section prévue : "Collection", catalogue de véhicules à vendre avec vraies photos fournies par le client — seule exception à la règle 100% procédurale du reste du site, qui elle est maintenue
- Contenu réel du client (photos, stock, coordonnées) pas encore reçu : le site avance avec des placeholders clairement identifiés, à remplacer dès réception

### Complétion du contexte : outils du quotidien et note techno portfolio
- Section "Outils que j'utilise au quotidien" renseignée : Figma (design/UI), Spline (3D), Three.js / React Three Fiber, GSAP (dont ScrollTrigger), VS Code / Cursor (dev front & motion)
- Section "Notes importantes" ouverte avec un point techno : le portfolio vise le niveau de finition d'igloo.inc (Three.js custom) ; Spline reste bon pour prototyper mais pas pour les finitions, la version finale devra être en Three.js / React Three Fiber

## 2026-08-05

### Direction du portfolio final tranchée : univers spatial, niveau technique igloo.inc
- Après exploration de deux pistes (showroom voiture 3D, puis clone à l'identique d'igloo.inc), Mickael tranche : le portfolio final sera un univers spatial (planètes, météorites) navigable en 3D, exploré en scroll/clic
- Référence de niveau technique et d'animation : igloo.inc, analysé par reverse engineering de leur bundle JS (site non capturable visuellement, mais stack identifiée avec certitude) : Svelte + Vite, Three.js avec GLTFLoader/DRACOLoader/KTX2Loader, three-mesh-bvh, post-processing pmndrs (DoF, God Rays, Bloom sélectif, SMAA), GSAP avec CustomEase + Flip, Tweakpane pour le tuning en dev, particules multi-systèmes, matériaux physiques (clearcoat/transmission/iridescence)
- L'option showroom voiture (roues en vue éclatée, phares séquencés, HUD holographique) est abandonnée comme direction du portfolio final
- Décision consciente : viser le même niveau de savoir-faire technique qu'igloo.inc, pas un clone visuel de leur scène (risque de crédibilité si un client reconnaît le site d'un fonds crypto existant)

### Ajout de références design dans context/import/
- Nouveau dossier `context/import/design/` avec 2 CodePen de référence pour le style visuel du portfolio
  - "GSAP 3D" (Front-End Developer & Designer Portfolio Showcase) : ScrollTrigger, recoloring dynamique au scroll, curseur élastique physique, chargement lazy des embeds
  - "Particulate" (Shatter an Image, Harvest a Palette) : particules physiques à partir d'une image, extraction de palette de couleurs par Median Cut
- Ces références serviront d'inspiration pour les animations et interactions du site portfolio immersif

## 2026-08-03

### Installation initiale du Jarvis
- Workspace personnalisé pour Mickael Leyssenne, basé à Paris
- Profil principal : Indépendant / Freelance
- Activité : Directeur Artistique / Designer UI-UX / concepteur d'expériences numériques immersives (3D, animations cinématiques)
- Objectifs court terme identifiés : finaliser et publier le portfolio, décrocher les 3 premiers clients, structurer l'offre et les tarifs
- Vision long terme : activité freelance stable en DA/UI/UX/3D avec portefeuille clients récurrent
- Projets actifs au démarrage : site portfolio personnel
- Domaine d'aide prioritaire : structuration de l'offre freelance et création du site portfolio
- Style de communication choisi : direct et efficace
