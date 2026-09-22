# Guide de lancement — La Brigade

Ce guide s'adresse à quelqu'un qui **ne programme pas**. Il explique, dans
l'ordre, comment passer du site en démonstration à un site qui encaisse des
paiements et ouvre les leçons à ceux qui ont payé. Comptez une heure la première
fois, en suivant chaque étape sans en sauter.

Vous n'aurez besoin que de trois choses : un compte GitHub (vous l'avez déjà,
c'est là que vit ce site), un compte Stripe (gratuit à ouvrir), et un
navigateur.

---

## Comment ça marche, en une minute

1. Un visiteur clique sur **Rejoindre la Brigade**. Il arrive sur une page de
   paiement **hébergée par Stripe** — pas sur votre site. Stripe encaisse,
   perçoit les taxes si vous le lui demandez, et vous vire l'argent.
2. Une fois payé, Stripe le renvoie sur votre site avec un **code d'accès**
   dans l'adresse. Le site reconnaît le code et ouvre toutes les leçons sur
   son appareil. Le code s'affiche aussi sur la page de confirmation, pour
   qu'il puisse l'entrer sur un autre appareil.
3. Votre site ne garde **aucune donnée** sur vos clients : pas de compte, pas
   de mot de passe, pas de base de données. C'est ce qui permet de l'héberger
   gratuitement sur GitHub Pages.

Le site ne connaît jamais les codes : il connaît leur **empreinte**, une
signature à sens unique. On peut la publier sans risque, personne ne retrouve
le code à partir d'elle. Vous, vous gardez les codes dans un endroit sûr.

---

## Étape 1 — Fabriquer vos codes d'accès

1. Ouvrez, sur votre site publié, la page
   `https://pfrcharlespatrick-rgb.github.io/mon-epicerie/outils/codes.html`
   (remplacez par votre adresse si elle diffère).
2. Indiquez **1** dans « Combien ? » et cliquez **Générer**. Vous obtenez un
   code du genre `BRIGADE-7K3M-Q9X2` et, sous lui, une longue empreinte.
3. **Notez le code** dans une note ou un tableur que vous seul voyez. C'est
   celui que vos clients recevront.
4. Cliquez **Copier les empreintes**. Vous en aurez besoin à l'étape 3.

> Un seul code pour tous les clients suffit pour commencer : c'est le plus
> simple. Voyez la section « Aller plus loin » pour un code par client.

---

## Étape 2 — Créer le produit et le lien de paiement chez Stripe

### 2.1 Le compte

1. Allez sur **stripe.com** et cliquez **Commencer** (ou *Start now*).
   Choisissez le Canada comme pays, entrez votre courriel, un mot de passe.
2. Stripe vous demandera de **vérifier votre identité** et d'indiquer un
   compte bancaire pour recevoir les virements : suivez ses écrans. Vous
   pouvez déjà tout configurer et tester avant que ce soit terminé.
3. En haut à droite du tableau de bord se trouve un interrupteur **Mode
   test**. Tant qu'il est allumé, aucun vrai paiement ne passe : c'est là
   qu'on essaie.

### 2.2 Le produit

1. Menu de gauche : **Catalogue de produits** → **Ajouter un produit**.
2. Nom : `La Brigade — accès complet`.
   Description : `Toutes les leçons de cuisine, celles d’aujourd’hui et celles
   à venir. Paiement unique, accès à vie.`
3. Tarif : **Paiement unique**, montant `49,00`, devise **CAD**. (Le prix est
   à vous ; voyez « Choisir son prix » plus bas.)
4. Enregistrez.

### 2.3 Les taxes (TPS et TVQ)

Au Québec, vous devez percevoir les taxes à partir d'un certain chiffre
d'affaires (30 000 $ sur douze mois pour la TPS ; renseignez-vous auprès de
Revenu Québec pour votre situation). Stripe peut les calculer seul :

1. Menu **Plus** → **Stripe Tax** → **Commencer**. Indiquez que vous êtes
   inscrit au Québec quand ce sera le cas.
2. Dans le produit, le bouton **Modifier** sur le tarif permet de choisir
   « Le prix inclut les taxes » ou non. *Inclus* est plus simple à afficher :
   le client voit 49 $ et paie 49 $.

Si vous n'êtes pas encore inscrit aux taxes, sautez cette sous-étape. Le site
affiche le prix tel que vous l'écrivez dans la configuration.

### 2.4 Le lien de paiement

