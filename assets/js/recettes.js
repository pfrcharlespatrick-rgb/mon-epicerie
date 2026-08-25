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
    type: 'principal',
    role: 'Plat principal — trois jours de préparation, dont 4 h le jour même',
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

    suggestions: [
      {
        id: 'trempette-herbes-crudites',
        pourquoi:
          'Pendant les trois heures où le four est occupé, il faut quelque chose à ' +
          'grignoter qui ne demande ni feu ni surveillance. Celle-ci se monte la veille, ' +
          'attend au froid, et le cru des légumes prépare le palais au gras qui suit.',
      },
      {
        id: 'tomates-fleur-de-sel',
        pourquoi:
          'Nous sommes fin août : la tomate de champ est à son sommet pour trois ' +
          'semaines encore. Devant un plat aussi riche, une entrée acide et fraîche ' +
          'travaille plus fort qu’une entrée compliquée, et elle ne coûte rien au four.',
      },
      {
        id: 'salade-chou-cremeuse',
        pourquoi:
          'C’est l’accompagnement obligatoire, et ce n’est pas une question de ' +
          'tradition : l’acidité et le froid sont exactement ce qui empêche un plat gras ' +
          'de lasser à la moitié de l’assiette. Faite la veille, elle ne vous coûte rien ' +
          'le jour même.',
      },
      {
        id: 'grelots-gras-de-porc',
        pourquoi:
          'Ils entrent au four au moment précis où les côtes passent à 425 °F pour le ' +
          'glaçage, et ils finissent de rôtir pendant leur repos. Aucun conflit ' +
          'd’horaire, et ils rôtissent dans le gras que vous venez d’écumer des plaques.',
      },
      {
        id: 'ble-inde-beurre-ail',
        pourquoi:
          'Tout se passe sur le rond, dans les dix dernières minutes, pendant que les ' +
          'côtes reposent. C’est le seul plat du menu qui se fait au tout dernier ' +
          'moment, et c’est très bien ainsi : il faut quelque chose à faire pendant ' +
          'qu’on attend.',
      },
      {
        id: 'pain-de-mais',
        pourquoi:
          'Il reste toujours de la sauce dans les assiettes. Il se cuit le matin, entre ' +
          'sept et huit heures avant le repas, pendant que le four est encore libre — ' +
          'car il demande 400 °F et que les côtes réclameront 275 °F toute l’après-midi.',
      },
    ],

    rebours: [
      { avant: 2880, texte: 'Descendre les deux emballages du congélateur au réfrigérateur, sur une plaque, tablette du bas.' },
      { avant: 1260, texte: 'Vérifier la décongélation, retirer la membrane des six carrés, parer le gras mou.' },
      { avant: 1200, texte: 'Saler à sec les deux faces et remettre au frigo, à découvert, sur des grilles.' },
      { avant: 300, texte: 'Sortir les carrés du frigo. Mélanger la frotte sèche et l’appliquer.' },
      { avant: 260, texte: 'Préchauffer le four à 275 °F, grilles au centre et au tiers inférieur. Monter les plaques.', four: 275 },
      { avant: 240, texte: 'Enfourner. Ne plus ouvrir la porte sans raison.', four: 275 },
      { avant: 150, texte: 'Tourner les plaques d’un demi-tour et les intervertir de niveau.', four: 275 },
      { avant: 90, texte: 'Première lecture au thermomètre. Préparer la sauce dans un bol pendant ce temps.', four: 275 },
      { avant: 50, texte: 'Cœur à 198 °F : monter le four à 425 °F et glacer en trois couches minces.', four: 425 },
      { avant: 35, texte: 'Sortir du four. Couvrir sans serrer. Repos de vingt minutes.' },
      { avant: 30, texte: 'Dégraisser les sucs, déglacer les plaques à la bière, monter la sauce et la faire frémir.' },
      { avant: 10, texte: 'Trancher entre les os, face osseuse vers le haut. Réchauffer la saucière.' },
      { avant: 0, texte: 'Service.' },
    ],
  },

  /* ======================================================================
     Les entrées
     ====================================================================== */

  {
    id: 'trempette-herbes-crudites',
    type: 'entree',
    role: 'Entrée froide, montée la veille, aucune place au four',
    titre: 'Trempette froide aux herbes et son plateau de crudités',
    sousTitre: 'Ce qu’on grignote pendant que le four travaille',
    piece: 'Plateau de crudités pour une tablée',
    portions: 14,
    duree: '30 min la veille, 20 min le jour même',
    difficulte: 'Très facile',
    resume:
      'Une entrée servie pendant une cuisson longue a une seule obligation : ne rien ' +
      'demander au four, ni à vous. Celle-ci se monte la veille en une demi-heure et ' +
      'attend au froid. Le secret n’est pas dans la liste, il est dans le temps : une ' +
      'trempette montée vingt-quatre heures d’avance goûte les herbes, alors que la ' +
      'même montée dix minutes avant ne goûte que l’ail cru.',

    temperatures: [{ quoi: 'Service, sortie du frigo depuis 20 min', f: 50, note: 'Trop froide, la trempette ne goûte rien' }],

    ingredients: [
      {
        groupe: 'La trempette',
        items: [
          { q: 500, u: 'ml', nom: 'Crème sure', substitution: 'Yogourt grec nature égoutté trente minutes' },
          { q: 250, u: 'ml', nom: 'Mayonnaise' },
          { q: 30, u: 'g', nom: 'Ciboulette ciselée' },
          { q: 20, u: 'g', nom: 'Aneth frais haché', substitution: '7 g d’aneth séché, ajouté la veille sans faute' },
          { q: 20, u: 'g', nom: 'Persil plat haché' },
          { q: 2, u: 'gousses', nom: 'Ail râpé fin', note: 'Râpé, pas haché : un morceau d’ail cru sous la dent gâche la bouchée' },
          { q: 30, u: 'ml', nom: 'Jus de citron' },
          { q: 15, u: 'ml', nom: 'Câpres hachées', note: 'Facultatif, mais c’est ce qui fait qu’on y revient' },
          { q: 5, u: 'g', nom: 'Sel fin' },
          { q: 3, u: 'g', nom: 'Poivre noir moulu' },
        ],
      },
      {
        groupe: 'Le plateau',
        items: [
          { q: 2000, u: 'g', nom: 'Crudités variées', note: 'Concombres, carottes, radis, poivrons, céleri, tomates cerises — quatre couleurs valent mieux que six légumes' },
          { q: 1, u: 'pain', nom: 'Pain baguette ou craquelins', note: 'Pour ceux qui ne mangent pas de légume cru' },
        ],
      },
    ],

    etapes: [
      {
        titre: 'Monter la trempette',
        duree: '20 min, la veille',
        texte:
          'Mélangez la crème sure et la mayonnaise, puis incorporez les herbes, l’ail ' +
          'râpé, le jus de citron et les câpres. Salez et poivrez, puis goûtez : à ce ' +
          'stade, ce sera trop salé et trop aillé, c’est normal et il ne faut surtout ' +
          'pas corriger. Couvrez et mettez au froid pour la nuit.',
        piege:
          'Hacher l’ail au couteau plutôt que de le râper. Un éclat d’ail cru qui ' +
          'éclate sous la dent efface tout le reste de la bouchée.',
        reussite: 'Le lendemain, la trempette sent les herbes, plus du tout l’ail — c’est le signe qu’elle a fini de se faire.',
      },
      {
        titre: 'Tailler les crudités',
        duree: '20 min',
        texte:
          'Taillez tout en bâtonnets de la longueur d’un doigt, assez épais pour ne pas ' +
          'casser dans la trempette : une crudité qui se rompt dans le bol et qu’on doit ' +
          'aller repêcher est une petite humiliation publique. Gardez les crudités dans ' +
          'un contenant avec un fond d’eau froide et un linge humide par-dessus ; carottes ' +
          'et céleri y regagnent le croquant qu’ils avaient perdu au frigo.',
        reussite: 'Un bâtonnet de carotte plie légèrement sans se casser, et claque sous la dent.',
      },
      {
        titre: 'Dresser',
        duree: '10 min',
        texte:
          'Sortez la trempette vingt minutes avant, le temps qu’elle perde le mordant du ' +
          'froid — une trempette sortie du frigo à l’instant ne goûte rien, le froid ' +
          'anesthésie littéralement les arômes. Goûtez une dernière fois et rectifiez ' +
          'maintenant, pas avant. Dressez les crudités par couleur, en piles serrées ' +
          'plutôt qu’en éventail : la pile se refait toute seule quand la tablée pige ' +
          'dedans, l’éventail devient un champ de bataille après trois mains.',
      },
    ],

    conservation:
      'La trempette se garde quatre jours au réfrigérateur et devient meilleure les deux ' +
      'premiers. Les crudités taillées tiennent deux jours dans l’eau froide, sauf les ' +
      'tomates cerises, qu’on ajoute au dernier moment. Ce qui reste de trempette fait une ' +
      'sauce à sandwich remarquable, et allongée d’un peu de lait, une vinaigrette pour ' +
      'la laitue.',

    rebours: [
      { avant: 1440, texte: 'Monter la trempette aux herbes et la mettre au froid pour la nuit.' },
      { avant: 150, texte: 'Tailler les crudités et les garder dans l’eau froide.' },
      { avant: 25, texte: 'Sortir la trempette du frigo, goûter, rectifier, dresser le plateau.' },
    ],
  },

  {
    id: 'tomates-fleur-de-sel',
    type: 'entree',
    role: 'Entrée de saison, quinze minutes, aucun four',
    titre: 'Tomates du jardin à la fleur de sel',
    sousTitre: 'La bonne entrée de la fin août, et la seule qui ne se cuisine pas',
    piece: 'Tomates de champ, à leur sommet',
    portions: 14,
    duree: '15 min',
    difficulte: 'Aucune difficulté, sauf une : acheter les bonnes tomates',
    resume:
      'Fin août au Québec, la tomate de champ est à son sommet et elle le sera encore ' +
      'trois semaines. Devant un plat aussi riche que des côtes levées, une entrée qui ' +
      'apporte de l’acidité et de la fraîcheur travaille plus fort qu’une entrée ' +
      'compliquée. Il n’y a rien à cuire ici, et pour cette raison précise, chaque geste ' +
      'compte double.',

    avertissements: [
      {
        titre: 'Une tomate ne va jamais au réfrigérateur',
        texte:
          'Sous 12 °C, les composés aromatiques de la tomate se dégradent de façon ' +
          'irréversible et les membranes de sa chair éclatent : elle ressort farineuse et ' +
          'muette, et aucun temps passé sur le comptoir ne la ramène. Gardez-les sur le ' +
          'comptoir, pédoncule vers le bas, jamais empilées. C’est la seule vraie erreur ' +
          'possible dans cette recette, et elle est commise partout.',
      },
    ],

    ingredients: [
      {
        groupe: 'Le plat',
        items: [
          { q: 2000, u: 'g', nom: 'Tomates de champ mûres', note: 'Un mélange de grosseurs et de couleurs vaut mieux qu’un calibre unique' },
          { q: 1, u: '', nom: 'Échalote française émincée très fin' },
          { q: 60, u: 'ml', nom: 'Huile d’olive de bonne qualité', note: 'C’est ici que la bonne bouteille sert, pas dans la poêle' },
          { q: 15, u: 'ml', nom: 'Vinaigre de vin rouge', note: 'Facultatif — si vos tomates sont parfaites, sautez-le' },
          { q: 30, u: 'g', nom: 'Basilic frais', substitution: 'Ciboulette, ou origan frais en petite quantité' },
          { q: 8, u: 'g', nom: 'Fleur de sel', substitution: 'Gros sel écrasé entre les doigts — jamais du sel fin, qui fond et disparaît' },
        ],
      },
    ],

    etapes: [
      {
        titre: 'Trancher',
        duree: '10 min',
        texte:
          'Tranchez les tomates épais, un bon centimètre, avec un couteau bien affûté — ' +
          'un couteau qui n’entame pas la peau du premier coup écrase la chair et vide la ' +
          'tomate de son jus sur la planche. Disposez-les à plat sur un grand plateau, en ' +
          'une seule couche, sans les empiler. Parsemez l’échalote.',
        piege: 'Trancher une heure d’avance. Le jus sort, s’étale, et il ne reste qu’une flaque rose au fond du plat.',
      },
      {
        titre: 'Assaisonner au dernier moment',
        duree: '5 min, juste avant de servir',
        texte:
          'Dix minutes avant le service, et pas plus tôt : la fleur de sel en pincées de ' +
          'haut, le filet d’huile d’olive, le trait de vinaigre si vos tomates manquent ' +
          'un peu de vivacité, le basilic déchiré à la main plutôt que coupé — la lame ' +
          'noircit les bords du basilic en quelques minutes. Ces dix minutes ne sont pas ' +
          'arbitraires : le sel a juste le temps de tirer une perle de jus à la surface ' +
          'de chaque tranche, ce qui fait la sauce, sans avoir celui de vider la tomate.',
        reussite: 'Une petite mare de jus rosé et huileux au fond du plateau à la fin du service. On y trempe le pain.',
      },
    ],

    conservation:
      'Cela ne se conserve pas, et ce n’est pas un défaut. Ce qui reste va dans la salade ' +
      'du lendemain ou, égoutté et poêlé deux minutes, sur des œufs. Ne remettez pas les ' +
      'tranches assaisonnées au frigo : elles rendent leur eau et deviennent tristes.',

    rebours: [
      { avant: 70, texte: 'Trancher les tomates, disposer sur le plateau, parsemer l’échalote.' },
      { avant: 12, texte: 'Fleur de sel, huile d’olive, basilic déchiré à la main.' },
    ],
  },

  /* ======================================================================
     Les accompagnements
     ====================================================================== */

  {
    id: 'salade-chou-cremeuse',
    type: 'accompagnement',
    role: 'À faire la veille, aucune place au four',
    titre: 'Salade de chou crémeuse',
    sousTitre: 'L’acidité et le froid qui empêchent un plat riche de lasser',
    piece: 'Chou vert et carottes',
    portions: 14,
    duree: '30 min la veille, 5 min le jour même',
    difficulte: 'Facile — une seule étape compte vraiment',
    resume:
      'Toutes les salades de chou du monde tiennent sur une seule décision : faire ' +
      'dégorger le chou au sel, ou non. Un chou cru est fait d’eau tenue dans ses ' +
      'cellules ; noyé de sauce, il la relâche pendant des heures et vous servez une ' +
      'soupe tiède. Salé, rincé et essoré la veille, il rend cette eau avant d’être ' +
      'assaisonné, reste croquant deux jours et se marie au lieu de se diluer. C’est la ' +
      'même logique que le salage à sec des côtes levées, appliquée à un légume.',

    ingredients: [
      {
        groupe: 'Les légumes',
        items: [
          { q: 1500, u: 'g', nom: 'Chou vert émincé très fin', note: 'Un gros chou. Émincé au couteau plutôt qu’au robot : le robot le meurtrit' },
          { q: 400, u: 'g', nom: 'Carottes râpées grossièrement' },
          { q: 150, u: 'g', nom: 'Oignon rouge émincé fin', substitution: 'Oignon vert, plus doux, si la tablée compte des enfants' },
          { q: 20, u: 'g', nom: 'Gros sel', note: 'Pour faire dégorger — il sera rincé, il ne compte pas dans l’assaisonnement' },
        ],
      },
      {
        groupe: 'La sauce',
        items: [
          { q: 375, u: 'ml', nom: 'Mayonnaise' },
          { q: 250, u: 'ml', nom: 'Crème sure', substitution: 'Babeurre, pour une salade plus vive et moins riche' },
          { q: 60, u: 'ml', nom: 'Vinaigre de cidre' },
          { q: 45, u: 'ml', nom: 'Sirop d’érable', substitution: '40 g de sucre' },
          { q: 30, u: 'ml', nom: 'Moutarde de Dijon' },
          { q: 5, u: 'g', nom: 'Graines de céleri', note: 'C’est ce qui distingue une salade de chou de maison d’une salade de chou d’épicerie' },
          { q: 3, u: 'g', nom: 'Poivre noir moulu' },
        ],
      },
    ],

    etapes: [
      {
        titre: 'Émincer',
        duree: '20 min',
        texte:
          'Coupez le chou en quatre, retirez le trognon, puis émincez chaque quartier le ' +
          'plus finement que vous pouvez, au couteau. Le robot va plus vite et écrase les ' +
          'fibres, ce qui donne une salade molle avant même la sauce. Râpez les carottes ' +
          'gros, émincez l’oignon fin, et réunissez tout dans le plus grand bol de la ' +
          'maison — il en faut deux fois plus de place qu’on ne le croit.',
      },
      {
        titre: 'Faire dégorger au sel',
        duree: '1 h 30',
        texte:
          'Mélangez le gros sel au chou à pleines mains, en pressant. Laissez reposer une ' +
          'heure et demie dans une passoire posée sur un bol. Vous verrez descendre une ' +
          'quantité d’eau qui vous surprendra : c’est exactement l’eau qui aurait délavé ' +
          'votre sauce demain soir.',
        piege: 'Sauter cette étape par manque de temps. C’est la seule qui compte vraiment dans cette recette.',
        reussite: 'Une bonne tasse d’eau au fond du bol, et le chou a perdu la moitié de son volume.',
      },
      {
        titre: 'Rincer et essorer',
        duree: '10 min',
        texte:
          'Rincez le chou à grande eau froide pour enlever le sel — deux fois plutôt qu’une ' +
          '—, puis essorez-le sérieusement : à l’essoreuse à salade en deux ou trois ' +
          'fournées, ou pressé dans un linge propre. Sérieusement veut dire jusqu’à ce que ' +
          'plus rien ne coule.',
        piege: 'Mal rincer : la salade sera immangeable de sel, et rien ne rattrape ça.',
        reussite: 'Une poignée de chou pressée dans le poing ne laisse pas une goutte.',
      },
      {
        titre: 'Monter la sauce et marier',
        duree: '10 min, puis 4 à 24 h au froid',
        texte:
          'Fouettez la mayonnaise, la crème sure, le vinaigre, le sirop d’érable, la ' +
          'moutarde, les graines de céleri et le poivre. Ne salez pas : goûtez d’abord, le ' +
          'chou en a gardé plus que vous ne pensez. Versez sur les légumes, mélangez, ' +
          'couvrez et laissez au froid la nuit.',
        reussite: 'Le lendemain, la sauce nappe encore le chou au lieu de reposer au fond du bol.',
      },
      {
        titre: 'Rectifier avant de servir',
        duree: '5 min',
        texte:
          'Remuez, goûtez, et corrigez. Une salade de chou d’une nuit demande presque ' +
          'toujours un trait de vinaigre de plus : le sucre et le gras ont pris le dessus ' +
          'pendant la nuit et l’acidité s’est assoupie. C’est un geste de dix secondes qui ' +
          'change tout devant un plat gras.',
      },
    ],

    conservation:
      'Trois jours au réfrigérateur, et elle est meilleure le deuxième. Elle ne se congèle ' +
      'pas. Ce qui reste va dans un sandwich au porc effiloché le lendemain — c’est même ' +
      'la meilleure raison d’en faire trop.',

    rebours: [
      { avant: 1560, texte: 'Émincer le chou, râper les carottes, faire dégorger au gros sel.' },
      { avant: 1440, texte: 'Rincer, essorer, monter la sauce, mélanger et mettre au froid pour la nuit.' },
      { avant: 20, texte: 'Remuer la salade de chou, goûter, ajouter un trait de vinaigre si l’acidité s’est endormie.' },
    ],
  },

  {
    id: 'grelots-gras-de-porc',
    type: 'accompagnement',
    role: 'Au four à 425 °F, exactement pendant le glaçage et le repos des côtes',
    titre: 'Grelots rôtis au gras de porc',
    sousTitre: 'Ce que devient le gras qu’on a écumé des plaques',
    piece: 'Pommes de terre grelots',
    portions: 14,
    duree: '1 h, dont 35 min au four',
    difficulte: 'Facile, mais il faut respecter l’ordre',
    resume:
      'Voici pourquoi cette recette existe dans ce menu et pas ailleurs : elle entre au ' +
      'four au moment exact où les côtes levées passent à 425 °F pour leur glaçage, et ' +
      'elle finit de rôtir pendant leur repos. Aucun four supplémentaire, aucune ' +
      'négociation d’horaire. Et elle rôtit dans le gras que vous venez d’écumer des ' +
      'plaques, qui n’a rien coûté et qui vaut mieux que n’importe quelle huile.',

    temperatures: [
      { quoi: 'Four', f: 425, note: 'Le même que le glaçage des côtes — c’est voulu' },
      { quoi: 'Eau de blanchiment', f: 212, note: 'À gros bouillons, salée comme la mer' },
    ],

    ingredients: [
      {
        groupe: 'Le plat',
        items: [
          { q: 2500, u: 'g', nom: 'Pommes de terre grelots', note: 'Coupées en deux, ou en quatre si elles dépassent le format d’une balle de golf' },
          { q: 120, u: 'ml', nom: 'Gras de porc écumé des plaques', substitution: 'Beurre clarifié, gras de canard, ou huile d’arachide' },
          { q: 30, u: 'g', nom: 'Gros sel', note: 'Pour l’eau de blanchiment' },
          { q: 1, u: 'tête', nom: 'Ail, gousses écrasées en chemise' },
          { q: 4, u: 'branches', nom: 'Romarin ou thym', substitution: '5 g d’herbes de Provence, ajoutées à mi-cuisson pour ne pas brûler' },
          { q: 8, u: 'g', nom: 'Fleur de sel', note: 'À la sortie du four, jamais avant' },
        ],
      },
    ],

    etapes: [
      {
        titre: 'Blanchir',
        duree: '12 min',
        texte:
          'Départ à l’eau froide salée, puis dix minutes à petits bouillons à partir de ' +
          'l’ébullition. Une pointe de couteau doit entrer d’un centimètre sans résistance ' +
          'et buter ensuite : ni crue, ni cuite. Le départ à froid n’est pas une lubie — ' +
          'jetée dans l’eau bouillante, la pomme de terre cuit par l’extérieur et reste ' +
          'crue au centre.',
      },
      {
        titre: 'Secouer dans la passoire',
        duree: '3 min',
        texte:
          'Égouttez, puis laissez sécher deux minutes à la vapeur de leur propre chaleur. ' +
          'Secouez ensuite la passoire vigoureusement, cinq ou six coups francs : les ' +
          'arêtes s’écrasent et la surface devient floue, presque farineuse. Cette purée ' +
          'de surface est précisément ce qui deviendra la croûte. C’est le geste qui ' +
          'sépare une patate rôtie ordinaire d’une patate rôtie dont on se souvient.',
        piege: 'Les enfourner lisses et humides. Elles seront correctes, et rien de plus.',
        reussite: 'Les grelots ne brillent plus, leurs bords sont ébréchés et poudreux.',
      },
      {
        titre: 'Rôtir',
        duree: '35 min',
        temperature: 425,
        texte:
          'Faites chauffer le gras de porc dans la plaque, au four, deux minutes : une ' +
          'pomme de terre posée dans un gras froid l’absorbe au lieu de saisir. Versez les ' +
          'grelots, l’ail en chemise et les branches d’herbes, remuez pour enrober, et ' +
          'étalez en une seule couche, faces coupées contre la plaque. Retournez une seule ' +
          'fois, à mi-cuisson.',
        piege:
          'Entasser. Deux plaques à moitié pleines valent infiniment mieux qu’une plaque ' +
          'bondée, qui cuit les pommes de terre à la vapeur de leur voisine et donne un ' +
          'résultat pâle et mou.',
        reussite: 'Elles roulent en s’entrechoquant quand on secoue la plaque, avec le bruit de petits cailloux.',
      },
      {
        titre: 'Saler à la sortie',
        duree: '2 min',
        texte:
          'Fleur de sel à la sortie du four, et pas avant : salées à l’avance, elles ' +
          'auraient tiré leur eau en cuisant et ramolli leur propre croûte. Servez dans ' +
          'les dix minutes, dans un plat non couvert — un couvercle fait de la vapeur, et ' +
          'la vapeur ramollit tout ce que vous venez de construire.',
      },
    ],

    conservation:
      'Trois jours au réfrigérateur. Elles ne se réchauffent bien qu’au four ou à la poêle, ' +
      'jamais au micro-ondes, qui les rend spongieuses. Vingt minutes à 400 °F leur rendent ' +
      'l’essentiel de leur croûte. Sautées le lendemain avec un oignon et un œuf sur le ' +
      'dessus, elles valent le repas du soir.',

    rebours: [
      { avant: 95, texte: 'Laver et couper les grelots en deux, les mettre à l’eau froide salée.' },
      { avant: 75, texte: 'Blanchir dix minutes, égoutter, secouer fermement dans la passoire.' },
      { avant: 50, texte: 'Enfourner les grelots à 425 °F, en même temps que le glaçage des côtes.', four: 425 },
      { avant: 30, texte: 'Retourner les grelots à mi-cuisson.', four: 425 },
      { avant: 13, texte: 'Sortir les grelots, fleur de sel, plat non couvert.' },
    ],
  },

  {
    id: 'ble-inde-beurre-ail',
    type: 'accompagnement',
    role: 'Sur le rond, dans les dix dernières minutes',
    titre: 'Blé d’Inde en épis, beurre à l’ail et paprika fumé',
    sousTitre: 'Cinq minutes d’eau frémissante, pas une de plus',
    piece: 'Épis de maïs de fin d’été',
    portions: 14,
    duree: '20 min en tout',
    difficulte: 'Très facile — le seul risque est de trop cuire',
    resume:
      'Un épi de blé d’Inde de fin août se mange presque cru. Tout ce que la cuisson doit ' +
      'faire, c’est le chauffer et attendrir à peine ses grains ; chaque minute au-delà ' +
      'convertit son sucre en amidon et vous rend un épi farineux et fade. Quinze minutes ' +
      'd’ébullition, l’habitude la plus répandue au Québec, sont douze minutes de trop.',

    ingredients: [
      {
        groupe: 'Le plat',
        items: [
          { q: 18, u: 'épis', nom: 'Épis de blé d’Inde', note: 'Dix-huit pour quatorze : il s’en reprend toujours' },
          { q: 250, u: 'g', nom: 'Beurre mou' },
          { q: 4, u: 'gousses', nom: 'Ail râpé fin' },
          { q: 8, u: 'g', nom: 'Paprika fumé' },
          { q: 1, u: '', nom: 'Zeste de lime', substitution: 'Zeste de citron' },
          { q: 5, u: 'g', nom: 'Fleur de sel' },
        ],
      },
    ],

    etapes: [
      {
        titre: 'Monter le beurre',
        duree: '10 min, faisable la veille',
        texte:
          'Écrasez le beurre mou à la fourchette avec l’ail râpé, le paprika fumé, le ' +
          'zeste de lime et la fleur de sel. Roulez-le en boudin dans une pellicule ' +
          'plastique et remettez-le au froid : on le tranchera en rondelles à servir avec ' +
          'les épis, ce qui est plus commode qu’un bol de beurre mou que quatorze couteaux ' +
          'vont visiter.',
      },
      {
        titre: 'Éplucher',
        duree: '10 min',
        texte:
          'Épluchez au dernier moment. Un épi épluché d’avance sèche, et ses grains se ' +
          'creusent. Si vous devez prendre de l’avance, laissez-les dans leur enveloppe ' +
          'sur le comptoir, jamais au frigo — le froid transforme le sucre du maïs en ' +
          'amidon aussi sûrement que la cuisson.',
      },
      {
        titre: 'Cuire',
        duree: '5 min',
        texte:
          'Amenez une grande marmite d’eau à ébullition, plongez les épis, ramenez à ' +
          'frémissement et comptez quatre à cinq minutes. Pas de sel dans l’eau : il ne ' +
          'sert à rien ici, le sel arrive avec le beurre. Si votre marmite ne les tient pas ' +
          'tous, faites deux fournées plutôt que d’entasser — l’eau retomberait trop bas ' +
          'et les premiers épis cuiraient le double du temps.',
        piege: 'Quinze minutes d’ébullition. C’est l’habitude la plus répandue et la plus dommageable.',
        reussite: 'Le grain est passé au jaune vif et éclate sous la dent en libérant du jus sucré.',
      },
    ],

    conservation:
      'Le blé d’Inde cuit se garde deux jours au frigo mais perd beaucoup. Le mieux : ' +
      'égrener les épis qui restent au couteau, le soir même, et les garder au froid pour ' +
      'une salade ou une chaudrée. Le beurre à l’ail se garde deux semaines au frigo et ' +
      'trois mois au congélateur — il vaut la peine d’en faire le double.',

    rebours: [
      { avant: 1440, texte: 'Monter le beurre à l’ail et au paprika, le rouler en boudin (facultatif, la veille).' },
      { avant: 45, texte: 'Éplucher les épis de blé d’Inde et monter la grande marmite d’eau.' },
      { avant: 8, texte: 'Plonger les épis, quatre à cinq minutes à frémissement, pas davantage.' },
    ],
  },

  {
    id: 'pain-de-mais',
    type: 'accompagnement',
    role: 'Cuit le matin, pendant que le four est encore libre',
    titre: 'Pain de maïs au babeurre',
    sousTitre: 'Le pain qui sert à saucer, et rien d’autre',
    piece: 'Deux plaques de 33 × 23 cm',
    portions: 14,
    duree: '45 min, le matin',
    difficulte: 'Facile — mais on ne mélange pas trop',
    resume:
      'Ce pain existe pour une seule raison : il reste toujours de la sauce dans les ' +
      'assiettes, et la laisser partir à la vaisselle serait dommage. On le cuit le matin, ' +
      'entre sept et huit heures avant le repas, pendant que le four est encore libre — ' +
      'car il demande 400 °F et que les côtes levées, elles, réclameront 275 °F toute ' +
      'l’après-midi. C’est une question d’horaire avant d’être une question de recette.',

    temperatures: [
      { quoi: 'Four', f: 400, note: 'Le four est libre le matin, il ne le sera plus l’après-midi' },
      { quoi: 'Cœur du pain', f: 200, note: 'Le repère des pains rapides — plus fiable que la couleur' },
    ],

    ingredients: [
      {
        groupe: 'Les secs',
        items: [
          { q: 400, u: 'g', nom: 'Semoule de maïs', note: 'De mouture moyenne — la fine donne un pain de sable' },
          { q: 300, u: 'g', nom: 'Farine tout usage' },
          { q: 80, u: 'g', nom: 'Sucre', note: 'Le pain de maïs du Sud n’en contient pas ; le nôtre, oui, et il va mieux avec la sauce à l’érable' },
          { q: 25, u: 'g', nom: 'Poudre à pâte' },
          { q: 10, u: 'g', nom: 'Sel fin' },
        ],
      },
      {
        groupe: 'Les liquides',
        items: [
          { q: 700, u: 'ml', nom: 'Babeurre', substitution: 'Lait + 60 ml de vinaigre blanc, reposé dix minutes' },
          { q: 4, u: '', nom: 'Œufs', note: 'À température de la pièce' },
          { q: 150, u: 'g', nom: 'Beurre fondu et tiédi', note: 'Tiédi : versé bouillant, il cuit les œufs' },
        ],
      },
    ],

    etapes: [
      {
        titre: 'Préchauffer et beurrer',
        duree: '15 min',
        temperature: 400,
        texte:
          'Four à 400 °F, grille au centre. Beurrez généreusement deux moules de 33 × 23 cm. ' +
          'Si vous avez des poêles en fonte, mettez-les à chauffer à vide dans le four : le ' +
          'beurre grésille au contact et la croûte du dessous est incomparable.',
      },
      {
        titre: 'Mélanger — le moins possible',
        duree: '10 min',
        texte:
          'Fouettez les secs ensemble dans un grand bol. Battez les liquides à part. Versez ' +
          'les liquides sur les secs et mélangez à la spatule en une quinzaine de tours, ' +
          'pas davantage : la pâte doit rester grumeleuse et vous devez encore voir des ' +
          'traînées de farine sèche. Chaque tour de trop développe le gluten.',
        piege:
          'Fouetter jusqu’à obtenir une pâte lisse. Le pain sortira dense, caoutchouteux, ' +
          'et percé de longs tunnels — c’est l’erreur classique, et elle est irréversible.',
        reussite: 'La pâte est bosselée et hétérogène quand elle entre dans le moule. C’est normal et c’est voulu.',
      },
      {
        titre: 'Cuire',
        duree: '25 à 30 min',
        temperature: 400,
        texte:
          'Enfournez sans attendre : la poudre à pâte a commencé à travailler à la seconde ' +
          'où elle a touché le babeurre, et vingt minutes sur le comptoir lui coûtent la ' +
          'moitié de sa force. Vérifiez à 25 minutes : le centre doit atteindre 200 °F au ' +
          'thermomètre, et un cure-dent en ressortir avec quelques miettes sèches, jamais ' +
          'avec de la pâte.',
        reussite: 'Le dessus est doré et fendillé, et le pain se décolle du bord du moule.',
      },
      {
        titre: 'Démouler et laisser tiédir',
        duree: '20 min',
        texte:
          'Démoulez après dix minutes sur une grille, sinon la vapeur emprisonnée sous le ' +
          'pain détrempe le fond. Servez tiède ou à température de la pièce ; un pain de ' +
          'maïs sortant du four s’émiette sous le couteau, alors qu’une heure plus tard il ' +
          'se coupe net.',
      },
    ],

    conservation:
      'Deux jours à couvert sur le comptoir, une semaine au frigo, trois mois au congélateur ' +
      'tranché. Il se réchauffe très bien : trois minutes au four à 350 °F, ou une tranche ' +
      'poêlée au beurre, face coupée dessous, ce qui en fait le déjeuner du lendemain.',

    rebours: [
      { avant: 450, texte: 'Préchauffer le four à 400 °F et beurrer les moules du pain de maïs — le four est encore libre.', four: 400 },
      { avant: 430, texte: 'Mélanger la pâte à peine, enfourner tout de suite, 25 à 30 min jusqu’à 200 °F à cœur.', four: 400 },
      { avant: 395, texte: 'Démouler le pain de maïs sur une grille et laisser tiédir.' },
    ],
  }
];
