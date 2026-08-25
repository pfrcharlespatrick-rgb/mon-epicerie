/**
 * Les recettes livrées avec l'application.
 *
 * Le principe est le même que pour `catalogue.js` : tout le contenu tient ici,
 * en clair, sans base de données ni serveur. Ce que l'utilisateur ajoute —
 * ses notes, ses cases cochées, ses photos, son heure de service — vit à côté,
 * dans le navigateur, et n'est jamais écrasé quand une recette est corrigée.
 *
 * Le modèle d'une recette
 * -----------------------
 *   portions      nombre de convives pour lequel les quantités sont écrites.
 *                 L'application met tout à l'échelle à partir de ce nombre.
 *   temperatures  l'aide-mémoire des chiffres à viser, en °F d'abord.
 *   ingredients   groupés par moment de la préparation. Une quantité `q` nulle
 *                 signifie « au jugé » : le texte parle tout seul.
 *   etapes        numérotées, titrées, avec une durée quand il y a lieu
 *                 d'attendre, et deux champs qui font le métier :
 *                   piege    — l'endroit précis où l'on peut tout gâcher
 *                   reussite — à quoi se reconnaît le succès
 *   rebours       le calendrier à rebours. `avant` est un nombre de minutes
 *                 avant l'heure du service ; l'application en déduit l'heure
 *                 réelle de chaque geste.
 */

/** Convertit des degrés Fahrenheit en Celsius, arrondis au degré. */
export const enCelsius = (f) => Math.round(((f - 32) * 5) / 9);

