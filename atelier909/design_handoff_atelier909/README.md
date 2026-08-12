# Passation — ATELIER 909, Mini App Telegram

## Vue d'ensemble

Boutique de sportswear rare (Stone Island, Nike ACG, Arc'teryx) opérée par une
seule personne, sous forme de **Telegram Mini App**. Pièces uniques ou en très
petit nombre, prix variable selon la taille, paiement **en espèces à la remise
en main propre**, aucun paiement en ligne.

Volume au lancement : moins de 20 pièces. Un seul opérateur, qui n'est pas
développeur et pilotera l'implémentation avec Claude Code.

Objectif de ce dossier : permettre de construire l'application complète à partir
des maquettes fournies, sans avoir participé à la conversation de conception.

---

## À propos des fichiers de design

Les fichiers HTML de ce dossier sont des **références de design** : des
prototypes qui montrent l'apparence et le comportement voulus. **Ce n'est pas du
code de production à copier tel quel.**

Le travail consiste à **recréer ces écrans dans un vrai environnement
applicatif**. Aucun codebase n'existe aujourd'hui : il faut donc choisir la pile
technique. Recommandation, à adapter :

- **Front** : React + Vite, TypeScript. Une SPA servie en statique.
- **Back** : Node (Fastify ou Express) ou Python (FastAPI). API REST simple.
- **Base** : PostgreSQL. SQLite suffit au lot 1 si ça simplifie le démarrage.
- **Médias** : stockage objet (Cloudflare R2, S3) avec URLs signées.
- **Bot** : même serveur, webhook Telegram.
- **Hébergement** : Vercel / Netlify / Cloudflare Pages pour le front, Railway /
  Fly.io / petit VPS pour l'API. HTTPS obligatoire, Telegram refuse le HTTP.

Le style visuel, lui, doit être repris **fidèlement** : voir Fidélité.

---

## Fidélité

**Haute fidélité.** Les maquettes portent les couleurs, la typographie, les
espacements et les animations définitifs. L'interface doit être recréée au pixel
près à partir des valeurs listées dans « Tokens de design », en utilisant les
outils du framework retenu.

Les blocs sombres à la place des photos et des vidéos sont des **emplacements
volontaires** : les médias réels seront fournis par l'opérateur.

---

## Format et contraintes

- Cible : **390 × 844 px** (webview Telegram, iPhone de référence). Mise en page
  fluide, mais pensée pour cette largeur.
- Toujours tester sur iOS, Android et Telegram Desktop : les webviews diffèrent.
- Langue : **français**, tutoiement exclu, ton clinique et sobre.
- Thème sombre uniquement. Ne pas suivre `themeParams` de Telegram : l'identité
  visuelle prime.

---

## Écrans

Huit états, capturés dans `screens/`. Navigation principale : barre d'onglets
fixe en bas, quatre entrées — Catalogue, Recherche, Panier, Compte.

### 1. Catalogue — `screens/02-ecran.png`

**But** : parcourir les arrivages.

**Structure, de haut en bas :**
- Barre d'état simulée (heure, batterie) — dans l'app réelle, c'est Telegram qui
  l'affiche : ne pas la reproduire.
- En-tête : pastille chrome 22 × 22 px (radius 6, dégradé animé), titre
  `ATELIER 909` 15 px / 700 / letter-spacing .14em, et `FERMER` à droite
  (mono 11 px, #6E757C). Bordure basse 1 px #1B1E22.
- Ligne de session : `SESSION CHIFFRÉE` (mono 10 px, .2em, #6E757C) au-dessus du
  handle `@m_vaudreuil`. À droite, pastille `E2E ACTIF` : bordure 1 px #23272C,
  fond #111316, radius 999, point 6 px #9AE6C4 en pulsation 2 s.
- Champ de recherche factice : bordure #23272C, radius 12, fond #111316, texte
  placeholder #6E757C 14 px, séparateur vertical puis `FILTRES`. **Cliquable →
  écran Recherche.**
- Rangée de filtres horizontale : puce active fond dégradé clair, texte #0A0B0C ;
  puces inactives bordure #23272C, texte #C9D0D6. Radius 999, padding 7/13.
- Titre `Arrivages` 17 px / 700, et `MAJ 04:12` à droite (mono 10 px).
- **Grille 2 colonnes, gap 12 px**, cartes produit.

**Carte produit (variante retenue : A2, info en surimpression)**
- Conteneur 224 px de haut, radius 12, bordure 1 px #23272C, dégradé sombre en
  fond (emplacement média).
- Voile de lecture : `linear-gradient(180deg, transparent 42%, rgba(8,9,10,.93))`.
- Reflet chrome animé par-dessus le fond : dégradé oblique clair, `background-size:250% 100%`,
  animation 5 à 7,5 s linéaire infinie (valeur différente par carte, pour éviter
  la synchronisation).
- Badge optionnel en haut à gauche : `VIDÉO` (fond #D6DCE1, texte #0A0B0C) ou
  `1 PIÈCE` (bordure #3A4046, texte #E8EBEE). Mono 9 px, radius 3.
- Bloc bas, à 11 px des bords : référence (mono 9 px, .16em, #9AA1A8), nom
  (13,5 px / 600), puis ligne prix (mono 13 px, #F2F4F6) et score de condition à
  droite (mono 9 px, #9AE6C4, format `9/10`).
- Apparition : `translateY(14px)` + opacité, 0,55 s, décalage de 60 ms par carte.

**Contenu des quatre cartes de la maquette** — données de démonstration à
remplacer par le vrai catalogue :

| Réf | Marque / année | Nom | Prix | Cond. |
|---|---|---|---|---|
| SI-94-ICE | Stone Island · 1994 | Ice Jacket thermosensible | 1 380 € | 9/10 |
| NK-99-CAG | Nike ACG · 1999 | Cagoule Gore-Tex | 890 € | 8/10 |
| AR-04-SV | Arc'teryx · 2004 | Alpha SV Bird Head | 2 100 € | 9/10 |
| SI-02-SHW | Stone Island · 2002 | Shadow Project gilet | 740 € | 7/10 |

### 2. Fiche produit — `screens/03-ecran.png`

**But** : juger la pièce, choisir la taille, réserver.

- **En-tête média plein cadre** (variante C1), 330 px de haut. Bouton retour
  rond 32 px en haut à gauche. Pastille `AUTHENTIFIÉ` en haut à droite (point
  #9AE6C4 pulsé). Au centre : cercle pointillé 96 px en rotation 14 s, et
  bouton lecture 52 px blanc opacité .92 avec triangle #0A0B0C. En bas à
  gauche : `VIDÉO 0:38 · SANS SON`.
- **Bande de vignettes** : 5 carrés 58 px, radius 8, gap 8, défilement
  horizontal. La première est active (bordure 1,5 px #E8EBEE, glyphe ▶). La
  dernière affiche `+3`.
- **Titre** : ligne de référence en mono 10 px `.2em` #6E757C, puis nom en 24 px
  / 700 / -.02em, puis description 14 px / 1.6 / #8E959D.
- **Bloc condition** : cadre #23272C, fond #101214, radius 12, padding 14.
  Libellé `SCORE DE CONDITION` à gauche, note `9/10` à droite (mono 15 px, le
  `/10` en 11 px #6E757C). Dessous, **10 segments** de 5 px, gap 3 : les N
  premiers en dégradé clair, le reste en #23272C. Animation de remplissage
  décalée de 50 ms par segment. Puis une ligne de commentaire 12 px #6E757C.
- **Sélecteur de taille (variante B1, grille 2 × 2)** : chaque case fait
  padding 12, radius 11 ; taille en 16 px / 700 à gauche, prix en mono 13 px à
  droite, puis stock en mono 9,5 px sous les deux. Case sélectionnée : fond
  dégradé clair, texte #0A0B0C, ombre portée, `translateY(-1px)`, transition
  .22 s. Case épuisée : bordure pointillée, texte #4A5057, taille barrée,
  prix `—`, mention `ÉPUISÉ`.
  Valeurs de la maquette : S 1 490 € (1 en stock), M 1 620 € (2), L 1 380 € (3),
  XL épuisé.
- **Trois garanties numérotées** (01, 02, 03) dans un cadre : paiement espèces,
  aucune identité demandée, audit public de la boutique.
- **Barre d'action fixe en bas**, sur un dégradé qui masque le contenu :
  à gauche `TAILLE L` (mono 9,5 px) au-dessus du prix (mono 20 px / 700) ; à
  droite le bouton pleine largeur `Réserver la pièce`, radius 12, padding 15,
  fond chrome animé, texte #0A0B0C 14,5 px / 700.

### 3. Panier — `screens/04-ecran.png`

**But** : vérifier la commande, choisir le mode de remise.

- Titre `Panier` 22 px / 700. Sous-titre `RÉSERVÉ 12:00 —` suivi du temps
  restant en #E0C48A, clignotant (`step-end`, 1,6 s).
- **Lignes d'article** : cadre #23272C, fond #101214, radius 12, padding 12,
  gap 12. Vignette 70 × 88 radius 8 à gauche. À droite : marque/année en mono
  9 px, nom 13,5 px / 600, puis ligne taille (12 px #8E959D) et prix (mono 14 px).
  Entrée décalée de 80 ms par ligne.
- **Modes de remise**, quatre options empilées, gap 8. Sélectionnée : bordure
  #C9D0D6, fond dégradé, texte #F2F4F6. Non sélectionnée : bordure #23272C,
  fond #101214, texte #8E959D.
  - RDV point neutre — gratuit — « Lieu public convenu dans le fil chiffré. »
  - Casier / consigne — +8 € — « Code à usage unique, 24 h de retrait. »
  - Point relais anonyme — +5 € — « Retrait sur pseudonyme, sans pièce d'identité. »
  - Coursier de confiance — +22 € — « Encaisse les espèces à votre place. »
- **Récapitulatif** : sous-total, ligne de remise, puis séparateur et
  `Espèces à prévoir` avec le total en mono 19 px / 700. Mention : montant exact
  recommandé, pas de monnaie rendue au-delà de 20 €.
- **Encart identité**, visible quand le total ≥ 500 € et que la vérification n'a
  pas été envoyée : cadre #2E333A, préfixe `ID` en mono 10 px, texte « Pièce
  d'identité demandée au-delà de 500 €. Étape à faire avant la confirmation du
  rendez-vous. »
- **Bouton principal**, libellé dynamique :
  - total ≥ 500 € et non vérifié → `Vérifier mon identité` → ouvre la feuille
  - sinon → `Convenir de la remise` → écran Rendez-vous

### 4. Vérification d'identité — `screens/05-ecran.png`

**But** : envoyer une pièce d'identité au-delà de 500 €.

Feuille qui **remonte par-dessus le panier** : voile `rgba(6,7,8,.72)` +
`backdrop-filter: blur(3px)`, panneau ancré en bas, radius 22 en haut,
`max-height: 96%`, entrée 0,42 s `cubic-bezier(.2,.8,.2,1)`. Poignée 38 × 4 px
centrée.

- Titre : « Pièce d'identité demandée pour cette commande », 19 px / 700.
  Bouton ✕ rond 28 px à droite.
- Texte : « Contrôle appliqué à partir de 500 €. Il limite les faux comptes et
  les arnaques. La photo est supprimée dès la remise effectuée. »
- `DOCUMENTS ACCEPTÉS` puis quatre puces : Carte d'identité, Passeport, Permis
  de conduire, Titre de séjour.
- **Cadre de prise de vue** : conteneur 186 px, fond sombre, gabarit pointillé
  1 px #3A4046 (`inset: 14px 14px 36px`), maquette de carte au centre
  (rectangle 56 × 70 + trois lignes grises), légende
  `RECTO · ALIGNER SUR LE GABARIT` sous le gabarit — ne doit jamais chevaucher
  le pointillé.
- Trois règles numérotées : photo prise dans l'app et jamais importée depuis la
  galerie ; document entier lisible, photo floue refusée ; en cas de refus, le
  panier est libéré et la pièce repart en ligne.
- Bouton `Vérifier mon identité`, puis mention « Notification Telegram dès la
  validation. Aucun autre usage du document. »

### 5. Panier après envoi — `screens/06-ecran.png`

Identique au panier, l'encart `ID` remplacé par une bannière : point #9AE6C4
pulsé + « Contrôle envoyé. Le rendez-vous sera confirmé après vérification. »
Le bouton redevient `Convenir de la remise`.

### 6. Rendez-vous et espèces — `screens/07-ecran.png`

- Retour `← PANIER` en mono 11 px. Titre « Convenir de la remise ».
- **Carte de zone** : 168 px, grille de 26 px (deux dégradés linéaires #1C2024),
  point blanc 12 px, cercle 64 px en pulsation autour, légende
  `ZONE APPROXIMATIVE · 11E ARR.` — le point exact n'est jamais affiché ici.
- **Créneaux** : trois boutons égaux, l'actif en dégradé clair.
- **Contact** : `@m_vaudreuil` avec la mention `SEUL IDENTIFIANT` en #9AE6C4, et
  « Ni nom, ni adresse, ni téléphone ne sont conservés. »
- **Espèces à apporter** : total en mono 30 px / 700, puis puces de coupures
  (`4 × 500`, `1 × 200`, `3 × 50`) calculées à partir du total.
- Bouton `Verrouiller le rendez-vous`, mention « Le fil de discussion s'efface
  24 h après la remise. »

### 7. Compte et suivi — `screens/08-ecran.png`

- Avatar 52 px chrome animé, handle 18 px / 700 avec **badge `VÉRIFIÉ`** (point
  et texte #9AE6C4, bordure #2E333A), puis `MEMBRE DEPUIS 03/2023`.
- **Trois compteurs** : réputation 4.9, deals conclus 17, litiges 0 (celui-ci en
  #9AE6C4). Mono 20 px / 700, libellé 10,5 px #6E757C.
- **Commande en cours** : numéro `CMD 909-7731`, intitulé, montant, puis un
  **suivi en 4 étapes** — RÉSERVÉ, VÉRIFIÉ, RDV FIXÉ, REMIS. Points 9 px reliés
  par des traits ; étapes passées pleines, étape courante #9AE6C4 pulsée, étape
  à venir en cercle vide #3A4046. Sous le suivi : créneau, mode de remise, et
  **code de remise** sur fond clair (`CODE 4F2A`).
- **Historique** : liste de lignes (vignette 36 × 44, nom, date et taille en
  mono 9,5 px, prix à droite), séparées par 1 px #23272C.

### 8. Recherche et filtres — `screens/09-ecran.png`

Remonte comme une feuille (0,35 s).
- Champ actif : bordure #3A4046, fond #14171A, curseur clignotant, `ANNULER` à
  droite.
- `TAILLE` : puces S/M/L/XL, multi-sélection.
- `BUDGET ESPÈCES` : plage affichée à droite du libellé, rail 3 px #23272C avec
  segment actif en dégradé et deux poignées 14 px.
- `CONDITION MINIMALE` : quatre paliers 6+/7+/8+/9+, sélection unique.
- `MODE DE REMISE` : quatre puces.
- Bouton de validation avec le nombre de résultats : `Voir 6 pièces`.

---

## Interactions et animations

Toutes les animations sont définies dans le prototype (`@keyframes`), à
reproduire :

| Nom | Effet | Durée | Usage |
|---|---|---|---|
| rise | translateY(14px) → 0 + opacité | .5–.55 s | entrée des blocs et cartes |
| fade | opacité 0 → 1 | .3 s | changement d'écran |
| up | translateY(100%) → 0 + opacité | .35–.42 s | feuilles remontantes |
| slide | translateX(18px) → 0 | .45 s | lignes de panier |
| shim | dégradé chrome, background-position 0 → 200% | 4,5–7,5 s | boutons, avatars, médias |
| sweep | balayage vertical translucide, -100% → 900% | 7 s | grain d'écran |
| pulse | opacité 1 → .35 + scale .8 | 1,8–2,4 s | points d'état |
| spin | rotation 360° | 14 s | cercle du lecteur vidéo |
| bar | largeur 0 → 100% | .6–.7 s | jauges de condition et de suivi |
| blink | opacité 1 → .25, `step-end` | 1–1,6 s | compte à rebours, curseur |

Easing des transitions d'état : `cubic-bezier(.2, .8, .2, 1)`, .22 s.
Objectif 60 fps : n'animer que `transform`, `opacity` et `background-position`.

Deux effets d'ambiance permanents sur le cadre :
- grain : lignes horizontales `rgba(255,255,255,.028)` tous les 3 px, opacité .5 ;
- balayage : bande claire translucide de 120 px qui descend en boucle.

**Navigation** : la barre d'onglets reste toujours visible et active l'onglet
correspondant à l'écran courant — la fiche produit garde Catalogue actif, le
rendez-vous garde Panier actif.

---

## Règles métier

1. **Prix par taille.** Le prix n'est pas un attribut du produit mais de la
   variante taille. Une taille sans stock est affichée, barrée, sans prix.
2. **Une pièce, un exemplaire.** Le stock est le plus souvent 1. Deux acheteurs
   ne doivent jamais pouvoir réserver la même variante : verrou en base au
   moment de l'ajout au panier.
3. **Réservation 12 h.** À l'ajout au panier, la variante est bloquée 12 h. Un
   compte à rebours s'affiche. À expiration, la pièce repart au catalogue et le
   panier est vidé.
4. **Frais de remise** : point neutre 0 €, casier +8 €, relais +5 €, coursier
   +22 €. Total = somme des articles + frais.
5. **Vérification d'identité au-delà de 500 €** (total panier, frais compris).
   Redemandée **à chaque commande** dépassant le seuil ; une vérification passée
   ne dispense pas de la suivante. Le seuil doit être une valeur de
   configuration, pas une constante dans le code.
6. **Vérification non bloquante à l'envoi, bloquante à la confirmation.** La
   photo part au moment du panier, la commande continue, mais le rendez-vous
   n'est confirmé qu'après validation manuelle par l'opérateur. Aucun délai
   annoncé à l'utilisateur.
7. **Échec de vérification** : panier libéré, variante remise en ligne,
   notification Telegram.
8. **Badge vérifié** affiché sur le profil après la première validation.
9. **Espèces uniquement.** Aucun paiement en ligne, aucune empreinte bancaire.
   Le montant exact est affiché avec une répartition en coupures.
10. **Code de remise** à 4 caractères, généré à la confirmation du rendez-vous.
    Échangé oralement sur place, jamais avant.
11. **Suivi en 4 états** : RÉSERVÉ → VÉRIFIÉ → RDV FIXÉ → REMIS.
12. **Effacement du fil** 24 h après la remise.

---

## État applicatif

État minimal du front, tel qu'exercé par le prototype :

| Clé | Valeurs | Effet |
|---|---|---|
| `screen` | cat, prod, cart, checkout, acct, search | écran affiché |
| `size` | S, M, L | pilote le prix affiché et la ligne de panier |
| `cart` | nombre d'articles | pastille sur l'onglet Panier |
| `handover` | 0–3 | frais et libellé du récapitulatif |
| `idSheet` | booléen | feuille de vérification ouverte |
| `idSent` | booléen | encart ID vs bannière « Contrôle envoyé », libellé du bouton |

En production, s'y ajoutent : session Telegram vérifiée, catalogue chargé,
panier serveur avec expiration, statut de vérification, commande courante.

---

## Modèle de données (proposition)

- **user** : id Telegram, handle, date d'inscription, réputation, compteurs de
  deals et de litiges, `verified_at`.
- **product** : référence, marque, année, nom, description, score de condition
  (0–10), commentaire de condition, statut (en ligne, réservé, vendu).
- **variant** : produit, taille, prix, stock, `reserved_until`, `reserved_by`.
- **media** : produit, type (photo / vidéo), ordre, clé de stockage, durée.
- **cart / order** : user, lignes, mode de remise, frais, total, créneau, code
  de remise, statut de suivi.
- **verification** : user, commande, statut (en attente, validée, refusée),
  `submitted_at`, `reviewed_at`, `deleted_at`, **jamais le fichier après
  suppression**.

---

## Intégration Telegram

- Charger `https://telegram.org/js/telegram-web-app.js` dans la page.
- **`initData` doit être vérifié côté serveur** (HMAC-SHA256 avec le token du
  bot) à chaque appel authentifié. Sans cette vérification, n'importe qui peut
  se faire passer pour un autre utilisateur. Point non négociable.
- `MainButton` : à préférer aux boutons dessinés pour l'action principale de
  chaque écran, ou à masquer si l'on garde le bouton maison — mais pas les deux.
- `BackButton` : câblé sur le retour de la fiche produit et la fermeture des
  feuilles.
- `expand()` au démarrage, `HapticFeedback` sur la sélection de taille et la
  validation.
- **Ne pas** utiliser `themeParams` : l'app est en thème sombre fixe.
- Prise de photo : Telegram n'expose pas d'API caméra. Utiliser
  `<input type="file" accept="image/*" capture="environment">`, ou faire envoyer
  la photo dans le fil du bot et n'afficher que l'état dans l'app.
- Déclaration : `@BotFather` → `/newbot`, puis `/newapp`, puis `/setdomain`.
- Le bot (webhook séparé) envoie les notifications : vérification validée ou
  refusée, rendez-vous confirmé, réservation expirée.

---

## Confidentialité et données

Ce que l'app peut exploiter librement :
- identifiants Telegram (id, prénom, handle, langue) ;
- historique de commandes, réputation, tailles, préférences, montants.

Ce qui est sensible et strictement encadré :
- **la photo de pièce d'identité.**
  - finalité unique : lutte contre la fraude ;
  - **suppression automatique dès la remise effectuée** — un job planifié, pas
    une action manuelle ;
  - chiffrement au repos, accès restreint à un seul compte opérateur ;
  - aucune copie de sauvegarde qui survive à la suppression ;
  - après vérification, ne conserver que `verified_at` et un identifiant
    interne, jamais l'image ;
  - jamais transmise dans une conversation Telegram persistante.

Ce qui ne doit **pas** être collecté : adresse du domicile, coordonnées
bancaires, numéro de téléphone hors partage volontaire, contenu du fil après
effacement.

À prévoir : une page « données personnelles » accessible depuis l'app, un moyen
de demander accès ou suppression, et un registre des traitements.

> L'opérateur fera relire ce volet par un juriste. Implémenter les garanties
> techniques ci-dessus sans attendre cette relecture, et laisser la durée de
> conservation configurable pour pouvoir l'ajuster ensuite.

---

## Découpage en lots

**Lot 1 — Vitrine (cible : quelques jours)**
Catalogue, fiches produit, recherche et filtres, médias, thème et animations,
Mini App déclarée et accessible depuis le canal. **Pas de panier** : la fiche
s'arrête à la présentation. Objectif : quelque chose de visible et de partageable
très vite.

**Lot 2 — Vente (cible : une à deux semaines)**
Panier avec réservation 12 h, modes de remise, écran rendez-vous, calcul des
espèces et des coupures, compte et suivi de commande, code de remise, bot de
notification.

**Lot 3 — Vérification d'identité (cible : quelques jours de code)**
Feuille de vérification, capture, stockage chiffré, file de traitement,
suppression automatique, badge vérifié, blocage de la confirmation de rendez-vous.
Partie sensible : ne pas la traiter en dernier par facilité, mais avec le plus de
soin.

**Back-office minimal**, à livrer avec le lot 1 : ajouter et modifier une pièce,
téléverser photos et vidéo, réordonner les médias, mettre en ligne ou retirer.
Le traitement des vérifications s'y ajoute au lot 3. Une page web protégée par
mot de passe suffit ; pas besoin d'interface soignée.

Délai global visé : **trois à cinq semaines** pour une boutique complète en
ligne, l'opérateur travaillant dessus régulièrement.

---

## Tokens de design

**Couleurs**

| Rôle | Valeur |
|---|---|
| Fond application | `#0A0B0C` |
| Fond cadre téléphone | `#0C0E10` |
| Fond de carte | `#101214` / `#111316` |
| Fond de carte alt. | `#0E1012` / `#121417` |
| Bordure standard | `#23272C` |
| Bordure appuyée | `#2E333A` |
| Bordure claire | `#3A4046` / `#4A5057` |
| Séparateur | `#1B1E22` |
| Texte primaire | `#F2F4F6` |
| Texte courant | `#E8EBEE` |
| Texte secondaire | `#C9D0D6` |
| Texte tertiaire | `#8E959D` |
| Texte discret | `#6E757C` |
| Texte désactivé | `#5A6067` / `#4A5057` |
| Accent positif | `#9AE6C4` |
| Accent alerte | `#E0C48A` |

**Chrome liquide** — le motif signature, à ne pas simplifier en aplat :
- bouton : `linear-gradient(110deg,#FFFFFF,#A8AFB6 30%,#FFFFFF 50%,#8E959D 70%,#F2F4F6)`,
  `background-size:250% 100%`, animation `shim` 4,5 s ;
- surface : `linear-gradient(135deg,#F2F4F6,#8E959D 45%,#F2F4F6 70%,#6E757C)`,
  `background-size:200% 100%` ;
- sélection : `linear-gradient(135deg,#F2F4F6,#B9C0C6)`, texte `#0A0B0C` ;
- reflet sur média : `linear-gradient(115deg,transparent 30%,rgba(226,233,239,.13) 48%,transparent 62%)`.

**Typographie**
- Titres et interface : **Archivo** — 400, 500, 600, 700, 800.
- Chiffres, références, libellés techniques : **JetBrains Mono** — 400, 500, 700.
- Échelle : 30 px / 700 (titre de page), 24 px / 700 (titre produit),
  22 px / 700 (titre d'écran), 19 px / 700 (titre de feuille),
  17 px / 700 (section), 15 px / 700 (sous-section), 14,5 px / 700 (bouton),
  14 px (corps), 13,5 px / 600 (nom de produit), 12,5 px (texte dense),
  11,5 px (mention), et en mono 13 px (prix), 10 px `.16–.22em` (étiquettes),
  9 px `.16em` (références).
- Titres en `letter-spacing: -.02em`, étiquettes mono en `+.1em` à `+.22em`.
- `text-wrap: pretty` sur les paragraphes.

**Espacements** — échelle utilisée : 3, 5, 7, 9, 11, 12, 14, 16, 18, 20, 22, 26 px.
Padding d'écran 20 px, padding de carte 12–16 px, gap de grille 12 px.

**Rayons** : 5–6 (vignettes), 8–9 (puces, petits blocs), 11–12 (cartes, boutons),
14 (avatar), 22 (feuille), 32–42 (cadre téléphone), 999 (pastilles).

**Ombres** : bouton clair `0 10px 30px -12px rgba(232,235,238,.5)` ;
sélection `0 8px 26px -12px rgba(232,235,238,.6)` ;
cadre `0 60px 120px -40px rgba(0,0,0,.9)`.

---

## Ressources

Aucun média réel n'est fourni. Tous les emplacements photo et vidéo sont des
dégradés sombres, à remplacer par les visuels de l'opérateur. Prévoir : plusieurs
photos par pièce, une vidéo courte sans son (~40 s), et une vignette de
prévisualisation.

Polices chargées depuis Google Fonts. Aucune icône externe : tous les
pictogrammes de la maquette sont des formes CSS (carrés, cercles, bordures).
Les remplacer par un jeu d'icônes discret si besoin, sans changer la géométrie.

---

## Fichiers de ce dossier

| Fichier | Contenu |
|---|---|
| `Atelier 909.dc.html` | Prototype cliquable complet — 8 états, animations, logique de navigation, calcul des prix et du seuil de vérification. **La référence.** |
| `Apercu ATELIER 909.dc.html` | Planche des 8 écrans côte à côte. |
| `screens/02` à `09-ecran.png` | Captures des écrans, dans l'ordre du parcours. |
| `support.js` | Runtime du prototype. Sans intérêt pour l'implémentation. |

Ouvrir `Atelier 909.dc.html` dans un navigateur pour naviguer : les onglets, la
sélection de taille, les modes de remise et la vérification d'identité sont
fonctionnels. Le prix, le total et le libellé du bouton se recalculent en direct.

---

*ATELIER 909*
