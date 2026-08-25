# Mon Épicerie

Liste de courses hebdomadaire pour la région de Québec : un catalogue de
163 produits habituels, des quantités, des enseignes, l'impression et la
sauvegarde. Et, depuis peu, **Ma Cuisine** : les fiches de cuisson de ce qu'on
rapporte du marché, pilotées à la température à cœur. Le tout dans deux pages
qui fonctionnent hors ligne et sans compte.

**→ [Ouvrir l'application](https://pfrcharlespatrick-rgb.github.io/mon-epicerie/)**

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

## Ma Cuisine

Une seconde page, accessible par l'icône de marmite en haut de la liste :
[`cuisine.html`](cuisine.html). Elle sert à cuisiner ce qu'on vient d'acheter.

Chaque recette y est écrite pour **14 convives** et pilotée par la **température
à cœur**, en **degrés Fahrenheit** — l'équivalent Celsius est donné à côté — parce
qu'un four au gaz ne suit pas son thermostat et qu'une horloge ne dit rien de ce
qui se passe dans la viande.

| Onglet | Ce qu'on y trouve |
|---|---|
| Le menu | Le plat principal, ses entrées et ses accompagnements proposés, avec la raison de chaque accord. On retient ce qu'on veut ; le reste de l'application suit |
| La recette | Chapeau, avertissements de salubrité, chiffres à viser, ingrédients, étapes numérotées avec durée, pièges et signes de réussite |
| Calendrier à rebours | Tous les plats du menu sur **une seule** ligne du temps, chaque geste ramené à son heure réelle |
| Garde-manger & frigo | Photos des tablettes, du frigo, du congélateur et des étiquettes de viande, avec une note par photo |
| Mes notes | Le carnet de bord d'une fois à l'autre |

Quatre détails valent la peine d'être connus :

- **Un menu, pas une recette.** Pris un par un, six plats sont six recettes
  faciles ; pris ensemble, ce sont six plats qui se disputent un four et une paire
  de mains. Mettre un plat au menu le fait entrer dans la ligne du temps et dans la
  liste d'épicerie, à sa place.
- **Le nombre de convives met tout à l'échelle.** Les quantités se recalculent et
  s'arrondissent à quelque chose de mesurable — personne ne pèse 43,7 g de paprika.
- **Chaque étape courte porte un minuteur.** Il sonne, même si l'on a changé
  d'onglet entretemps.
- **Deux impressions.** *Imprimer le menu* sort toutes les recettes retenues, une
  par page, plus le calendrier commun et les photos ; le bouton des réglages
  n'imprime que la recette ouverte. C'est la feuille qu'on colle sur la porte de
  l'armoire.

### Ajouter ou corriger une recette

Tout le contenu tient dans [`assets/js/recettes.js`](assets/js/recettes.js), en
clair. Le modèle est documenté en tête de fichier ; l'essentiel :

Une recette porte un `type` — `'principal'`, `'entree'` ou `'accompagnement'` —
et un plat principal porte ses accords, avec la raison de chacun :

```js
suggestions: [
  { id: 'salade-chou-cremeuse', pourquoi: 'Pourquoi ça va ensemble.' },
],
```

Le champ `pourquoi` appartient au couple, pas à l'un des deux plats : le même
accompagnement peut se justifier autrement à côté d'un autre plat principal.

```js
etapes: [
  {
    titre: 'Le salage à sec',
    duree: '12 à 24 h au frigo',   // un minuteur apparaît si c'est ≤ 6 h
    temperature: 275,              // en °F ; le °C est calculé
    texte: 'Ce qu’on fait, et pourquoi.',
    piege: 'L’endroit précis où l’on peut tout gâcher.',
    reussite: 'À quoi se reconnaît le succès, au toucher ou à l’œil.',
  },
],
rebours: [
  { avant: 1200, texte: 'Saler à sec.' },        // minutes avant le service
  { avant: 240, texte: 'Enfourner.', four: 275 }, // `four` s'affiche dans la ligne du temps
],
```

C'est `avant` qui fait tout le travail du calendrier commun : les gestes de tous
les plats retenus sont versés dans la même liste et triés. Écrire une recette,
c'est donc surtout décider à quel moment chacun de ses gestes tombe par rapport
au service — et vérifier, ce faisant, qu'on ne demande pas deux températures de
four différentes au même moment.

Les quantités s'écrivent pour le nombre indiqué dans `portions` ; l'application
se charge du reste. Corriger une recette n'efface jamais les cases cochées, les
notes ni les photos de l'utilisateur.

## Vos données

Tout est stocké dans le navigateur — `localStorage` pour les listes et les
réglages, IndexedDB pour les photos de la cuisine —, sur votre appareil.
L'application n'a pas de serveur, pas de compte, pas de traceur, et n'envoie
aucune requête vers l'extérieur. Corollaire : vider les données du navigateur
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

cuisine.html            la page des recettes
assets/css/cuisine.css  sa mise en forme, thèmes et impression compris
assets/js/recettes.js   données : les recettes livrées
assets/js/cuisine.js    échelle, calendrier à rebours, minuteries, photos
```

Les photos du garde-manger vivent dans IndexedDB (`mon-epicerie-cuisine`) plutôt
que dans `localStorage` : une image dépasse largement ce que ce dernier tolère.
Elles sont réduites à 1400 px et compressées en JPEG à l'ajout — une photo de
téléphone de 3,5 Mo tombe autour de 250 ko.

### Après un déploiement

Incrémenter `VERSION` dans [`sw.js`](sw.js), sinon les navigateurs qui ont déjà
visité le site continueront de servir les anciens fichiers depuis leur cache.

## Publication

Le site est publié par GitHub Pages depuis la branche `main`. Le fichier
`.nojekyll` désactive le traitement Jekyll, inutile ici.
