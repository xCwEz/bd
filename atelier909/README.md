# ATELIER 909 — Lots 1 et 2 : vitrine et vente

Next.js (App Router). Telegram Mini App pour une boutique de sportswear rare
(Stone Island, Nike ACG, Arc'teryx), opérée par une seule personne. Lot 1 :
catalogue, fiche produit, recherche/filtres, thème et animations, back-office
minimal. Lot 2 : panier avec réservation 12h, modes de remise, rendez-vous et
espèces, compte et suivi de commande, code de remise, notifications bot
(voir `design_handoff_atelier909/README.md` pour la spec complète et le
découpage en lots).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

Copier `.env.example` en `.env.local` avant de lancer le back-office ou le
panier (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` obligatoires ; `TELEGRAM_BOT_TOKEN`
et `TELEGRAM_OPERATOR_CHAT_ID` optionnels, voir « Sessions et notifications »).

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
    panier/page.js                Panier (composant client, données par API)
    panier/rendez-vous/page.js    Créneaux, zone, espèces, verrouillage du RDV
    compte/page.js                Profil, commande en cours, historique
  admin/                       back-office, mise en page indépendante (pas de chrome mobile)
    connexion/page.js
    page.js                       liste des pièces
    produit/[ref]/page.js          édition (ref = "nouveau" pour créer)
    commandes/page.js              commandes confirmées, marquer comme remises
  api/
    session/route.js               établit la session (initData Telegram ou démo)
    panier/route.js                GET panier courant
    panier/ajouter, retirer, mode-remise, rendez-vous   mutations du panier
    compte/route.js                profil + commande en cours + historique
    admin/…                        produits, upload, commandes (protégés par cookie admin)
components/ui/                   un composant par bloc d'écran, noms français
lib/
  produits.js                   accès disque produits — jamais importé côté client
  commandes.js                  panier/commandes : réservation, verrou, totaux, code de remise
  session.js                    vérification initData (HMAC), cookie de session signé
  telegram.js                   envoi de notifications via l'API Bot
  formatage.js                  utilitaires purs (prix, badge) — importables côté client
  auth.js                       session admin (mot de passe en variable d'env)
  config.js                     frais de remise, seuil d'identité, créneaux, coupures
  panier-client.js               assurerSession() côté navigateur
data/produits.json               catalogue
data/commandes.json              paniers et commandes
public/produits/<ref>/           vrais médias, une fois transmis par l'opérateur
```

## Panier, réservation et verrou

`lib/commandes.js` gère tout le cycle panier → rendez-vous. Points clés :

- **Réservation 12h** : à l'ajout au panier, la variante voit son `stock`
  décrémenté immédiatement et la commande reçoit un `reservationExpire`.
  Passé ce délai, la prochaine requête touchant le panier restaure le stock
  et marque la commande `expiree` — la purge est **paresseuse** (pas de
  tâche planifiée réelle derrière ce fichier JSON), donc invisible tant que
  personne ne revisite le panier, mais toujours cohérente au prochain accès.
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
  en dur dans le code, comme demandé par le README de passation.

## Vérification d'identité : volontairement absente

Le panier applique la règle des 500 € (encart d'information, bouton
désactivé) mais **ne permet pas de confirmer** une commande qui l'atteint :
la capture, le stockage chiffré et la revue manuelle sont le lot 3, marqué
dans le dossier de passation comme la partie sensible à traiter avec le plus
de soin. Plutôt que de simuler une vérification qui n'existe pas,
`confirmerRendezVous()` refuse explicitement ces commandes et l'écran panier
l'explique à l'acheteur. Aucune commande ≥ 500 € ne peut donc être vendue
tant que le lot 3 n'est pas livré — c'est voulu.

## Sessions et notifications Telegram

`lib/session.js` vérifie la signature `initData` (HMAC, algorithme officiel
Telegram) dès que `TELEGRAM_BOT_TOKEN` est configuré — point non négociable
du README de passation. Sans ce token (développement local, hors webview
Telegram), une session de démonstration est créée automatiquement pour que
le parcours reste testable ; ce repli est désactivé dès que le token est
présent.

`lib/telegram.js` envoie deux notifications via l'API Bot (`sendMessage`) :
rendez-vous confirmé (à l'opérateur, `TELEGRAM_OPERATOR_CHAT_ID`) et,
implicitement via la purge, réservation expirée. Sans token configuré, l'envoi
est un no-op silencieux plutôt qu'une erreur.

## Back-office (`/admin`)

Toujours protégé par mot de passe (`ADMIN_PASSWORD`) :

- catalogue : lister/ajouter/modifier une pièce, téléverser et réordonner les
  médias, publier ou retirer (lot 1) ;
- **commandes** (`/admin/commandes`, nouveau au lot 2) : voir les commandes
  confirmées (créneau, mode de remise, total, code de remise) et les marquer
  « remis » une fois les espèces échangées en main propre — c'est ce qui fait
  avancer le suivi côté acheteur jusqu'à l'étape finale.

## Ce qui n'est pas dans ce lot

Vérification d'identité (capture, stockage chiffré, file de traitement,
badge vérifié), système de réputation/avis, suppression automatique du fil
de discussion : lot 3, décrit dans le dossier de passation. Le compteur
« Réputation » du profil affiche `—` plutôt qu'un chiffre inventé, faute de
système d'avis réel.