1. Menu **Liens de paiement** → **Nouveau** (ou *Créer un lien de paiement*).
2. Choisissez le produit `La Brigade — accès complet`.
3. Onglet **Après le paiement** :
   - Choisissez **Ne pas afficher la page de confirmation** →
     **Rediriger les clients vers votre site web**.
   - Adresse de redirection, en remplaçant `VOTRE-CODE` par le code de
     l'étape 1 (sans espaces) :

     ```
     https://pfrcharlespatrick-rgb.github.io/mon-epicerie/brigade.html?code=VOTRE-CODE#parcours
     ```

     Le client atterrit sur les parcours, déjà déverrouillé.
   - Vous préférez qu'il voie une page Stripe de confirmation ? Choisissez
     alors **Afficher la page de confirmation**, cochez **Remplacer par un
     message personnalisé** et écrivez :

     ```
     Bienvenue dans la Brigade ! Votre code d’accès : VOTRE-CODE
     Entrez-le une fois sur https://pfrcharlespatrick-rgb.github.io/mon-epicerie/brigade.html#rejoindre
     Gardez ce code : il ouvre les leçons sur tous vos appareils.
     ```
4. Onglet **Options** : cochez **Autoriser les codes promotionnels** si vous
   voulez lancer des rabais plus tard. Laissez le reste par défaut.
5. Cliquez **Créer le lien**. Copiez l'adresse, qui ressemble à
   `https://buy.stripe.com/test_xxxxxxxx` en mode test.

### 2.5 Le reçu

Stripe envoie un reçu par courriel si vous l'activez : **Paramètres** →
**Courriels** (ou *Emails*) → cochez **Reçus de paiements réussis**. Le reçu
ne contient pas le code ; c'est pour cela qu'on l'affiche sur la page de
confirmation ou qu'on redirige le client déjà déverrouillé. Le client qui perd
son code vous écrit avec ce reçu, et vous lui renvoyez le code.

---

## Étape 3 — Écrire ces informations dans le site

Le seul fichier à modifier est `assets/js/config-brigade.js`. On le fait
directement dans GitHub, sans rien installer.

1. Allez sur `https://github.com/pfrcharlespatrick-rgb/mon-epicerie`.
2. Cliquez sur le dossier **assets**, puis **js**, puis sur
   **config-brigade.js**.
3. Cliquez sur le **crayon** (Modifier ce fichier), en haut à droite.
4. Changez ces lignes — et seulement celles-là. Gardez les guillemets et les
   virgules exactement comme ils sont :

   ```js
   modeDemo: false,

   lienPaiement: 'https://buy.stripe.com/test_xxxxxxxx',

   prix: '49 $',
   prixDetail: 'Paiement unique · accès à vie · toutes les leçons, celles d’aujourd’hui et celles à venir',

   empreintes: [
     'collez ici l’empreinte copiée à l’étape 1, entre ses guillemets',
   ],

   courrielSoutien: 'votre.adresse@exemple.com',
   ```

   Chaque empreinte est une ligne, entre guillemets simples, terminée par une
   virgule. L'outil de l'étape 1 les donne déjà dans ce format.
5. En haut à droite, cliquez **Commit changes…** (Valider), puis encore
   **Commit changes**. GitHub Pages republie le site en une ou deux minutes.

> **Ne mettez jamais un code d'accès dans ce fichier — seulement des
> empreintes.** Tout ce qui est dans ce dépôt est public.

---

## Étape 4 — Tester en mode test

1. Ouvrez votre site, page **La Brigade**. Le bandeau « Mode démonstration »
   a disparu ; les leçons sans mention « Gratuit » montrent un cadenas.
2. Ouvrez une leçon payante : les étapes sont floutées, un bouton propose de
   rejoindre. Cliquez **Rejoindre la Brigade**, puis **Payer et rejoindre**.
3. Sur la page Stripe, en mode test, payez avec la carte de test :
   numéro `4242 4242 4242 4242`, n'importe quelle date future, n'importe quel
   code à trois chiffres, n'importe quel nom.
4. Vous revenez sur le site, déverrouillé. Ouvrez la leçon payante : elle est
   entière. Fermez le navigateur, revenez : elle l'est toujours.
5. Testez le code à la main : page **Rejoindre**, sous « J'ai déjà un code »,
   cliquez **Oublier l'accès ici**, puis entrez le code (les minuscules et les
   espaces ne dérangent pas). Il doit être accepté ; un code au hasard doit
   être refusé.
6. Testez sur un téléphone : la voix, le mode mains libres (« suivant »,
   « répète »), et « Envoyer à ma liste d'épicerie » qui remplit Mon Épicerie.

Quand tout marche, dans Stripe : éteignez le **Mode test**, refaites le lien
de paiement (étape 2.4) en mode réel — les liens de test ne fonctionnent pas
en réel —, et remplacez `lienPaiement` par le nouveau lien (étape 3). Faites
un vrai achat de 49 $ vous-même pour voir passer l'argent, puis remboursez-le
depuis Stripe (**Paiements** → le paiement → **Rembourser**).

---

## Choisir son prix et son modèle

Le site est réglé pour un **paiement unique à vie**, parce que c'est le
modèle qui ne demande aucun serveur : rien à renouveler, rien à couper. Trois
propositions, du plus simple au plus ambitieux :

