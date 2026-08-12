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
optionnels, voir « Sessions et notifications »).

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
  que la restauration du stock.

Aucune copie de sauvegarde ne survit à ces suppressions : le fichier chiffré
est la seule copie, et `unlink()` est la seule voie de sortie.

## Sessions et notifications Telegram

`lib/session.js` vérifie la signature `initData` (HMAC, algorithme officiel
Telegram) dès que `TELEGRAM_BOT_TOKEN` est configuré — point non négociable
du README de passation. Sans ce token (développement local, hors webview
Telegram), une session de démonstration est créée automatiquement pour que
le parcours reste testable ; ce repli est désactivé dès que le token est
présent.

`lib/telegram.js` envoie des notifications via l'API Bot (`sendMessage`),
jamais la photo elle-même dans un fil Telegram persistant : rendez-vous
confirmé et nouvelle vérification à traiter (à l'opérateur,
`TELEGRAM_OPERATOR_CHAT_ID`), identité validée/refusée (à l'acheteur, via
son `chat_id` Telegram). Sans token configuré, l'envoi est un no-op
silencieux plutôt qu'une erreur.

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
