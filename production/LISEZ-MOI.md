# Kit de production — de la capsule à la vraie vidéo

Les capsules de La Brigade sont **générées dans le navigateur** : scènes
dessinées en code, narration par la voix de synthèse de l'appareil, quantités
recalculées pour chaque tablée. C'est ce qui les rend uniques — aucune vidéo
enregistrée ne peut dire « vos 600 g de riz ».

Il reste utile d'avoir de **vraies vidéos** : pour la publicité, les réseaux
sociaux, une bande-annonce sur la page d'accueil, ou une version « premium »
d'une leçon. Ce dossier contient tout ce qu'il faut pour les produire **avec
les personnages de la Brigade** — jamais avec le visage d'une personne réelle.

## Ce qu'il y a ici

| Fichier | À quoi il sert |
|---|---|
| `personnages.md` | La bible des cinq chefs : apparence exacte, tenue, voix, manière de parler. À donner tel quel à un illustrateur, à un comédien de doublage, ou à un outil de génération |
| `consignes-generation.md` | Les consignes (« prompts ») prêtes à coller dans les outils d'image et de vidéo, et la méthode pour garder un personnage identique d'une image à l'autre |
| `scenarios/` | Un scénario de tournage par leçon, généré à partir des données du site : plan par plan, avec la narration, l'illustration, la durée, la minuterie. Se régénère avec `node outils/exporter-scenarios.mjs` |
| `videos/` | Les capsules enregistrées en vidéo par `node outils/enregistrer-capsule.mjs <id>` (dossier vide dans le dépôt : les vidéos ne sont pas versionnées) |

## Trois façons de faire une vidéo

### 1. Enregistrer la capsule telle qu'elle est (gratuit, dix minutes)

La capsule est déjà une vidéo : il suffit de la filmer.

- **Sur votre ordinateur** : ouvrez la capsule en plein écran, coupez la
  voix si vous voulez enregistrer la vôtre par-dessus, et lancez
  l'enregistreur d'écran (Windows : `Win + G` ; Mac : `Cmd + Shift + 5`).
  Vous obtenez un fichier vidéo à publier tel quel.
- **En automatique** : `node outils/enregistrer-capsule.mjs saisir-sans-coller`
  produit `production/videos/saisir-sans-coller.webm` sans que vous touchiez
  à rien. Le fichier est muet : ajoutez la narration avec un outil de voix
  (voir plus bas) ou enregistrez-la vous-même en lisant le scénario.

### 2. Faire jouer le chef par un avatar animé (payant, une soirée)

Des services comme HeyGen, Synthesia ou D-ID animent un personnage à partir
d'une image et d'un texte. La méthode :

1. Générez le **portrait de référence** du chef avec la consigne de
   `consignes-generation.md` (ou exportez le portrait SVG du site, qui est
   libre de droits puisque vous le possédez).
2. Créez un **avatar personnalisé** à partir de cette image dans le service.
   Ne choisissez jamais un avatar « ressemblant à » une vraie personne.
3. Collez la narration du scénario, étape par étape, et choisissez une
   **voix de synthèse française** (fr-CA quand elle existe) qui correspond à
   la fiche du personnage.
4. Montez les plans avec les illustrations des scènes ou vos propres images
   de cuisine.

### 3. Tourner pour vrai (le plus fort, le plus long)

Un comédien ou vous-même à l'écran, le scénario comme guide, et les chefs de
la Brigade **comme voix hors champ** ou comme mascottes animées à l'écran.
C'est la formule des grandes écoles en ligne : des mains qui cuisinent, une
voix qui explique.

## La règle qui ne se discute pas

Aucune vedette, aucune personne réelle — pas son visage, pas son nom, pas sa
voix, pas « dans le style de ». C'est illégal sans accord écrit (droit à
l'image, Code civil du Québec art. 35-36 ; droits de la personnalité
ailleurs), c'est trompeur pour le client, et les plateformes retirent ces
contenus. Les cinq chefs de la Brigade existent précisément pour ça : ils
sont à vous, ils ne vieillissent pas, ils ne demandent pas de cachet, et
personne d'autre ne les a.
