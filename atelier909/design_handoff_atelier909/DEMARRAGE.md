# Démarrage — construire ATELIER 909 avec Claude Code

Guide pour l'opérateur. Il suppose que vous ne savez pas coder, mais que vous
êtes prêt à travailler dans un terminal.

---

## Avant de commencer

**Comptes à créer** (comptez 30 à 60 minutes, et une carte bancaire) :

1. **Telegram / BotFather** — gratuit. Créez le bot, gardez le token en lieu sûr.
2. **GitHub** — gratuit. Le code y vivra.
3. **Hébergeur front** — Vercel, Netlify ou Cloudflare Pages. Gratuit au départ.
4. **Hébergeur API + base** — Railway, Fly.io ou Render. Environ 5 à 20 €/mois.
5. **Stockage médias** — Cloudflare R2 ou Backblaze B2. Quelques euros par mois.
6. **Nom de domaine** — 10 à 15 €/an. Telegram exige du HTTPS sur un domaine à vous.

**Sur votre machine** : Node.js, Git, un éditeur (VS Code), et Claude Code.

**Règle d'or** : le token du bot, les clés de stockage et les mots de passe de
base ne vont **jamais** dans le code ni sur GitHub. Ils vivent dans un fichier
`.env` local et dans les variables d'environnement de l'hébergeur.

---

## Comment travailler avec Claude Code

Trois principes qui changent tout :

**Un lot à la fois.** Ne demandez pas l'application entière. Demandez la vitrine,
mettez-la en ligne, puis passez à la suite. Une app à moitié construite partout
est plus dure à rattraper qu'une app complète sur un périmètre réduit.

**Donnez-lui le dossier.** Au démarrage de chaque session, pointez-le sur ce
dossier de passation : le README contient les couleurs, les tailles, les règles
métier. Sans ça, il inventera — et il inventera du générique.

**Testez à chaque étape.** Après chaque changement notable, ouvrez l'app dans
Telegram sur votre téléphone. Un bug repéré tôt coûte cinq minutes ; le même bug
trois jours plus tard en coûte deux heures.

---

## L'enchaînement

### Étape 1 — Mise en place

Créez un dossier, déposez-y ce dossier de passation, ouvrez Claude Code et
demandez-lui de lire `design_handoff_atelier909/README.md` avant toute chose,
puis de proposer une structure de projet et une pile technique. Discutez-en
avant qu'il écrive une ligne.

### Étape 2 — Lot 1, la vitrine

Objectif : voir le catalogue dans Telegram, sur votre téléphone.

Dans l'ordre : le front avec les écrans Catalogue, Fiche produit et Recherche,
d'abord sur des données en dur (celles du README) ; puis le thème, les polices et
les animations ; puis la base et l'API ; puis le back-office pour ajouter vos
pièces ; puis la mise en ligne et la déclaration de la Mini App.

**C'est le moment de vérité.** Si la vitrine est en ligne au bout d'une semaine,
continuez seul. Sinon, vous saurez précisément quoi confier à un développeur.

### Étape 3 — Lot 2, la vente

Panier et réservation 12 h — attention au verrou en base, c'est le point
technique le plus délicat du projet : deux personnes ne doivent jamais réserver
la même pièce. Puis modes de remise, écran rendez-vous, calcul des coupures,
compte et suivi, code de remise, et le bot pour les notifications.

### Étape 4 — Lot 3, la vérification d'identité

Feuille de vérification, capture, stockage chiffré, file de traitement dans le
back-office, suppression automatique, badge vérifié.

Exigez explicitement : chiffrement au repos, suppression automatique par tâche
planifiée, accès restreint, aucune sauvegarde qui survive à la suppression, durée
de conservation configurable. Ne considérez pas ce lot fini tant que vous n'avez
pas **vu** un fichier disparaître automatiquement après une remise de test.

### Étape 5 — Avant l'ouverture

Testez sur iOS, Android et Telegram Desktop. Faites une commande complète de bout
en bout avec un ami. Vérifiez que la réservation expire vraiment au bout de 12 h.
Mettez en place une sauvegarde de la base. Faites relire le volet identité par un
juriste. Puis publiez le post du canal.

---

## Ce qui va coincer, et ce n'est pas grave

- **La première mise en ligne.** HTTPS, domaine, variables d'environnement : tout
  le monde y passe une soirée.
- **Les différences de webview.** Ce qui marche sur iOS peut casser sur Android.
- **La caméra.** Telegram n'a pas d'API caméra ; le contournement par
  `input file` a ses limites selon les appareils.
- **Le verrou de réservation.** Facile à écrire mal, difficile à voir échouer
  avant que ça arrive en vrai. Faites-le tester par Claude Code avec deux
  sessions simultanées.

---

## Repères de temps

| Étape | Durée réaliste |
|---|---|
| Comptes et mise en place | 1 jour |
| Lot 1 — vitrine en ligne | 3 à 5 jours |
| Lot 2 — vente complète | 1 à 2 semaines |
| Lot 3 — vérification d'identité | 3 à 5 jours |
| Tests et corrections | 3 à 5 jours |

**Total : 3 à 5 semaines**, en y travaillant régulièrement. Doublez si vous
découvrez le terminal en même temps.

---

*ATELIER 909*