| Modèle | Prix suggéré | Pour qui | Ce qu'il faut changer |
|---|---|---|---|
| **Accès à vie** (réglé par défaut) | 49 $ à 89 $ CAD | Lancer vite, vendre à des particuliers | Rien |
| **Prix de lancement** | 29 $ les trente premiers jours, puis 49 $ | Convertir les premiers curieux | Un code promotionnel dans Stripe (**Produits** → **Coupons**), et cocher « Autoriser les codes promotionnels » sur le lien |
| **Abonnement mensuel** | 9 $ à 14 $ par mois | Quand le catalogue dépasse vingt leçons | Un tarif récurrent dans Stripe **et** un petit serveur pour couper l'accès à la fin de l'abonnement — demandez-le comme prochaine étape de développement |

Un repère : neuf leçons complètes, chacune avec ses pièges, ses signes de
réussite et ses températures, valent largement le prix d'un livre de cuisine.
Vous ajouterez des leçons ; le prix pourra monter, et les clients d'avant
garderont tout — c'est ce qu'on leur a promis.

---

## Publier, et après

- Le site est publié par **GitHub Pages depuis la branche `main`**. Une fois
  ce travail fusionné dans `main`, il est en ligne. Pour vérifier :
  **Settings** → **Pages** dans le dépôt.
- Chaque fois que vous modifiez un fichier et validez (*Commit*), le site se
  met à jour en une ou deux minutes.
- Les visiteurs qui ont déjà ouvert le site gardent parfois l'ancienne
  version en mémoire : le fichier `sw.js` porte un numéro de version (`v7`)
  qu'il faut augmenter (`v8`, `v9`…) quand on change autre chose que la
  configuration.

### Faire connaître le site

- Le lien à partager : `https://pfrcharlespatrick-rgb.github.io/mon-epicerie/brigade.html`.
- La leçon gratuite la plus convaincante à envoyer telle quelle :
  `…/brigade.html#lecon/saisir-sans-coller` (Amadou, la poêle) — courte,
  spectaculaire, et elle donne envie du poulet rôti qui la suit.
- Un **nom de domaine** (`labrigade.ca`, `brigade-cuisine.com`…) coûte une
  quinzaine de dollars par année et se branche sur GitHub Pages en dix
  minutes (**Settings** → **Pages** → **Custom domain**). Faites-le avant la
  publicité : l'adresse actuelle est difficile à retenir.

---

## Ce que la loi vous demande (Québec)

Ce ne sont pas des conseils juridiques ; c'est la liste des sujets à régler.

- **Conditions de vente.** Une page qui dit ce qu'on achète (accès aux leçons
  publiées et à venir, sur ses appareils, pour usage personnel), ce qu'on ne
  peut pas faire (partager le code, revendre le contenu), et la politique de
  remboursement (par exemple : *remboursé sur demande dans les 14 jours*).
  Une politique de remboursement claire vend plus qu'elle ne coûte.
- **Taxes.** TPS et TVQ à percevoir dès l'inscription obligatoire ; Stripe Tax
  fait le calcul, vous faites les déclarations. Un comptable une heure par
  année suffit au début.
- **Renseignements personnels.** Le site n'en collecte aucun ; Stripe, lui,
  garde le courriel et le paiement. Dites-le dans une courte politique de
  confidentialité, et nommez un responsable (vous), comme la Loi 25 le
  demande.
- **Sécurité alimentaire.** Les leçons citent les températures de Santé
  Canada et signalent quand une cuisson est un choix (le saumon mi-cuit).
  Gardez cette rigueur en ajoutant des leçons.
- **Droit à l'image.** Les chefs de la Brigade sont des personnages
  originaux. **N'utilisez jamais le visage, le nom ou la voix d'une personne
  réelle** — chef connu ou non — pour vendre ce site : au Québec, le Code
  civil (art. 35 et 36) l'interdit sans son accord, et ce serait trompeur
  pour vos clients. Les personnages vous appartiennent ; c'est votre force.

---

## Aller plus loin

**Un code par client.** Générez plusieurs codes à l'étape 1 et ajoutez
toutes les empreintes dans `empreintes`. Donnez-en un différent à chaque
client (par courriel, après avoir vu le paiement dans Stripe). Un client qui
partage son code pourra alors être identifié — et son empreinte retirée du
fichier.

**Un serveur, plus tard.** Le jour où vous voudrez des abonnements, des codes
uniques envoyés automatiquement, ou le contenu des leçons vraiment caché (il
est aujourd'hui lisible par quelqu'un qui sait ouvrir le code source), il
faudra une petite pièce logicielle entre Stripe et le site. C'est un travail
d'une journée pour un développeur ; ce site est prêt à l'accueillir.

**Un sous-chef qui répond.** Un assistant dans la leçon, à qui l'on demande
« je n'ai pas de crème, je fais quoi ? », est la suite naturelle. Il a besoin
du même petit serveur.

**Ajouter des leçons.** Tout le contenu tient dans `assets/js/lecons.js`, en
clair, avec le modèle documenté en tête de fichier. Six leçons sont déjà
annoncées « en préparation » : les écrire est la meilleure raison de revenir
vers vos clients.
