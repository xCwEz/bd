# Déploiement — ATELIER 909

Ce document couvre ce que je ne peux pas faire à ta place : créer le bot
dans Telegram (ça se fait depuis ton propre compte) et ouvrir un compte
d'hébergement. Suis les étapes dans l'ordre — chacune dépend de la
précédente.

## Vue d'ensemble

1. Créer le bot avec @BotFather → récupérer `TELEGRAM_BOT_TOKEN`.
2. Récupérer ton `TELEGRAM_OPERATOR_CHAT_ID` (pour recevoir les notifications).
3. Choisir un hébergement et déployer l'app → obtenir une URL en HTTPS.
4. Retourner dans @BotFather pour déclarer la Mini App avec cette URL.
5. Vérifier que tout fonctionne depuis un vrai téléphone.

Les secrets `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` et
`IDENTITE_CHIFFREMENT_CLE` sont déjà générés dans `.env.local` (jamais
commité). Il ne manque que les deux valeurs Telegram ci-dessous.

---

## 1. Créer le bot avec @BotFather

1. Dans Telegram, ouvre une conversation avec **@BotFather** (compte
   officiel, coché).
2. Envoie `/newbot`.
3. Donne un nom d'affichage (ex. `ATELIER 909`).
4. Donne un nom d'utilisateur se terminant par `bot` (ex. `atelier909_bot`)
   — c'est ce qui apparaît dans l'URL `t.me/atelier909_bot`.
5. BotFather répond avec un **token** (`123456789:AAAbcDEFghi...`). Colle-le
   dans `atelier909/.env.local` :
   ```
   TELEGRAM_BOT_TOKEN=le-token-recu
   ```

Garde ce token secret — il permet d'envoyer des messages en tant que ton
bot et de vérifier les sessions Mini App.

## 2. Récupérer ton `TELEGRAM_OPERATOR_CHAT_ID`

Le bot doit connaître *ton* identifiant de conversation pour t'envoyer les
notifications de vente et de vérification à traiter.

1. Envoie n'importe quel message à ton bot (ex. `/start`) — un bot ne peut
   pas écrire à quelqu'un qui ne lui a jamais parlé.
2. Depuis un terminal, remplace `<TOKEN>` par ton vrai token et lance :
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```
3. Dans la réponse JSON, cherche `"message":{"chat":{"id": ...}}` — ce
   nombre (souvent négatif pour un groupe, positif pour toi en privé) est
   ton `chat_id`. Colle-le dans `.env.local` :
   ```
   TELEGRAM_OPERATOR_CHAT_ID=le-nombre-recu
   ```

## 3. Choisir un hébergement

**Pas Vercel** (ni aucun hébergement serverless sans disque persistant) :
l'app écrit sur disque — `data/*.json` (catalogue, commandes),
`public/produits/` (photos et vidéos des pièces), `stockage/identites/`
(pièces d'identité chiffrées). Ces écritures disparaîtraient à chaque
redéploiement sur une plateforme sans volume persistant.

Options qui conviennent, par ordre de simplicité :

- **Railway** ou **Fly.io** — détectent le `Dockerfile`, proposent un volume
  persistant en quelques clics, HTTPS automatique sur un sous-domaine
  `*.up.railway.app` / `*.fly.dev` (suffisant pour Telegram, qui exige
  seulement du HTTPS, pas un domaine précis).
- **VPS** (ex. Hetzner, OVH) — plus de travail (installer Docker, configurer
  un reverse proxy avec certificat TLS, ex. Caddy ou nginx + Let's Encrypt),
  mais coût fixe prévisible et contrôle total.

## 4. Déployer avec Docker

Le `Dockerfile` à la racine du projet construit une image de production
(Next.js en mode `standalone`, voir `next.config.mjs`).

**Volume à monter**, quelle que soit la plateforme — trois dossiers doivent
survivre aux redéploiements :

```
/app/data
/app/public/produits
/app/stockage
```

Exemple avec Docker directement (sur un VPS) :

```bash
docker build -t atelier909 .
docker run -d \
  --name atelier909 \
  -p 3000:3000 \
  --env-file .env.local \
  -v atelier909_data:/app/data \
  -v atelier909_medias:/app/public/produits \
  -v atelier909_identites:/app/stockage \
  atelier909
```

Sur Railway/Fly.io, l'équivalent se fait dans leur interface (« Volumes »),
en pointant chacun des trois chemins ci-dessus vers un volume nommé.

Mets ensuite un reverse proxy TLS devant le port 3000 (Railway/Fly.io le
font automatiquement ; sur un VPS nu, Caddy avec un simple `Caddyfile`
suffit à obtenir un certificat Let's Encrypt sans configuration
supplémentaire).

## 5. Déclarer la Mini App dans @BotFather

Une fois l'app en ligne sur son URL HTTPS définitive (ex.
`https://atelier909.up.railway.app`) :

1. Retourne dans **@BotFather**, envoie `/newapp`.
2. Choisis ton bot.
3. Donne un titre, une description courte, et une photo (512×512 environ) —
   ce qui s'affiche dans Telegram avant l'ouverture de l'app.
4. Quand demandé, colle l'URL HTTPS de ton déploiement.
5. Envoie `/setdomain`, choisis ton bot, colle le même domaine (sans
   `https://`, juste `atelier909.up.railway.app`).
6. (Optionnel mais recommandé) `/mybots` → ton bot → **Bot Settings** →
   **Menu Button** → renseigne la même URL, pour un accès direct depuis la
   conversation sans passer par une commande.

## 6. Vérification finale

- [ ] Ouvrir `t.me/<ton_bot>` depuis un téléphone, lancer la Mini App,
      vérifier que le catalogue s'affiche.
- [ ] Ajouter une pièce au panier, vérifier que la session est bien reconnue
      (pas de « Session absente » dans le panier).
- [ ] Se connecter à `/admin` avec le `ADMIN_PASSWORD` généré.
- [ ] Envoyer un message test au bot, confirmer qu'une commande confirmée en
      conditions réelles déclenche bien une notification sur ton compte
      Telegram.
- [ ] Vérifier que `stockage/identites/` (photos chiffrées) et
      `public/produits/` survivent à un redéploiement — c'est le rôle des
      volumes de l'étape 4.

À partir de là, remplace les quatre pièces de démonstration par le vrai
catalogue via `/admin`, et le handle `@m_vaudreuil` dans
`lib/config.js` par le tien.
