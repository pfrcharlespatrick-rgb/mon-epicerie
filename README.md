# Mon Épicerie

Liste de courses hebdomadaire pour la région de Québec : un catalogue de
163 produits habituels, des quantités, des enseignes, l'impression et la
sauvegarde. Et, par la marmite en haut de la liste, **Ma Cuisine** : le
conseiller culinaire qui mène ce qu'on rapporte du marché jusqu'à la table,
piloté à la température à cœur. Le tout fonctionne hors ligne et sans compte.

**→ [Ouvrir l'application](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/)**

**→ [Ouvrir Ma Cuisine](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/cuisine/)** —
voir [sa section](#ma-cuisine--le-conseiller-culinaire) plus bas.

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
aucune requête vers l'extérieur — à une exception près, choisie et expliquée :
l'analyse de photo de Ma Cuisine, qui parle directement à l'API d'Anthropic
avec votre propre clé. Corollaire : vider les données du navigateur
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
recettes composées (localStorage, comme la liste d'épicerie), et l'impression
sort une feuille de cuisine épurée.

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

Incrémenter `VERSION` dans [`sw.js`](sw.js), sinon les navigateurs qui ont déjà
visité le site continueront de servir les anciens fichiers depuis leur cache.

## Publication

Le site est publié par GitHub Pages depuis la branche `main`. Le fichier
`.nojekyll` désactive le traitement Jekyll, inutile ici.
