# Mon Épicerie

Liste de courses hebdomadaire pour la région de Québec : un catalogue de
163 produits habituels, des quantités, des enseignes, l'impression et la
sauvegarde. Et, par la marmite en haut de la liste, **Ma Cuisine** : le
conseiller culinaire qui mène ce qu'on rapporte du marché jusqu'à la table,
piloté à la température à cœur. Et, par le chalet, **l'inventaire du Lac
Péré** : ce que le domaine de pêche a en stock au moment de fermer. Le tout
fonctionne hors ligne et sans compte.

**→ [Ouvrir l'application](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/)**

**→ [Ouvrir Ma Cuisine](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/cuisine/)** —
voir [sa section](#ma-cuisine--le-conseiller-culinaire) plus bas.

**→ [Ouvrir l'inventaire du Lac Péré](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/lac-pere/)** —
l'inventaire de l'épicerie et du matériel du domaine de pêche, conçu pour la
fermeture de saison ; voir [sa section](#lac-péré--linventaire-du-domaine).

---

## Comment ça marche

L'application distingue deux choses :

- **Le catalogue** — la liste complète des produits que vous achetez
  d'ordinaire. Il ne change pas d'une semaine à l'autre.
- **Ma liste** — ce que vous achetez *cette semaine*. Un produit y entre dès
  que vous lui donnez une quantité, un magasin, ou que vous le cochez.

Le va-et-vient entre les deux se fait par les deux onglets en haut. En
pratique : on ouvre le catalogue en début de semaine, on met des quantités, puis
on bascule sur « Ma liste » pour aller au magasin.

### À l'épicerie

- Une case à cocher par article, avec la progression en haut de l'écran.
- **Grouper par magasin** (dans les filtres) réorganise la liste par enseigne
  plutôt que par rayon — pratique quand la tournée passe par trois commerces.
- La page fonctionne sans réseau une fois ouverte.
- Sur téléphone, « Ajouter à l'écran d'accueil » l'installe comme une
  application.

### Conserver et partager

Le bouton **Exporter** propose quatre choses :

| Option | À quoi ça sert |
|---|---|
| Imprimer / PDF | Feuille épurée, sans boutons ni couleurs inutiles |
| Copier le texte | Pour coller dans un message ou une note |
| Sauvegarde `.json` | Fichier réutilisable, à conserver |
| Restaurer | Recharge un fichier de sauvegarde |

## Vos données

Tout est stocké dans le navigateur (`localStorage`), sur votre appareil.
L'application n'a pas de serveur, pas de compte, pas de traceur, et n'envoie
aucune requête vers l'extérieur — à deux exceptions près, choisies et
expliquées : l'analyse de photo de Ma Cuisine et celle de l'inventaire du Lac
Péré, qui parlent directement à l'API d'Anthropic avec votre propre clé. Corollaire : vider les données du navigateur
efface la liste — d'où l'intérêt de la sauvegarde `.json` avant un grand ménage.

## Vos propres rayons et magasins

Depuis l'application, sans toucher au code : **Filtres → ✏️ Mes rayons et
magasins**.

- **Rayons** — nom et icône libres (Électronique, Pêche, Plats cuisinés…). Ils
  apparaissent aussitôt dans les filtres, dans la fiche des articles et dans le
  regroupement de la liste.
- **Magasins** — nom et couleur de pastille, pour une enseigne absente de la
  liste fournie.

Supprimer ne détruit jamais un article : les produits d'un rayon supprimé sont
déplacés dans « Divers & Animaux », et ceux d'un magasin supprimé se retrouvent
simplement sans magasin. Renommer un magasin met à jour tous les articles qui le
portaient. Ces ajouts font partie de la sauvegarde `.json`.

## Modifier le catalogue livré

Pour changer ce que voient *tous* les utilisateurs — et non le seul appareil qui
consulte le site —, tout le contenu tient dans
[`assets/js/catalogue.js`](assets/js/catalogue.js).

Ajouter un produit — une ligne dans le bon rayon :

```js
const CATALOGUE = {
  produce: [
    'Piment vert',
    'Rhubarbe',        // ← nouveau
    …
  ],
```

Ajouter une enseigne — `teinte` est un angle de teinte HSL (0 à 360) ; la
pastille de couleur en est déduite automatiquement, lisible en thème clair
comme en thème sombre :

```js
export const DETAILLANTS = [
  { nom: 'Provigo', teinte: 340 },
  …
];
```

Ajouter un rayon — l'ordre de la liste est l'ordre d'affichage, alors autant le
faire suivre le parcours réel des allées :

```js
export const RAYONS = [
  { id: 'traiteur', nom: 'Traiteur & Prêt-à-manger', emoji: '🥗' },
  …
];
```

Les identifiants techniques sont dérivés du nom des produits, il n'y a donc
aucun numéro à gérer à la main. Un produit ajouté au catalogue apparaît chez les
utilisateurs existants au prochain chargement, sans effacer leur liste en cours
— et sans faire revenir ceux qu'ils ont volontairement supprimés.

## Ma Cuisine — le conseiller culinaire

Dans le dossier [`cuisine/`](cuisine/), une seconde application, bâtie dans le
même esprit — sans dépendance, sans serveur, hors ligne — mais pour l'autre
bout de la chaîne : une fois la pièce rapportée de l'épicerie, elle compose la
recette complète qui la mènera à la table.

**→ [Ouvrir Ma Cuisine](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/cuisine/)**

On choisit la pièce (une vingtaine, de la côte de bœuf à la dinde des Fêtes,
du saumon au chou-fleur entier), on donne le poids inscrit sur l'étiquette, la
cuisson désirée et, si l'on veut, l'heure du service. L'application produit
alors des étapes numérotées, titrées et minutées, selon des règles constantes :

- **La température à cœur décide, jamais l'horloge seule** — chiffre exact au
  retrait du feu et après repos, avec la fenêtre de temps en ordre de grandeur.
- **Salage à sec la veille** chaque fois que la pièce s'y prête, avec la dose
  calculée d'après le poids, et l'explication du pourquoi.
- **Repos après cuisson**, toujours ; **sucs et fonds jamais jetés** — chaque
  recette se termine par la sauce qui les récupère.
- Les étapes où tout peut se gâcher sont marquées, avec les signes de réussite
  au toucher, à l'œil et à l'odeur.
- Système métrique, degrés Celsius, vocabulaire d'ici ; les méthodes populaires
  inférieures sont signalées avec leur compromis, sans sermon.
- Une note de conservation et de réchauffage, une suggestion d'accompagnement,
  et le **calendrier à rebours** : depuis l'heure du service, l'application
  date chaque départ, jusqu'au dégel de la dinde plusieurs jours avant.

Le bouton **🍳 Ma cuisine** consigne l'équipement possédé (thermomètre à
sonde, fonte, cocotte…) : les recettes s'y adaptent et proposent des
substitutions plutôt que de renvoyer au magasin. Le **📖 Carnet** garde les
recettes composées (localStorage, comme la liste d'épicerie). Chaque recette
affichée s'emporte de quatre façons : **Imprimer / PDF** (la feuille épurée,
que le navigateur sait enregistrer en PDF), **📄 Word** (un `.docx` véritable,
fabriqué dans le navigateur sans bibliothèque — une archive ZIP OOXML
minimale), et **📤 Partager** (la feuille de partage native du téléphone —
messagerie, courriel —, avec repli sur la copie dans le presse-papiers).

### Le conseiller à l'œil : la photo

En tête de page, une seconde manière d'entrer : **photographier la pièce**,
étiquette visible, et dire ce qu'on en attend — ou écrire sa demande **sans
photo** (« un souper pour quatre avec ce que j'ai au congélateur ») : le
conseiller compose alors depuis l'inventaire et la liste. La photo, quand il
y en a une, est analysée par
Claude (Anthropic) — identification de la coupe et du poids — puis la recette
est composée selon les mêmes règles que le reste de l'application, calendrier
à rebours compris si l'on a donné l'heure du service. Le poids suit trois
voies : inscrit dans le champ prévu s'il est connu, lu sur l'étiquette sinon,
estimé à l'œil en dernier recours — en le disant, pour qu'on puisse le
corriger d'une réplique. Les dates de péremption ne sont ni lues ni
commentées. On peut ensuite **répliquer** sur la même photo (« et sans
four ? », « pour huit plutôt que quatre ? »).

Deux ponts avec la liste d'épicerie, permise par le domaine commun
(même `localStorage`) :

- le conseiller **reçoit la liste de la semaine** et l'équipement coché, et en
  tient compte dans ses substitutions ;
- le bouton **🛒 Manquants vers Mon Épicerie** verse les ingrédients absents
  directement dans la liste, où l'application d'à côté les assainit et les
  range à son prochain chargement.

### L'inventaire : cuisiner avec ce qu'on a

Le bouton **🧺 Inventaire** tient le registre du garde-manger, du frigidaire
et du congélateur. Chaque zone se nourrit d'une **photo d'ensemble** —
tablettes éclairées, étiquettes vers l'objectif — que le conseiller dépouille
en liste d'aliments ; la liste reste éditable à la main, un aliment par
ligne, et c'est elle (jamais la photo) qui accompagne ensuite chaque
consultation. Le conseiller compose d'abord avec ce stock, nomme ce qu'il y
puise, et ne verse dans les « manquants » que ce qui n'est ni en stock ni
déjà sur la liste d'épicerie. L'inventaire vit dans le navigateur
(localStorage) et ne se met pas à jour tout seul : on refait les photos après
une grosse épicerie, ou l'on retouche les lignes.

Cette analyse exige une **clé API personnelle** (bouton **🔑 Conseiller**, qui
explique comment l'obtenir sur console.anthropic.com). La clé reste dans le
navigateur ; le navigateur parle directement à `api.anthropic.com`, sans aucun
serveur intermédiaire, et chaque consultation coûte quelques sous, débités
chez Anthropic. Sans clé, tout le reste — le choix à la main, les vingt
pièces, le carnet — fonctionne hors ligne et gratuitement, comme avant.

### Organisation de `cuisine/`

```
cuisine/index.html              structure de la page
cuisine/assets/css/app.css      mise en forme (thèmes clair/sombre, impression)
cuisine/assets/js/pieces.js     la base de connaissances : pièces, températures, étapes
cuisine/assets/js/moteur.js     composition de la recette et calendrier à rebours
cuisine/assets/js/conseiller.js analyse de photo (API Claude), pont vers l'épicerie
cuisine/assets/js/app.js        branchement de l'interface, carnet, équipement
cuisine/sw.js                   cache hors-ligne (VERSION à incrémenter au déploiement)
outils/generer-icones-cuisine.mjs  régénère les icônes PNG
```

Pour ajouter une pièce, tout tient dans
[`cuisine/assets/js/pieces.js`](cuisine/assets/js/pieces.js) : une entrée dans
`PIECES` avec ses cuissons (température de retrait et cible), ses étapes et
ses textes. Contrairement à l'épicerie, ces fichiers n'utilisent pas de
modules : la page s'ouvre aussi par un double-clic sur `index.html`.

## Lac Péré — l'inventaire du domaine

**→ [Ouvrir l'application](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/lac-pere/)**

L'inventaire complet de ce que possède le domaine de pêche du Lac Péré :
l'épicerie et le matériel, du garde-manger au hangar à moteurs. Il répond à
une question précise, celle qu'on se pose tout l'hiver — **qu'est-ce qu'il
restait au moment de la fermeture ?**

Ce qu'il fait :

- **218 articles livrés d'avance**, classés en 16 rayons (épicerie sèche,
  congelé, literie, pêche et embarcations, carburants, premiers soins…) et
  répartis dans 13 emplacements du domaine.
- **Un décompte par article** — au clavier ou par les boutons − et +, avec un
  seuil d'alerte qui fait passer l'article en « à commander ».
- **Des quantités estimées assumées** : une case « estimée » distingue le
  compté à l'unité de l'évalué à l'œil, et le rapport le dit.
- **Une archive de fermeture** datée et signée, qui ne bouge plus. C'est la
  mémoire du domaine, saison après saison.
- **L'analyse de photo** : photographiez une armoire, Claude en dresse la
  liste avec les quantités (voir plus bas).
- **Un rapport imprimable** avec lignes de signature, un tableur `.csv` pour
  Excel, et une sauvegarde `.json` qui sert à passer le relais.

### Le geste de la fermeture

L'onglet **Fermeture** mène la tournée : chaque emplacement affiche son
avancement (`0 / 18`), et un contact ouvre la liste de ses seuls articles.
Quand tout est compté, un bouton fige l'ensemble dans une archive — titre,
date, nom du responsable, remarque. Les articles laissés vides en sont
exclus : une archive ne contient que du compté.

L'onglet **Archives** garde ces photographies du stock. On les consulte, on
les imprime, et on peut *recharger* l'une d'elles dans l'inventaire courant
pour repartir de l'état de l'automne dernier.

### Photographier plutôt que compter

L'onglet **📷 Analyse** confie les tablettes à Claude : on choisit
l'emplacement, on prend jusqu'à six photos — plusieurs angles de la même
tablette valent mieux qu'une seule vue —, et la liste revient article par
article, avec les quantités.

Ce qui gouverne cette page tient en une phrase : **une estimation ne doit
jamais passer pour un décompte**. Chaque ligne dit lequel des deux elle est, et
sur quoi elle se fonde (« trois sacs debout, un quatrième possible derrière »).
Ce qui est évalué à l'œil entre dans l'inventaire marqué *estimé*, et le reste
jusqu'à ce qu'on le corrige. Rien n'est écrit avant que vous n'ayez relu et
appliqué ; chaque quantité proposée reste modifiable dans la liste même.

Deux garde-fous du côté du code : le catalogue de l'emplacement est envoyé au
modèle pour qu'il reprenne les identifiants exacts plutôt que d'inventer des
noms, et toute proposition mal formée — quantité absurde, article sans nom,
rayon inconnu — est écartée avant de pouvoir toucher l'inventaire. Un article
inconnu du catalogue est proposé comme *nouvel article*, à accepter ou non.

**La clé.** Cette analyse est la seule partie de l'application qui parle à
l'extérieur. Elle s'adresse directement à `api.anthropic.com` depuis le
navigateur, avec une clé personnelle obtenue sur `console.anthropic.com` — pas
de serveur intermédiaire, pas de compte chez nous. La clé vit dans le
`localStorage` de l'appareil et s'efface d'un bouton. Comptez environ **5 à
10 ¢ par analyse** selon le nombre de photos ; le catalogue est mis en cache
d'un appel à l'autre, si bien que la deuxième armoire coûte moins que la
première. Sans clé, tout le reste de l'application fonctionne comme avant,
gratuitement et hors ligne.

### Partager avec ses employeurs

L'application n'a pas de serveur : chaque appareil garde ses propres données.
Le partage se fait par fichier, en trois gestes.

1. **Vous** — onglet *Partage* → **💾 Sauvegarder (.json)**, ou
   **📤 Envoyer à un collègue** sur téléphone, qui propose directement le
   courriel ou la messagerie.
2. **Eux** — ils ouvrent la même adresse web, puis onglet *Partage* →
   **📥 Ouvrir un fichier reçu**.
3. **Deux comptages à la fois** — l'application demande alors *fusionner* ou
   *remplacer*. **Fusionner** est le choix sûr : article par article, la
   saisie la plus récente gagne. Deux personnes peuvent compter chacune leur
   bâtiment et réunir les deux fichiers sans rien perdre.

C'est aussi pour cela que le bouton « Qui compte ? » demande un nom : chaque
quantité retient qui l'a saisie et quand, et c'est ce qui départage deux
versions.

### Installer sur un téléphone

- **iPhone / iPad** — ouvrir l'adresse dans Safari, bouton de partage, *Sur
  l'écran d'accueil*.
- **Android** — ouvrir l'adresse dans Chrome, menu ⋮, *Installer
  l'application*.

Une fois installée, elle fonctionne sans réseau : au domaine, c'est
l'essentiel.

### Modifier le stock livré

Comme pour l'épicerie, ajouter un article *pour tout le monde* tient dans un
seul fichier,
[`lac-pere/assets/js/catalogue.js`](lac-pere/assets/js/catalogue.js) :

```js
{ id: 'sec-riz-brun', nom: 'Riz brun', rayon: 'sec', zone: 'garde-manger',
  unite: 'sac', format: '8 kg', seuil: 1 },
```

L'`id` ne se réutilise jamais : c'est lui qui relie un article à son décompte
et à toutes les archives où il figure. Un article ajouté au catalogue apparaît
chez chacun au prochain chargement, **sans effacer aucune quantité déjà
saisie**. Depuis l'application elle-même, le bouton *＋ Ajouter un article*
fait la même chose pour un seul appareil.

### Organisation de `lac-pere/`

```
lac-pere/index.html               structure de la page
lac-pere/assets/css/app.css       mise en forme (thèmes clair/sombre, feuille imprimée)
lac-pere/assets/js/catalogue.js   données : emplacements, rayons, articles livrés
lac-pere/assets/js/etat.js        décomptes, archives, fusion des sauvegardes
lac-pere/assets/js/rendu.js       construction du DOM
lac-pere/assets/js/analyseur.js   analyse de photo (API Claude, clé personnelle)
lac-pere/assets/js/export.js      impression, tableur, sauvegarde, partage
lac-pere/assets/js/app.js         branchement de l'interface
lac-pere/assets/photos/           les photos du domaine, pour la présentation
lac-pere/sw.js                    cache hors-ligne (VERSION à incrémenter au déploiement)
outils/generer-icones-lac-pere.mjs  régénère les icônes PNG
```

Comme `cuisine/`, ces fichiers n'utilisent pas de modules : la page s'ouvre
aussi par un double-clic sur `index.html`.

## Développement

Aucune dépendance, aucune étape de compilation. Il suffit de servir le dossier :

```sh
python3 -m http.server 8000
# puis http://localhost:8000
```

Ouvrir `index.html` directement par un double-clic ne fonctionne pas : les
modules JavaScript exigent le protocole `http(s)`.

### Organisation

```
index.html              structure, jeu d'icônes SVG intégré
assets/css/app.css      toute la mise en forme (thèmes clair/sombre, impression)
assets/js/catalogue.js  données : rayons, enseignes, produits
assets/js/etat.js       état, persistance, fusion du catalogue
assets/js/rendu.js      construction du DOM
assets/js/export.js     impression, presse-papiers, sauvegarde/restauration
assets/js/app.js        branchement de l'interface
sw.js                   mise en cache pour le hors-ligne
outils/generer-icones.mjs  régénère les icônes PNG (node outils/generer-icones.mjs)
```

### Après un déploiement

Incrémenter `VERSION` dans le `sw.js` de l'application touchée —
[`sw.js`](sw.js), [`cuisine/sw.js`](cuisine/sw.js) ou
[`lac-pere/sw.js`](lac-pere/sw.js) —, sinon les navigateurs qui ont déjà visité
le site continueront de servir les anciens fichiers depuis leur cache.

## Publication

Le site est publié par GitHub Pages depuis la branche `main`. Le fichier
`.nojekyll` désactive le traitement Jekyll, inutile ici.
