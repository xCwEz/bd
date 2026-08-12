# ATELIER 909 — Lots 1, 2 et 3 : vitrine, vente et vérification

Next.js (App Router). Telegram Mini App pour une boutique de sportswear rare
(Stone Island, Nike ACG, Arc'teryx), opérée par une seule personne. Lot 1 :
catalogue, fiche produit, recherche/filtres, thème et animations, back-office
minimal. Lot 2 : panier avec réservation 12h, modes de remise, rendez-vous et
espèces, compte et suivi de commande, code de remise, notifications bot.
Lot 3 : vérification d'identité au-delà de 500 € (capture, chiffrement,
validation manuelle par l'opérateur) — la boutique est maintenant complète
de bout en bout (voir `design_handoff_atelier909/README.md` pour la spec
complète).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

Copier `.env.example` en `.env.local` avant de lancer le back-office ou le
panier (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `IDENTITE_CHIFFREMENT_CLE`
obligatoires ; `TELEGRAM_BOT_TOKEN` et `TELEGRAM_OPERATOR_CHAT_ID`
optionnels en développement, **requis en production**, voir « Sessions et
notifications »).

**Tester le parcours acheteur en local** : utiliser `npm run dev`. La
session de démonstration (sans Telegram) n'est délivrée qu'en
développement ; `npm run start` force le mode production, où l'absence de
`TELEGRAM_BOT_TOKEN` fait répondre `503` à `/api/session` plutôt que de
distribuer des sessions anonymes.

## Structure

```
app/
  layout.js                   polices (Archivo, JetBrains Mono), squelette html/body
  globals.css                  tout le style du site : tokens, animations, écrans
  (boutique)/                  routes de la mini app (le chrome mobile vit ici)
    layout.js                   coquille téléphone, TabBar, grain/balayage, init Telegram
    page.js                      Catalogue
    produit/[ref]/page.js        Fiche produit (barre de réservation en bas)
    recherche/page.js            Recherche et filtres
    panier/page.js                Panier (feuille de vérification d'identité incluse)
    panier/rendez-vous/page.js    Créneaux, zone, espèces, verrouillage du RDV
    compte/page.js                Profil, badge vérifié, commande en cours, historique
  admin/                       back-office, mise en page indépendante (pas de chrome mobile)
    connexion/page.js
    page.js                       liste des pièces + compteur de vérifications en attente
    produit/[ref]/page.js          édition (ref = "nouveau" pour créer)
    commandes/page.js              commandes confirmées, marquer comme remises
    verifications/page.js          file de vérification d'identité, valider/refuser
  api/
    session/route.js               établit la session (initData Telegram ou démo)
    panier/route.js                GET panier courant
    panier/ajouter, retirer, mode-remise, rendez-vous, verification   mutations du panier
    compte/route.js                profil + commande en cours + historique
    admin/…                        produits, upload, commandes, verifications (protégés)
components/ui/                   un composant par bloc d'écran, noms français
lib/
  produits.js                   accès disque produits — jamais importé côté client
  commandes.js                  panier/commandes : réservation, verrou, vérification, totaux
  identite.js                   chiffrement AES-256-GCM des photos de pièce d'identité
  session.js                    vérification initData (HMAC), cookie de session signé
  telegram.js                   envoi de notifications via l'API Bot
  formatage.js                  utilitaires purs (prix, badge) — importables côté client
  auth.js                       session admin (mot de passe en variable d'env)
  config.js                     frais de remise, seuil d'identité, créneaux, coupures
  panier-client.js               assurerSession() côté navigateur
data/produits.json               catalogue
data/commandes.json              paniers et commandes
stockage/identites/               photos de pièce d'identité chiffrées — gitignoré, hors public/
public/produits/<ref>/           vrais médias, une fois transmis par l'opérateur
```

## Panier, réservation et verrou

`lib/commandes.js` gère tout le cycle panier → rendez-vous → suivi. Points clés :

- **Réservation 12h** : à l'ajout au panier, la variante voit son `stock`
  décrémenté immédiatement et la commande reçoit un `reservationExpire`.
  Passé ce délai, la prochaine requête touchant le panier restaure le stock
  et marque la commande `expiree` — la purge est **paresseuse** (pas de
  tâche planifiée réelle derrière ce fichier JSON), donc invisible tant que
  personne ne revisite le panier, mais toujours cohérente au prochain accès.
  Même logique appliquée aux photos d'identité (voir plus bas).
- **Verrou en mémoire** : toutes les opérations qui lisent-modifient-écrivent
  `produits.json`/`commandes.json` sont sérialisées via une file d'attente de
  promesses (voir `serialise()` dans `lib/commandes.js`). Sans ça, deux
  acheteurs peuvent réserver la même pièce en stock=1 — vérifié et corrigé en
  testant deux navigateurs concurrents sur la même variante. Cette protection
  ne vaut que pour un seul processus Node ; elle ne suffirait plus derrière
  plusieurs instances/load-balancer (passer à de vrais verrous en base dans
  ce cas).
- **Frais de remise et coupures** : `lib/config.js` (`FRAIS_REMISE`,
  `repartirEnCoupures`). Le seuil de vérification d'identité est une
  constante de configuration (`SEUIL_VERIFICATION_ID = 500`), pas une valeur
  en dur dans le code.

## Vérification d'identité (lot 3)

Parcours conforme aux règles n°5 à n°8 du dossier de passation :

- **Envoi non bloquant** (règle n°6) : au-delà de 500 €, le panier propose
  « Vérifier mon identité » plutôt que de bloquer. La photo est prise dans
  l'app (`capture="environment"`, jamais un import depuis la galerie) et
  l'envoi n'empêche pas de continuer immédiatement vers le rendez-vous.
- **Confirmation bloquante** : verrouiller un rendez-vous avec une
  vérification encore « en_attente » fait passer la commande au statut
  `attente_verification` — créneau et mode de remise retenus, mais **pas de
  code de remise** tant que l'opérateur n'a pas validé. Le suivi côté
  acheteur (`/compte`) affiche l'étape VÉRIFIÉ en cours plutôt qu'un faux
  état confirmé.
- **Validation / refus** (`/admin/verifications`) : l'opérateur voit la
  photo déchiffrée à la demande (jamais servie depuis `public/`, jamais en
  clair sur disque) et valide ou refuse.
  - Valider fait passer `attente_verification` → `confirmee`, génère le
    code de remise à ce moment précis, et notifie l'acheteur.
  - Refuser (règle n°7) libère le panier, restaure le stock, et notifie
    l'acheteur — la commande n'existe plus.
- **Badge vérifié** (règle n°8) : affiché sur `/compte` dès qu'une
  vérification a été validée une fois, mais **ne dispense jamais** la
  commande suivante qui atteint le seuil (règle n°5, redemandée à chaque
  fois).

### Chiffrement et suppression

`lib/identite.js` chiffre chaque photo en AES-256-GCM avant écriture, avec
une clé dérivée de `IDENTITE_CHIFFREMENT_CLE` (jamais stockée telle quelle,
jamais commitée). Le fichier chiffré vit dans `stockage/identites/`, **hors
de `public/`** : aucune URL ne peut jamais le servir directement, seule la
route `/api/admin/verifications/photo/[id]` peut le déchiffrer, et seulement
pour un opérateur authentifié.

Suppression, cohérente avec le choix « purge paresseuse » déjà fait pour la
réservation 12h — pas de vraie tâche planifiée derrière ce fichier JSON,
donc le nettoyage est déclenché par de vraies actions plutôt que par un
cron externe que l'opérateur n'a pas encore :

- **refus** → suppression immédiate (la photo n'a plus aucun usage) ;
- **remise effectuée** (`marquerCommandeRemise`) → suppression immédiate,
  ne conserve que `valideeLe` comme trace d'audit, jamais l'image ;
- **réservation expirée avec vérification en attente** (photo envoyée mais
  jamais suivie d'un rendez-vous verrouillé) → suppression au même moment
  que la restauration du stock ;
- **vérification jamais traitée par l'opérateur** → au-delà de
  `DELAI_TRAITEMENT_VERIFICATION_HEURES` (48h par défaut,
  `lib/config.js`), la réservation est libérée et la photo supprimée. Sans
  cette borne, une commande oubliée retenait la pièce indéfiniment et
  conservait la pièce d'identité sans terme — la réservation de 12h ne
  court plus une fois le créneau retenu. Ajuster ce délai selon la
  réactivité réelle de l'opérateur.

Aucune copie de sauvegarde ne survit à ces suppressions : le fichier chiffré
est la seule copie, et `unlink()` est la seule voie de sortie.

## Sessions et notifications Telegram

`lib/session.js` vérifie la signature `initData` (HMAC, algorithme officiel
Telegram) dès que `TELEGRAM_BOT_TOKEN` est configuré — point non négociable
du README de passation. Sans ce token, une session de démonstration est
créée pour que le parcours reste testable en local ; ce repli est désactivé
dès que le token est présent, **et refusé en production** (`503`), où il
donnerait sinon une session valide à n'importe quel visiteur anonyme,
capable de bloquer du stock sans identité derrière.

Les deux cookies (client et back-office) sont signés avec le même secret
mais **avec des étiquettes de domaine distinctes**. Sans cette séparation,
un jeton client recopié dans le cookie admin valide comme jeton admin —
faille d'élévation de privilège identifiée et corrigée lors de l'audit du
projet.

**Les appels d'API acheteur ne dépendent pas du cookie** : chaque requête
porte l'`initData` signé dans l'en-tête `X-Telegram-Init-Data`, vérifié
côté serveur (`utilisateurDeLaRequete`). C'est ce qui rend l'app
utilisable sur Telegram Web, où la Mini App tourne dans une iframe : le
cookie y est un cookie tiers, non transmis avec `SameSite=Lax` et bloqué
par défaut par les navigateurs récents. Effet de bord bienvenu : aucune
prise CSRF, une page tierce ne pouvant pas forger cet en-tête. Le cookie
subsiste en repli pour le mode démonstration local. Le back-office, lui,
s'ouvre dans un navigateur normal et reste sur cookie.

`lib/telegram.js` envoie des notifications via l'API Bot (`sendMessage`),
jamais la photo elle-même dans un fil Telegram persistant : rendez-vous
confirmé et nouvelle vérification à traiter (à l'opérateur,
`TELEGRAM_OPERATOR_CHAT_ID`), identité validée/refusée (à l'acheteur, via
son `chat_id` Telegram). Sans token configuré, l'envoi est un no-op
silencieux plutôt qu'une erreur.

## Robustesse et durcissement

- **Validation des pièces** (`lib/validation.js`) : le back-office ne peut
  pas enregistrer un produit malformé. Le fichier qu'il écrit alimente
  toute la vitrine, et une seule sauvegarde bancale (`variantes` absent,
  prix en texte) suffirait à casser le catalogue pour tous les visiteurs.
  Les chemins de médias sont contraints à `/produits/…` : pas d'URL
  externe, qui ferait fuiter la consultation du catalogue vers un tiers.
- **Notifications Telegram** : tout ce qui vient des données est échappé
  avant d'être inséré dans un message `parse_mode: HTML`. Un nom de pièce
  contenant `&` ou `<` faisait rejeter le message entier par l'API, et
  l'opérateur perdait la notification de vente sans le savoir.
- **Tentatives de connexion** limitées (`lib/limitation.js`) par deux
  compteurs : un par appelant, et surtout un **global**. L'identifiant
  d'appelant vient de `X-Forwarded-For`, que l'attaquant fabrique : sans le
  plafond global, il change d'adresse à chaque essai et le garde-fou ne
  sert à rien (vérifié — 40 tentatives depuis 40 adresses passaient).
  *Compromis assumé* : 20 échecs suffisent à verrouiller aussi l'opérateur
  pendant 15 minutes. C'est un déni de service possible, préféré au risque
  de laisser deviner le mot de passe ; un redémarrage de l'application
  remet les compteurs à zéro.
- **Écritures atomiques** (`lib/stockage-json.js`) : fichier temporaire
  puis `rename()`, plus une copie `.bak` de la version précédente. Une
  interruption en cours d'écriture (arrêt du conteneur, dépassement
  mémoire, redéploiement) laissait sinon un JSON tronqué — et comme
  catalogue et commandes sont lus par toutes les pages, la boutique et le
  back-office tombaient ensemble, sans copie de secours.
- **Taille des corps de requête** bornée avant lecture, pour ne pas
  bufferiser un envoi volumineux avant de le refuser.
- **En-têtes de sécurité** dans `next.config.mjs` : CSP, `nosniff`,
  `Referrer-Policy`, HSTS. Volontairement **pas** de `X-Frame-Options` ni
  de `frame-ancestors` fermé — Telegram Web doit pouvoir embarquer la Mini
  App dans une iframe.

## Back-office (`/admin`)

Toujours protégé par mot de passe (`ADMIN_PASSWORD`) :

- catalogue : lister/ajouter/modifier une pièce, téléverser et réordonner les
  médias, publier ou retirer (lot 1) ;
- **commandes** (`/admin/commandes`) : voir les commandes confirmées
  (créneau, mode de remise, total, code de remise) et les marquer « remis »
  une fois les espèces échangées en main propre ;
- **vérifications** (`/admin/verifications`, nouveau au lot 3) : file
  d'attente des pièces d'identité à examiner, avec la photo déchiffrée et
  deux actions, valider ou refuser.

## Ce qui reste hors périmètre

Système de réputation/avis réel (le compteur affiche `—` plutôt qu'un
chiffre inventé) et effacement automatique du fil de discussion Telegram
24h après la remise (mentionné à l'écran, mais Telegram n'expose pas
d'API bot pour supprimer un fil côté utilisateur — solution à explorer côté
bot si nécessaire). Le reste de la spec du dossier de passation est
implémenté.
