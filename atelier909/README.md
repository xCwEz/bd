# ATELIER 909 — Lot 1 : vitrine

Next.js (App Router). Telegram Mini App pour une boutique de sportswear rare
(Stone Island, Nike ACG, Arc'teryx), opérée par une seule personne. Ce lot
couvre le catalogue, la fiche produit, la recherche/filtres, le thème et les
animations, et un back-office minimal — **pas de panier, pas de paiement**
(voir `design_handoff_atelier909/README.md` pour la spec complète et le
découpage en lots).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

Copier `.env.example` en `.env.local` avant de lancer le back-office
(`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).

## Structure

```
app/
  layout.js                 polices (Archivo, JetBrains Mono), squelette html/body
  globals.css                tout le style du site : tokens, animations, écrans
  (boutique)/                routes de la mini app (le chrome mobile vit ici)
    layout.js                 coquille téléphone, TabBar, grain/balayage, init Telegram
    page.js                    Catalogue
    produit/[ref]/page.js      Fiche produit
    recherche/page.js          Recherche et filtres
    panier/page.js             Écran d'attente (lot 2)
    compte/page.js             Écran d'attente (lot 3)
  admin/                     back-office, mise en page indépendante (pas de chrome mobile)
    connexion/page.js
    page.js                   liste des pièces
    produit/[ref]/page.js      édition (ref = "nouveau" pour créer)
  api/admin/
    login, logout             session par cookie signé (HMAC), voir lib/auth.js
    produits/route.js          GET liste / POST upsert (upload JSON complet)
    upload/route.js            téléversement d'un média vers public/produits/<ref>/
components/ui/                 un composant par bloc d'écran, noms français
lib/
  produits.js                 accès disque (lecture/écriture de data/produits.json) — jamais importé côté client
  formatage.js                 utilitaires purs (prix, badge) — importables côté client
  auth.js                      session admin (cookie HMAC signé, mot de passe en variable d'env)
  config.js                    handle opérateur, seuil de vérification d'identité
data/produits.json             catalogue — voir « Données »
public/produits/<ref>/         vrais médias, une fois transmis par l'opérateur
```

## Données

`data/produits.json` est la source de vérité du catalogue pour ce lot (pas
de base de données : le README de passation autorise SQLite/fichier au lot 1
pour simplifier le démarrage). Le back-office lit et réécrit ce fichier.

Les **quatre pièces actuelles sont des données de démonstration**, reprises
de la maquette — à remplacer ou compléter via `/admin`. Un `verified_at`,
un compte utilisateur, ou tout ce qui touche à la réservation n'existe pas
encore : c'est le lot 2.

Tant qu'aucun média réel n'est fourni (`cle: null`), l'emplacement est un
dégradé procédural animé (`MediaPlaceholder`), jamais une image cassée —
même principe que le projet `bourganeuf-automobiles`.

## Back-office (`/admin`)

Page protégée par mot de passe (`ADMIN_PASSWORD`), suffisante pour un seul
opérateur non technique :

- lister les pièces et leur statut ;
- ajouter / modifier une pièce (marque, année, nom, description, condition,
  tailles/prix/stock, badge) ;
- téléverser photos et vidéo, les réordonner, les retirer ;
- publier ou retirer une pièce via le champ **statut** (`en_ligne` = visible
  au catalogue, tout autre statut la masque).

Pas d'authentification par utilisateur, pas de rôles : un mot de passe
partagé suffit à ce volume. Le stockage des médias est local au serveur
(`public/produits/`) — un hébergement sans disque persistant (ex. Vercel)
ne convient donc pas pour l'API en l'état ; voir la recommandation d'hébergement
du dossier de passation (Railway / Fly.io / VPS).

## Intégration Telegram

`TelegramInit` (dans `(boutique)/layout.js`) charge le SDK, appelle `ready()`
et `expand()`. Le thème reste sombre fixe : `themeParams` n'est jamais lu.
Le `BackButton` est câblé sur la fiche produit (`EnTeteMedia`).

Reste à faire pour la mise en ligne réelle : déclaration du bot auprès de
`@BotFather` (`/newapp`, `/setdomain`), et hébergement en HTTPS — Telegram
refuse le HTTP.

## Ce qui n'est pas dans ce lot

Panier, réservation 12h, modes de remise, vérification d'identité, compte et
suivi de commande, bot de notification : tout ça est décrit dans le dossier
de passation (`design_handoff_atelier909/README.md`, lots 2 et 3) mais pas
implémenté ici. Les onglets Panier et Compte affichent un écran d'attente
sobre plutôt qu'une fonctionnalité à moitié faite.
