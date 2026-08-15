# Mon Épicerie

Liste de courses hebdomadaire pour la région de Québec : un catalogue de
163 produits habituels, des quantités, des enseignes, l'impression et la
sauvegarde — le tout dans une page qui fonctionne hors ligne et sans compte.

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

## Vos données

Tout est stocké dans le navigateur (`localStorage`), sur votre appareil.
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
```

### Après un déploiement

Incrémenter `VERSION` dans [`sw.js`](sw.js), sinon les navigateurs qui ont déjà
visité le site continueront de servir les anciens fichiers depuis leur cache.

## Publication

Le site est publié par GitHub Pages depuis la branche `main`. Le fichier
`.nojekyll` désactive le traitement Jekyll, inutile ici.