export const RECETTES = [
  {
    id: 'cotes-levees-dos-four-gaz',
    titre: 'Côtes levées de dos au four au gaz',
    sousTitre: 'Salage à sec la veille, cuisson lente, glaçage à l’érable',
    piece: 'Côtes levées de dos de porc — 5,15 kg (deux emballages)',
    portions: 14,
    duree: 'Trois jours en tout, dont 4 h le jour même',
    difficulte: 'Facile — il faut surtout de la patience et un thermomètre',
    resume:
      'Les côtes levées de dos ne se cuisent pas à l’horloge : elles se cuisent à la ' +
      'température à cœur. Le porc est sain à 145 °F, mais une côte levée servie à ' +
      '145 °F est du caoutchouc. Ce qui rend une côte fondante, ce n’est pas la ' +
      'cuisson de la chair, c’est la fonte du collagène — ce tissu nacré qui tient ' +
      'la viande aux os et qui ne se transforme en gélatine qu’au-dessus de 195 °F, ' +
      'lentement. Toute la recette tient dans cette phrase : on monte doucement ' +
      'jusqu’à 198 °F, et on ne met le sucre qu’à la toute fin, parce qu’il brûle.',

    avertissements: [
      {
        titre: 'La date sur vos étiquettes',
        texte:
          'Emballé le 4 mai 2026, meilleur avant le 1er juin 2026. Si les emballages ' +
          'sont allés au congélateur avant cette date et y sont restés, la viande est ' +
          'saine : le froid arrête la multiplication bactérienne. Si elle a dormi au ' +
          'réfrigérateur depuis le printemps, ou si elle a dégelé puis regelé — grande ' +
          'plaque de glace au fond du sac, jus figé en flaque, viande affaissée —, on ' +
          'jette. On ne goûte pas pour vérifier.',
      },
      {
        titre: 'Ce qu’on regarde après la décongélation',
        texte:
          'La chair doit être rose pâle, ferme et sèche au doigt. Une odeur aigre, ' +
          'ammoniaquée ou franchement sure, une surface collante ou visqueuse, des ' +
          'reflets verdâtres ou gris : on jette, sans exception. Les plaques blanches ' +
          'et sèches, en revanche, ne sont que de la brûlure de congélation — c’est ' +
          'laid, ça sèche un peu la viande, ce n’est pas dangereux.',
      },
      {
        titre: 'La décongélation se fait au frigo, jamais sur le comptoir',
        texte:
          'Entre 40 et 140 °F, les bactéries doublent toutes les vingt minutes. Une ' +
          'pièce de 2,5 kg laissée sur le comptoir passe des heures dans cette zone ' +
          'avant que le cœur soit dégelé. Au frigo, sur une plaque à rebord pour ' +
          'retenir le jus, et rien qui traîne en dessous.',
      },
    ],

    temperatures: [
      { quoi: 'Cœur des côtes — la cible', f: 198, note: 'La fenêtre utile va de 195 à 203 °F' },
      { quoi: 'Sécurité sanitaire du porc', f: 145, note: 'Atteinte bien avant : ce n’est pas le repère de cuisson ici' },
      { quoi: 'Four — cuisson lente', f: 275, note: 'Grille au centre et au tiers inférieur' },
      { quoi: 'Four — glaçage final', f: 425, note: 'Court, surveillé, jamais plus de 15 minutes' },
      { quoi: 'Réfrigérateur', f: 39, note: 'Au-dessus de 40 °F, la zone de danger commence' },
    ],

    ingredients: [
      {
        groupe: 'La pièce',
        items: [
          {
            q: 5150,
            u: 'g',
            nom: 'Côtes levées de dos de porc',
            note:
              'Vos deux emballages, 2,516 kg et 2,632 kg. Comptez le nombre de carrés ' +
              'à l’ouverture : les emballages de cette taille en contiennent souvent ' +
              'trois chacun, ce qui vous ferait six carrés, soit quatre à cinq os par ' +
              'personne. C’est la bonne mesure pour un plat principal.',
          },
        ],
      },
      {
        groupe: 'Le salage à sec — la veille',
        items: [
          {
            q: 55,
            u: 'g',
            nom: 'Gros sel casher',
            note: 'Environ 60 ml, soit 4 c. à soupe bien pleines',
            substitution: 'À défaut, 45 g de sel de table fin — pesez-le, ne le mesurez pas à la cuillère',
          },
        ],
      },
      {
        groupe: 'La frotte sèche — le jour même',
        items: [
          { q: 120, u: 'g', nom: 'Cassonade', substitution: 'Sucre blanc + 15 ml de mélasse' },
          { q: 40, u: 'g', nom: 'Paprika', note: 'Fumé de préférence, doux sinon' },
          { q: 20, u: 'g', nom: 'Poudre d’ail' },
          { q: 20, u: 'g', nom: 'Poudre d’oignon', substitution: 'Doublez la poudre d’ail si vous n’en avez pas' },
          { q: 12, u: 'g', nom: 'Poivre noir fraîchement moulu' },
          { q: 8, u: 'g', nom: 'Moutarde sèche', substitution: '30 ml de moutarde de Dijon étendue sur la viande avant la frotte' },
          { q: 3, u: 'g', nom: 'Piment de Cayenne', note: 'Facultatif — 3 g se sent, ne brûle pas' },
        ],
      },
      {
        groupe: 'La sauce et le glaçage',
        items: [
          { q: 250, u: 'ml', nom: 'Sucs de cuisson dégraissés', note: 'Ce que les plaques auront rendu — ne les jetez jamais' },
          { q: 400, u: 'ml', nom: 'Ketchup' },
          { q: 200, u: 'ml', nom: 'Sirop d’érable', substitution: '160 g de cassonade délayée dans 60 ml d’eau' },
          { q: 100, u: 'ml', nom: 'Vinaigre de cidre', substitution: 'Vinaigre blanc coupé de jus de pomme, moitié-moitié' },
          { q: 60, u: 'ml', nom: 'Moutarde de Dijon' },
          { q: 45, u: 'ml', nom: 'Sauce Worcestershire', substitution: 'Sauce soya + quelques gouttes de vinaigre' },
          { q: 30, u: 'ml', nom: 'Sauce soya' },
          { q: 125, u: 'ml', nom: 'Bière', note: 'La Budweiser Zero de votre photo fait très bien l’affaire — on ne cherche pas l’alcool, on cherche le malt' },
          { q: 5, u: 'ml', nom: 'Fumée liquide', note: 'Facultatif, et une cuillère de trop ruine tout' },
        ],
      },
    ],

    materiel: [
      'Un thermomètre à lecture instantanée — c’est le seul outil dont dépend la réussite',
      'Deux plaques à rebord avec grilles, ou des plaques garnies de papier d’aluminium froissé',
      'Un couteau à désosser ou un petit couteau d’office, et un papier essuie-tout sec',
      'Un pinceau à badigeonner en silicone',
      'Une louche ou une cuillère large pour dégraisser les sucs',
    ],

    etapes: [
      {
        titre: 'Sortir du congélateur',
        duree: '36 à 48 h au frigo',
        texte:
          'Deux jours avant le repas, descendez les deux emballages du congélateur au ' +
          'réfrigérateur, posés sur une plaque à rebord, sur la tablette du bas. La ' +
          'tablette du bas n’est pas un détail de rangement : si le sac coule, rien de ' +
          'ce qui est en dessous n’est contaminé. Comptez 36 à 48 heures pour une pièce ' +
          'de 2,5 kg. Une pièce encore glacée au cœur le jour du repas est un désastre ' +
          'de calendrier, jamais un désastre de cuisine : on ne rattrape pas ça au four.',
        piege: 'Décongeler sur le comptoir, ou au micro-ondes. Le premier vous rend malade, le second cuit les bouts.',
        reussite: 'La viande plie sans craquer, et le doigt s’enfonce légèrement dans la chair entre deux os.',
      },
      {
        titre: 'Retirer la membrane',
        duree: '15 min',
        texte:
          'Posez un carré côté os vers le haut. Vous verrez une pellicule nacrée, ' +
          'presque translucide, tendue sur les os : c’est la membrane, et elle ne fond ' +
          'jamais. Glissez la pointe d’un couteau sous cette pellicule à l’extrémité ' +
          'd’un os pour la décoller sur deux centimètres, saisissez-la avec un essuie-' +
          'tout sec — sans le papier, ça glisse et vous vous acharnez pour rien — et ' +
          'tirez d’un trait, en diagonale, vers l’autre bout. Elle vient d’une seule ' +
          'pièce quand on a de la chance, en trois morceaux quand on en a moins. Faites ' +
          'les six carrés. Parez ensuite les gros paquets de gras mou, mais laissez la ' +
          'fine couche : elle fond et arrose la viande.',
        piege:
          'Sauter cette étape. C’est la faute la plus courante et la plus punie : la ' +
          'membrane reste caoutchouteuse sous la dent, et elle empêche le sel et la ' +
          'fumée d’entrer par le dessous.',
        reussite: 'Le dos des os est mat, un peu rugueux au doigt, plus du tout luisant.',
      },
      {
        titre: 'Le salage à sec',
        duree: '12 à 24 h au frigo',
        texte:
          'Épongez les carrés, puis saupoudrez le gros sel sur les deux faces, de haut, ' +
          'comme on sale un trottoir — la hauteur répartit, la main appuyée fait des ' +
          'paquets. Rien d’autre que du sel à ce stade. Posez les carrés sur des grilles, ' +
          'à découvert, au réfrigérateur, pour la nuit. Ce qui se passe pendant ces ' +
          'heures mérite d’être compris : le sel tire d’abord l’eau de surface, puis ' +
          'cette saumure est réabsorbée en profondeur et dénature les protéines de ' +
          'façon à ce qu’elles retiennent leur eau à la cuisson. Une pièce salée la ' +
          'veille perd nettement moins de jus qu’une pièce salée à la dernière minute, ' +
          'et elle est assaisonnée jusqu’au centre au lieu de l’être seulement en croûte. ' +
          'À découvert, en prime, la surface sèche, et une surface sèche brunit.',
        piege:
          'Mettre le sucre maintenant. Une nuit entière au contact du sucre puis trois ' +
          'heures de four, et la croûte tourne à l’amer avant même le glaçage.',
        reussite: 'Le lendemain, la surface est sèche au toucher, un peu collante, d’un rose plus soutenu et plus translucide.',
      },
      {
        titre: 'Tempérer et frotter',
        duree: '1 h hors du frigo',
        texte:
          'Sortez les carrés une heure avant le four. Mélangez la cassonade, le paprika, ' +
          'les poudres d’ail et d’oignon, le poivre, la moutarde sèche et le cayenne dans ' +
          'un bol. Ne resalez pas : le sel de la veille est déjà dans la viande, et il ne ' +
          's’est pas évaporé. Frottez généreusement les deux faces, la face osseuse un peu ' +
          'moins que la face charnue, et pressez pour faire adhérer. La surface humide de ' +
          'la veille sert de colle ; si elle est trop sèche, un voile de moutarde de Dijon ' +
          'passé au pinceau règle le problème et ne se goûtera pas après trois heures.',
        piege: 'Frotter des carrés encore mouillés : la frotte se délave et coule sur la plaque.',
        reussite: 'La frotte tient sans tomber quand on soulève le carré, et prend un aspect de pâte brune humide au bout de vingt minutes.',
      },
      {
        titre: 'Préchauffer et monter les plaques',
        duree: '20 min',
        temperature: 275,
        texte:
          'Chauffez le four à 275 °F, grilles placées au centre et au tiers inférieur. ' +
          'Votre four au gaz mérite une précaution particulière : il chauffe par le bas ' +
          'et par bouffées, ce qui donne un fond nettement plus chaud que le haut, et une ' +
          'chaleur plus humide qu’un four électrique — ce qui, pour des côtes levées, est ' +
          'plutôt un cadeau. Répartissez les carrés sur des grilles posées sur des plaques ' +
          'à rebord, os vers le bas, sans qu’ils se touchent. Si vous n’avez pas de grilles, ' +
          'faites des boudins de papier d’aluminium froissé et couchez les carrés dessus : ' +
          'ce qu’on cherche, c’est que l’air passe dessous et que le jus tombe dans la plaque ' +
          'plutôt que de mijoter la viande.',
        piege: 'Empiler ou serrer les carrés : les faces qui se touchent cuisent à la vapeur et restent pâles et molles.',
        reussite: 'On doit pouvoir glisser deux doigts entre deux carrés.',
      },
      {
        titre: 'La cuisson lente',
        duree: '2 h 30 à 3 h 30',
        temperature: 275,
        texte:
          'Enfournez et laissez travailler. À mi-cuisson, environ une heure et demie ' +
          'après le départ, tournez les plaques d’un demi-tour et intervertissez-les de ' +
          'niveau : c’est ce geste, et lui seul, qui corrige l’inégalité du four au gaz. ' +
          'Ne badigeonnez rien, n’ouvrez pas la porte pour le plaisir : chaque ouverture ' +
          'coûte une dizaine de minutes de remontée en température. Pendant ce temps, la ' +
          'graisse fond, l’eau s’évapore lentement, et le collagène commence sa ' +
          'transformation vers 160 °F — la température à cœur va d’ailleurs sembler ' +
          'bloquée un long moment autour de 160 à 170 °F. Ce plateau est normal, c’est ' +
          'l’évaporation qui refroidit la surface. On ne monte pas le four pour le forcer.',
        piege:
          'Monter la température parce que « ça n’avance plus ». Vous obtiendrez une ' +
          'viande sèche à l’extérieur et encore coriace au centre.',
        reussite: 'La cuisine sent le porc rôti et le paprika, la plaque commence à se garnir de sucs bruns, la viande se rétracte du bout des os.',
      },
      {
        titre: 'Vérifier à cœur et par le test de flexion',
        duree: '10 min',
        temperature: 198,
        texte:
          'Piquez le thermomètre dans la partie la plus charnue, entre deux os, à ' +
          'l’horizontale, sans toucher l’os — un os conduit la chaleur et vous mentira ' +
          'de dix degrés. La cible est 198 °F ; la fenêtre acceptable va de 195 à 203 °F. ' +
          'Vérifiez deux carrés différents, dont un de chaque grille. Doublez cette ' +
          'lecture par le test de flexion, qui ne trompe pas : saisissez un carré au ' +
          'tiers avec des pinces et soulevez. S’il reste droit comme une planche, il est ' +
          'en retard. S’il plie franchement et que la surface se fend entre les os, il ' +
          'est prêt. S’il menace de se casser en deux, il est allé un peu loin — ce sera ' +
          'très bon quand même, simplement plus difficile à trancher proprement.',
        piege: 'Se fier à l’horloge. Six carrés dans un four domestique ne cuisent pas comme deux, et aucun four au gaz n’est d’accord avec son thermostat.',
        reussite: 'Un cure-dent entre deux os s’enfonce sans résistance, comme dans du beurre mou. Les os dépassent de 5 à 10 mm.',
      },
      {
        titre: 'Le glaçage',
        duree: '10 à 15 min',
        temperature: 425,
        texte:
          'Prélevez environ le tiers de la sauce dans un bol à part, pour badigeonner — ' +
          'on ne retrempe jamais le pinceau qui a touché la viande dans le pot destiné à ' +
          'la table. Montez le four à 425 °F. Badigeonnez la face charnue d’une couche ' +
          'mince, remettez au four cinq minutes, ressortez, remettez une couche, cinq ' +
          'minutes encore, et une troisième si le cœur vous en dit. Trois couches minces ' +
          'donnent un vernis brillant et collant ; une seule couche épaisse donne une ' +
          'flaque qui coule et brûle. Restez devant le four, littéralement : c’est le ' +
          'seul moment de la recette où quatre-vingt-dix secondes d’inattention coûtent ' +
          'le repas.',
        piege:
          'Le sucre passe du caramel à l’amer sans prévenir. Dès que l’odeur tourne au ' +
          'brûlé sec plutôt qu’au caramel, sortez tout, même si ce n’est pas assez foncé ' +
          'à votre goût.',
        reussite: 'La sauce ne coule plus quand on incline le carré ; elle fait des cloques luisantes et sent le caramel et le vinaigre.',
      },
      {
        titre: 'Le repos',
        duree: '20 min',
        texte:
          'Sortez les carrés sur une planche et couvrez-les d’une feuille de papier ' +
          'd’aluminium simplement posée dessus, sans serrer les bords. Vingt minutes. ' +
          'Pendant ce repos, les fibres, contractées par la chaleur, se détendent et ' +
          'reprennent le jus qu’elles avaient chassé vers le centre ; trancher tout de ' +
          'suite le laisserait couler sur la planche. Une côte levée qui repose perd ' +
          'aussi assez de chaleur pour être mangeable sans se brûler, ce qui n’est pas ' +
          'rien quand on sert quatorze personnes.',
        piege: 'Emballer hermétiquement dans l’aluminium. La vapeur emprisonnée ramollit en dix minutes le vernis que vous venez de faire.',
        reussite: 'La planche reste presque sèche sous les carrés.',
      },
      {
        titre: 'La sauce à partir des sucs',
        duree: '15 min, pendant le repos',
        texte:
          'Voilà le trésor que la plupart des gens jettent avec le papier d’aluminium. ' +
          'Versez le contenu des deux plaques dans un grand bol ou un pot à mesurer et ' +
          'laissez reposer deux minutes : le gras clair monte, les sucs foncés restent ' +
          'au fond. Écumez le gras à la louche et gardez-le au frigo pour vos patates ' +
          'rôties — il vaut de l’or. S’il reste du fond caramélisé collé aux plaques, ' +
          'posez-les sur un rond à feu moyen, versez la bière et grattez à la spatule de ' +
          'bois jusqu’à ce que tout se décolle. Réunissez ces sucs dégraissés, le liquide ' +
          'de déglaçage, le ketchup, le sirop d’érable, le vinaigre de cidre, la moutarde, ' +
          'la Worcestershire et la sauce soya dans une casserole. Laissez frémir dix ' +
          'minutes à découvert, en remuant de temps à autre, jusqu’à ce que la sauce nappe ' +
          'le dos d’une cuillère. Goûtez : si c’est plat, un trait de vinaigre ; si c’est ' +
          'trop vif, une cuillère de sirop.',
        piege: 'Saler la sauce sans goûter. Les sucs sont déjà salés par la salaison de la veille, et la soya en rajoute.',
        reussite: 'Un trait tracé au doigt dans la sauce sur le dos de la cuillère tient quelques secondes avant de se refermer.',
      },
      {
        titre: 'Trancher et servir',
        duree: '10 min',
        texte:
          'Retournez chaque carré os vers le haut : les os dessinent eux-mêmes les lignes ' +
          'de coupe, ce qu’on ne voit plus du tout par la face charnue. Tranchez entre les ' +
          'os avec un couteau long, d’un seul mouvement tiré, sans scier. Pour quatorze ' +
          'personnes, présentez en portions de quatre à cinq os plutôt qu’en carrés ' +
          'entiers : la table se sert mieux, et il en reste toujours pour ceux qui en ' +
          'reprennent. La sauce réservée passe en saucière, chaude.',
        piege: 'Trancher par la face charnue, à l’aveugle : une côte sur deux se retrouve sans viande et sa voisine avec le double.',
        reussite: 'La coupe est franche, la chair reste sur l’os, et l’anneau rosé sous la croûte n’est pas du saignant — c’est la réaction normale d’une longue cuisson douce.',
      },
    ],

    methodesInferieures: [
      {
        titre: 'Faire bouillir les côtes avant de les passer au four',
        texte:
          'C’est la méthode de nos mères, et elle attendrit vraiment. Le compromis est ' +
          'simplement mauvais : tout ce qui donne du goût — la gélatine, le gras fondu, ' +
          'les sucs — part dans l’eau, qu’on vide ensuite dans l’évier. On obtient une ' +
          'viande tendre et fade qu’il faut ensuite sauver à la sauce. Le four lent fait ' +
          'exactement le même travail sur le collagène, mais en gardant tout dedans. Si ' +
          'vous tenez à bouillir un jour, faute de temps, gardez au moins le bouillon : ' +
          'dégraissé et réduit, il devient une base de sauce remarquable.',
      },
      {
        titre: 'La méthode « 3-2-1 »',
        texte:
          'Trois heures à découvert, deux heures emballé avec du liquide, une heure ' +
          'glacée : c’est un excellent programme pour de grosses côtes de flanc au fumoir. ' +
          'Appliquée à des côtes de dos, nettement plus maigres et plus minces, elle donne ' +
          'une viande qui se défait en charpie, sans tenue, et l’emballage humide dissout ' +
          'la croûte qu’on a mis trois heures à construire. Si vous voulez emballer pour ' +
          'gagner du temps, une heure suffit, et il faut ensuite rouvrir et sécher.',
      },
      {
        titre: 'La viande « qui tombe de l’os »',
        texte:
          'Beaucoup la réclament, et c’est une affaire de goût, pas d’erreur. Sachez ' +
          'seulement ce que vous échangez : au-delà de 205 °F, les fibres n’ont plus de ' +
          'tenue, la tranche s’effondre à la fourchette et le service devient salissant. ' +
          'À 198 °F, la chair se détache d’un coup de dent propre en laissant l’os net. ' +
          'C’est ce que je vise ici. Si votre tablée préfère l’autre texture, poussez ' +
          'jusqu’à 205 °F et emballez vingt minutes.',
      },
    ],

    conservation:
      'Les côtes cuites se gardent quatre jours au réfrigérateur, dans un contenant ' +
      'fermé, et trois mois au congélateur. Refroidissez-les vite : en morceaux, à ' +
      'découvert, moins de deux heures sur le comptoir, puis au froid. Pour réchauffer ' +
      'sans les dessécher, comptez 20 à 25 minutes à 300 °F, emballées dans du papier ' +
      'd’aluminium avec deux cuillères d’eau ou de sauce, puis rouvrez et passez trois ' +
      'minutes sous le gril pour retrouver le vernis. Le micro-ondes fonctionne pour une ' +
      'portion pressée, à puissance moyenne et à couvert, mais il rend la chair spongieuse. ' +
      'La sauce, elle, se garde deux semaines au frigo et s’améliore les premiers jours.',

    accompagnement:
      'Une salade de chou crémeuse préparée la veille — l’acidité et le froid sont ce ' +
      'qui empêche un plat aussi riche de lasser à la moitié de l’assiette. À côté, des ' +
      'grelots rôtis dans le gras de porc que vous avez écumé, du blé d’Inde en épis si ' +
      'la saison le permet, et un pain de maïs pour saucer. Pour quatorze personnes, ' +
      'prévoyez 2,5 kg de grelots et un grand saladier de chou : les gens en reprennent ' +
      'toujours plus qu’on ne le croit. À boire, une bière blonde bien froide fait mieux ' +
      'que n’importe quel vin sur ce plat ; les Heineken et les Budweiser Zero de votre ' +
      'photo sont exactement dans le ton, et l’eau pétillante nettoie le palais entre ' +
      'deux bouchées.',

    rebours: [
      { avant: 2880, texte: 'Descendre les deux emballages du congélateur au réfrigérateur, sur une plaque, tablette du bas.' },
      { avant: 1260, texte: 'Vérifier la décongélation, retirer la membrane des six carrés, parer le gras mou.' },
      { avant: 1200, texte: 'Saler à sec les deux faces et remettre au frigo, à découvert, sur des grilles.' },
      { avant: 300, texte: 'Sortir les carrés du frigo. Mélanger la frotte sèche et l’appliquer.' },
      { avant: 260, texte: 'Préchauffer le four à 275 °F, grilles au centre et au tiers inférieur. Monter les plaques.' },
      { avant: 240, texte: 'Enfourner. Ne plus ouvrir la porte sans raison.' },
      { avant: 150, texte: 'Tourner les plaques d’un demi-tour et les intervertir de niveau.' },
      { avant: 90, texte: 'Première lecture au thermomètre. Préparer la sauce dans un bol pendant ce temps.' },
      { avant: 50, texte: 'Cœur à 198 °F : monter le four à 425 °F et glacer en trois couches minces.' },
      { avant: 35, texte: 'Sortir du four. Couvrir sans serrer. Repos de vingt minutes.' },
      { avant: 30, texte: 'Dégraisser les sucs, déglacer les plaques à la bière, monter la sauce et la faire frémir.' },
      { avant: 10, texte: 'Trancher entre les os, face osseuse vers le haut. Réchauffer la saucière.' },
      { avant: 0, texte: 'Service.' },
    ],
  },
];
