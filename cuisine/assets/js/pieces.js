/**
 * La base de connaissances : chaque pièce de viande, de poisson ou de légume,
 * avec ses températures à cœur, son salage, ses étapes, ses pièges et sa
 * sauce. Les textes sont des fonctions du contexte (poids, cuisson choisie,
 * équipement, heure du service) : la recette s'adapte au lieu d'être figée.
 *
 * Contexte reçu par les fonctions :
 *   { poids, cuisson, equip, service, peremption }
 * Le moteur y ajoute `maintenant` (facultatif) pour dater le calendrier ; les
 * textes des pièces, eux, n'ont pas à savoir l'heure qu'il est.
 *
 * Une étape : { quand, titre, duree (minutes, pour le calendrier),
 *   dureeTexte (affichage), critique, texte }
 *   quand : 'veille' | 'jour' | { joursAvant: n }
 */

'use strict';

/** Fenêtre de cuisson proportionnelle au poids : [min, max] en minutes. */
function parKg(poids, minParKg, maxParKg, base = 0) {
  return [Math.round(base + (poids / 1000) * minParKg), Math.round(base + (poids / 1000) * maxParKg)];
}

/** Dose de sel pour le salage à sec : environ 1 % du poids, sauf mention. */
function doseSel(poids, pct = 1) {
  const g = Math.max(4, Math.round((poids * pct) / 100));
  const cuilleres = Math.max(1, Math.round((g / 5) * 2) / 2);
  return g + ' g de gros sel (environ ' + String(cuilleres).replace('.', ',') + ' c. à thé comble' + (cuilleres > 1 ? 's' : '') + ')';
}

const CATEGORIES = [
  { id: 'boeuf', nom: 'Bœuf', emoji: '🥩' },
  { id: 'porc', nom: 'Porc', emoji: '🐖' },
  { id: 'volaille', nom: 'Volaille', emoji: '🍗' },
  { id: 'agneau', nom: 'Agneau', emoji: '🐑' },
  { id: 'poisson', nom: 'Poissons et fruits de mer', emoji: '🐟' },
  { id: 'legume', nom: 'Légumes', emoji: '🥕' },
];

const CUISSONS_BOEUF = [
  { id: 'saignant', nom: 'Saignante', retrait: 48, coeur: 52, note: 'cœur rouge vif, tiède et souple sous le doigt' },
  { id: 'mi-saignant', nom: 'Mi-saignante', retrait: 52, coeur: 56, note: 'cœur rosé soutenu, chaud, encore très juteux — le choix le plus sûr' },
  { id: 'a-point', nom: 'À point', retrait: 56, coeur: 60, note: 'rose pâle, ferme, un peu moins juteux' },
];

const PIECES = [

  /* ===================== BŒUF ===================== */

  {
    id: 'cote-de-boeuf',
    nom: 'Côte de bœuf',
    categorie: 'boeuf',
    emoji: '🥩',
    description: 'Rôti de côtes avec os, cuisson inversée au four doux',
    perissable: 'viande',
    poids: { min: 800, max: 4500, defaut: 1800, indication: 'Comptez environ 450 g avec os par personne.' },
    cuissons: CUISSONS_BOEUF,
    intro(ctx) {
      return '<p>La côte de bœuf mérite la cuisson inversée : un long passage au four très doux qui amène toute la pièce, uniformément, juste sous la température visée, puis une saisie brève qui signe la croûte. La méthode populaire — saisir d’abord, cuire ensuite — donne un anneau gris et sec sous la croûte ; elle n’a pour elle que l’habitude. Le compromis de la cuisson inversée, c’est le temps : elle ne se presse pas, mais elle pardonne presque tout.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut la pièce de ' + Moteur.poids(ctx.poids) + ', du gros sel, du poivre du moulin, un filet d’huile neutre, et pour la sauce une échalote française, une noix de beurre et un fond de vin rouge — un reste de bouteille suffit, et à défaut le même volume de bouillon de bœuf avec une cuillère à thé de vinaigre de vin fait très honnêtement l’affaire. '
        + (ctx.equip.grille ? 'Votre plaque avec grille est exactement ce qu’il faut.' : 'Sans grille de cuisson, posez la pièce sur un lit de grosses rondelles d’oignon au fond du plat : l’air circulera dessous et les oignons parfumeront les sucs.')
        + '</p>';
    },
    etapes(ctx) {
      const [fMin, fMax] = parKg(ctx.poids, 55, 75);
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Épongez la pièce, puis massez-la de ' + doseSel(ctx.poids) + ' sur toutes ses faces. Posez-la sur une grille au réfrigérateur, à découvert, jusqu’au lendemain. Le sel entre dans la chair au lieu de rester en surface, il assaisonne en profondeur et retient les jus à la cuisson ; l’air du frigo sèche la surface, et une surface sèche est la condition d’une belle croûte.' },
        { quand: 'jour', titre: 'Retour à la température de la pièce', duree: 60, dureeTexte: '1 h', texte:
          'Sortez la viande du réfrigérateur une heure avant d’allumer le four. Une pièce glacée à cœur allonge la cuisson et la rend inégale.' },
        { quand: 'jour', titre: 'Four très doux', duree: fMax, dureeTexte: Moteur.plage(fMin, fMax), critique: true, texte:
          'Four à 120 °C. Déposez la pièce sur la grille, ' + (ctx.equip.thermometre ? 'sonde plantée au centre le plus épais, sans toucher l’os. ' : '') + 'et laissez faire sans ouvrir. Visez ' + ctx.cuisson.retrait + ' °C à cœur au retrait — la température montera encore de 3 à 4 degrés au repos pour atteindre les ' + ctx.cuisson.coeur + ' °C visés (' + ctx.cuisson.note + '). C’est ici que tout se joue : l’horloge ne décide de rien, seul le thermomètre compte. La fenêtre indiquée n’est qu’un ordre de grandeur pour votre poids ; commencez à vérifier tôt.' },
        { quand: 'jour', titre: 'Repos', duree: 25, dureeTexte: '20 à 30 min', texte:
          'Sortez la pièce, couvrez-la lâchement de papier d’aluminium. Les jus, chassés vers le centre par la chaleur, se redistribuent ; tranchée trop tôt, la viande les rendrait sur la planche. Profitez-en pour monter le four au maximum, ou chauffer ' + (ctx.equip.fonte ? 'le poêlon de fonte' : 'votre poêle la plus lourde') + ' à feu vif.' },
        { quand: 'jour', titre: 'La saisie finale', duree: 10, dureeTexte: '6 à 10 min', texte:
          'Huilez légèrement la pièce et saisissez-la de toutes parts — au four brûlant 8 à 10 minutes, ou quelques minutes par face à la poêle — jusqu’à une croûte acajou qui craque sous l’ongle et sent le grillé, jamais le brûlé. Le cœur ne bougera presque pas : le repos est déjà fait. Poivrez à la sortie, le poivre brûle au-delà de 200 °C.' },
        { quand: 'jour', titre: 'Tranchage', duree: 5, dureeTexte: '5 min', texte:
          'Détachez l’os en suivant sa courbe, puis tranchez perpendiculairement aux fibres, en tranches d’un bon centimètre. Une chair uniformément rosée d’un bord à l’autre : voilà à quoi se reconnaît la réussite.' },
      ];
    },
    sauce(ctx) {
      return '<p>Ne rincez surtout pas la plaque ni la poêle : les sucs caramélisés au fond sont la sauce qui attend. Faites-y fondre l’échalote ciselée dans une noix de beurre, versez le vin rouge, grattez à la cuillère de bois jusqu’à dissoudre tous les sucs, laissez réduire de moitié, puis ajoutez les jus rendus par la viande au repos. Une dernière noix de beurre hors du feu, et la sauce nappe la cuillère.</p>';
    },
    conservation() {
      return '<p>Les restes se gardent trois à quatre jours au réfrigérateur, bien enveloppés. Réchauffez les tranches au four à 120 °C, dix minutes à peine, jusqu’à tiède — le micro-ondes les cuirait une seconde fois et les grisonnerait. Froides et tranchées mince, elles font d’ailleurs un sandwich remarquable.</p>';
    },
    accompagnement() {
      return '<p>Des pommes de terre grelots rôties dans le gras récupéré de la plaque, et une salade d’hiver bien vinaigrée pour trancher avec la richesse de la viande.</p>';
    },
  },

  {
    id: 'bifteck-epais',
    nom: 'Bifteck épais',
    categorie: 'boeuf',
    emoji: '🍖',
    description: 'Contre-filet ou faux-filet de 3 à 4 cm, à la poêle',
    perissable: 'viande',
    poids: { min: 250, max: 800, defaut: 400, indication: 'Un bifteck de 3 à 4 cm d’épaisseur ; en deçà de 2,5 cm, la fenêtre de cuisson devient trop courte pour être maîtrisée.' },
    cuissons: CUISSONS_BOEUF,
    intro(ctx) {
      return '<p>Un bifteck épais se cuit à la poêle bien chaude, en le retournant souvent — toutes les trente à quarante-cinq secondes. On entend encore dire qu’il ne faut le tourner qu’une fois ; c’est une légende tenace. Les retournements fréquents cuisent plus également, plus vite, et la croûte n’y perd rien. Le seul compromis est d’y rester attentif : ce n’est pas une cuisson qu’on abandonne.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut le bifteck de ' + Moteur.poids(ctx.poids) + ', du gros sel, du poivre, une huile qui tolère la chaleur (canola, pépins de raisin), une généreuse noix de beurre, une gousse d’ail écrasée et une branche de thym — à défaut de thym, du romarin ou rien du tout, le beurre et l’ail suffisent. '
        + (ctx.equip.fonte ? 'Le poêlon de fonte est l’outil rêvé ici.' : 'À défaut de fonte, prenez votre poêle la plus lourde et laissez-lui deux bonnes minutes de plus pour accumuler la chaleur.')
        + '</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez le bifteck de ' + doseSel(ctx.poids) + ' et laissez-le au réfrigérateur, à découvert sur une grille ou une assiette, jusqu’au lendemain. Le sel assaisonne la chair en profondeur et la surface sèche brunira deux fois mieux. Si l’envie vous prend le jour même, salez au minimum quarante-cinq minutes d’avance — jamais dans le quart d’heure qui précède, où le sel tire l’eau en surface sans avoir le temps de rentrer, et la viande bout au lieu de griller.' },
        { quand: 'jour', titre: 'Tempérage', duree: 30, dureeTexte: '30 min', texte:
          'Sortez la viande trente minutes avant la cuisson et épongez-la soigneusement : une surface humide est l’ennemie de la croûte.' },
        { quand: 'jour', titre: 'La poêle brûlante', duree: 5, dureeTexte: '3 à 5 min de préchauffage', texte:
          'Chauffez la poêle à feu vif avec un mince film d’huile, jusqu’à ce qu’elle fume à peine. Ouvrez la fenêtre ou la hotte : une vraie saisie fait de la fumée, c’est normal.' },
        { quand: 'jour', titre: 'Cuisson en retournant souvent', duree: 10, dureeTexte: '6 à 10 min', critique: true, texte:
          'Déposez le bifteck — il doit crier au contact — et retournez-le toutes les trente à quarante-cinq secondes. À mi-parcours, ajoutez beurre, ail et thym, inclinez la poêle et arrosez la viande à la cuillère. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur' + (ctx.equip.thermometre ? ', sonde plantée par le côté, au centre de l’épaisseur' : '') + ' ; le repos portera la température aux ' + ctx.cuisson.coeur + ' °C visés (' + ctx.cuisson.note + '). Sans thermomètre, fiez-vous au toucher : la chair saignante s’enfonce comme la base de votre pouce détendue, l’à point comme le même muscle quand pouce et majeur se touchent. C’est l’étape où tout se gâche : une minute de trop se paie cash.' },
        { quand: 'jour', titre: 'Repos', duree: 7, dureeTexte: '5 à 8 min', texte:
          'Laissez reposer sur une assiette tiède, sous une feuille d’aluminium posée sans serrer. Les jus se redistribuent et la température finit sa course.' },
        { quand: 'jour', titre: 'Tranchage contre le grain', duree: 3, dureeTexte: '2 min', texte:
          'Repérez le sens des fibres et tranchez perpendiculairement, en biseau. Salez d’une pincée de fleur de sel si le cœur vous en dit.' },
      ];
    },
    sauce(ctx) {
      return '<p>Le beurre noisette de la poêle, parfumé d’ail et de thym, est déjà une sauce : versez-le simplement sur les tranches avec les jus du repos. Pour aller plus loin, déglacez la poêle d’un trait de vin rouge ou de bouillon, grattez les sucs, réduisez une minute et montez d’une noix de beurre froide.</p>';
    },
    conservation() {
      return '<p>Un reste de bifteck se garde trois jours au réfrigérateur. Ne le réchauffez pas : tranché mince et froid, sur une salade ou dans un sandwich à la moutarde, il vaut mieux que réchauffé et gris.</p>';
    },
    accompagnement() {
      return '<p>Des frites au four, ou un beurre maître d’hôtel fondant sur des haricots verts encore croquants.</p>';
    },
  },

  {
    id: 'roti-de-palette',
    nom: 'Rôti de palette',
    categorie: 'boeuf',
    emoji: '🍲',
    description: 'Braisé fondant, à la cocotte, cuisson longue',
    perissable: 'viande',
    poids: { min: 1000, max: 3000, defaut: 1600, indication: 'Comptez 350 à 400 g par personne : la palette réduit à la cuisson.' },
    cuissons: [
      { id: 'fondante', nom: 'Fondante', retrait: null, coeur: '90 à 95', note: 'la fourchette entre sans résistance et la viande s’effeuille' },
    ],
    intro(ctx) {
      return '<p>La palette est une pièce de travail, tissée de collagène : elle ne se mange ni saignante ni à point, elle se braise. Ici, la température à cœur ne mesure pas une cuisson rosée mais une transformation — entre 90 et 95 °C, tenus longtemps, le collagène fond en gélatine et la viande devient fondante. La mijoteuse fait un braisé correct, mais le four en cocotte lui est supérieur : la chaleur enveloppe la pièce de tous côtés et le liquide réduit doucement en sauce au lieu de s’allonger. Le compromis de la mijoteuse, c’est sa commodité contre une sauce plus maigre qu’il faudra réduire après coup.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut la palette de ' + Moteur.poids(ctx.poids) + ', deux oignons, deux carottes, une branche de céleri, trois gousses d’ail, deux cuillères à soupe de pâte de tomate, 250 ml de vin rouge — remplaçable tel quel par du bouillon additionné d’une cuillère à soupe de vinaigre balsamique —, environ 500 ml de bouillon de bœuf, une feuille de laurier et du thym. '
        + (ctx.equip.cocotte ? 'Votre cocotte en fonte émaillée est faite pour ça.' : 'Sans cocotte, une rôtissoire couverte serré de deux épaisseurs de papier d’aluminium fait le même office ; vérifiez le niveau de liquide à mi-cuisson.')
        + '</p>';
    },
    etapes(ctx) {
      const [bMin, bMax] = parKg(ctx.poids, 110, 145);
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez la pièce de ' + doseSel(ctx.poids) + ' et laissez-la au réfrigérateur jusqu’au lendemain, à découvert. Même pour un braisé, le salage de la veille assaisonne le cœur de la pièce — le bouillon, lui, ne sale jamais que la surface.' },
        { quand: 'jour', titre: 'La saisie', duree: 15, dureeTexte: '10 à 15 min', texte:
          'Épongez la viande. Dans la cocotte, à feu vif, un filet d’huile : colorez la pièce sur toutes ses faces, sans la bousculer, jusqu’à un brun profond. Ce brun-là, c’est le goût du braisé ; une pièce pâle donne une sauce pâle.' },
        { quand: 'jour', titre: 'Le fond de braise', duree: 10, dureeTexte: '8 à 10 min', texte:
          'Réservez la viande. Dans le même gras, faites suer oignons, carottes et céleri en tranches grossières, ajoutez l’ail et la pâte de tomate, laissez-la roussir une minute — elle perd son acidité et gagne en profondeur. Versez le vin, grattez tous les sucs du fond, laissez réduire de moitié.' },
        { quand: 'jour', titre: 'Le braisage', duree: bMax, dureeTexte: Moteur.plage(bMin, bMax), critique: true, texte:
          'Replacez la viande, versez le bouillon à mi-hauteur de la pièce — jamais à couvert complet, un braisé n’est pas un bouilli. Laurier, thym, couvercle, et four à 150 °C. C’est l’étape de la patience : trop court, la viande est dure et sèche à la fois, c’est le faux plateau du collagène pas encore fondu — on croit avoir trop cuit alors qu’on n’a pas assez cuit. Poursuivez jusqu’à ce que ' + (ctx.equip.thermometre ? 'la sonde marque 90 à 95 °C et surtout qu’elle' : 'une fourchette') + ' entre comme dans du beurre et que la viande se laisse effeuiller. Retournez la pièce à mi-cuisson.' },
        { quand: 'jour', titre: 'Repos dans son jus', duree: 20, dureeTexte: '20 min', texte:
          'Éteignez et laissez reposer la cocotte entrouverte : la viande se détend et reboit une partie du liquide. Elle se tranchera sans s’émietter.' },
        { quand: 'jour', titre: 'La sauce, tirée du braisé', duree: 12, dureeTexte: '10 à 12 min', texte:
          'Réservez la viande au chaud. Dégraissez le jus à la cuillère, retirez le laurier, puis faites réduire à découvert, à petits bouillons, jusqu’à ce que la sauce nappe. Écrasez-y les légumes si vous l’aimez liée, ou passez-la au tamis si vous la voulez lisse. Goûtez, rectifiez, et remettez les tranches dedans.' },
      ];
    },
    sauce() {
      return '<p>Ici la sauce n’est pas un supplément, elle est le braisé lui-même : le liquide de cuisson réduit, dégraissé et goûté. Ne jetez jamais l’excédent — congelé en petits contenants, c’est un fond de bœuf maison qui rendra service à la prochaine sauce.</p>';
    },
    conservation() {
      return '<p>Le braisé est meilleur le lendemain : gardez-le dans sa sauce, trois à quatre jours au réfrigérateur ou trois mois au congélateur. Réchauffez doucement, à couvert, dans la sauce frémissante — jamais à sec.</p>';
    },
    accompagnement() {
      return '<p>Une purée de pommes de terre bien beurrée pour boire la sauce, ou de larges nouilles aux œufs, et un légume vert franc — chou de Bruxelles rôti, haricots.</p>';
    },
  },

  {
    id: 'bavette',
    nom: 'Bavette de bœuf',
    categorie: 'boeuf',
    emoji: '🔥',
    description: 'Vif et court, tranchée contre le grain',
    perissable: 'viande',
    poids: { min: 300, max: 900, defaut: 500, indication: 'Une bavette de 2 à 3 cm d’épaisseur.' },
    cuissons: [
      { id: 'saignant', nom: 'Saignante', retrait: 49, coeur: 52, note: 'cœur rouge, la seule école pour cette pièce selon plusieurs' },
      { id: 'mi-saignant', nom: 'Mi-saignante', retrait: 52, coeur: 55, note: 'rosé soutenu — n’allez pas au-delà, la bavette durcit vite' },
    ],
    intro(ctx) {
      return '<p>La bavette est une pièce à fibres longues et au goût profond, qui ne demande que deux choses : une chaleur vive et brève, et un tranchage strictement perpendiculaire aux fibres. Cuite au-delà du rosé, elle devient une semelle — ce n’est pas une pièce pour les amateurs de bien cuit, et il vaut mieux le savoir avant que pendant.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut la bavette de ' + Moteur.poids(ctx.poids) + ', du gros sel, du poivre, une huile qui supporte le feu vif, et pour la sauce une échalote, une noix de beurre et un trait de vinaigre de vin rouge — ou de vin tout court. '
        + (ctx.equip.bbq ? 'Le BBQ à pleine flamme fait ici merveille, couvercle ouvert.' : (ctx.equip.fonte ? 'Le poêlon de fonte, chauffé sans pitié, est votre meilleur allié.' : 'Prenez votre poêle la plus lourde et donnez-lui le temps de devenir réellement brûlante.'))
        + '</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez de ' + doseSel(ctx.poids) + ' sur les deux faces, et laissez au réfrigérateur à découvert jusqu’au lendemain. Sur une pièce mince et fibreuse comme la bavette, le sel de la veille attendrit sensiblement en plus d’assaisonner.' },
        { quand: 'jour', titre: 'Tempérage et séchage', duree: 30, dureeTexte: '30 min', texte:
          'Sortez la viande trente minutes d’avance et épongez-la jusqu’à ce que le papier reste sec. Sur une cuisson aussi courte, la moindre humidité vole du temps de croûte.' },
        { quand: 'jour', titre: 'Feu vif, cuisson éclair', duree: 8, dureeTexte: '4 à 8 min', critique: true, texte:
          'Sur la surface brûlante et à peine huilée, comptez deux à trois minutes par face selon l’épaisseur, sans jamais quitter la pièce des yeux. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur' + (ctx.equip.thermometre ? ' — sondez par la tranche, dans la partie la plus épaisse' : '') + ' ; le repos mènera aux ' + ctx.cuisson.coeur + ' °C (' + ctx.cuisson.note + '). C’est l’étape sans filet : la bavette passe de parfaite à trop cuite en une minute.' },
        { quand: 'jour', titre: 'Repos', duree: 6, dureeTexte: '5 à 6 min', texte:
          'Sous une feuille d’aluminium posée sans serrer. La pièce est mince, le repos est court, mais il n’est pas négociable : c’est lui qui garde les jus dans la viande.' },
        { quand: 'jour', titre: 'Tranchage contre le grain, en biseau', duree: 3, dureeTexte: '3 min', critique: true, texte:
          'Regardez les longues fibres qui courent dans la pièce, et coupez-les net : tranches minces, perpendiculaires au grain, couteau incliné. C’est la seconde étape où tout peut se gâcher — la même bavette, tranchée dans le sens des fibres, devient inexplicablement coriace.' },
      ];
    },
    sauce(ctx) {
      return '<p>Déglacez la poêle encore chaude — ou une petite casserole si vous avez grillé au BBQ — avec l’échalote ciselée, une noix de beurre et un trait de vinaigre ou de vin ; grattez, réduisez une minute, ajoutez les jus du repos et versez sur les tranches. L’échalote crue, simplement ciselée sur la viande avec un filet d’huile, est l’autre école, et elle se défend.</p>';
    },
    conservation() {
      return '<p>Trois jours au réfrigérateur. Comme toutes les pièces saisies, la bavette se mange froide plutôt que réchauffée : en salade thaïe, avec lime, coriandre et oignon rouge, elle se réinvente.</p>';
    },
    accompagnement() {
      return '<p>Des frites et une salade verte moutardée — le classique bistrot n’a jamais été détrôné pour cette pièce.</p>';
    },
  },

  {
    id: 'filet-mignon',
    nom: 'Filet mignon',
    categorie: 'boeuf',
    emoji: '🎀',
    description: 'Tournedos tendres, poêle et beurre arrosé',
    perissable: 'viande',
    poids: { min: 150, max: 600, defaut: 350, indication: 'Un ou deux tournedos de 4 cm d’épaisseur, environ 175 g chacun.' },
    cuissons: CUISSONS_BOEUF,
    intro(ctx) {
      return '<p>Le filet est la pièce la plus tendre du bœuf et la moins goûteuse : tout l’art consiste à lui prêter du goût — une croûte franche, un beurre parfumé — sans jamais dépasser la cuisson, car sa maigreur ne pardonne pas le trop-cuit. On le sert volontiers saignant ou mi-saignant ; à point, il commence déjà à se dessécher.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut les tournedos (' + Moteur.poids(ctx.poids) + ' en tout), du gros sel, du poivre, une huile neutre, beaucoup de beurre, de l’ail en chemise et du thym. La ficelle de boucher, si les tournedos sont hauts, les garde bien ronds — '
        + (ctx.equip.ficelle ? 'un tour serré à mi-hauteur suffit.' : 'à défaut, tassez-les simplement de la main avant la cuisson, rien de grave.')
        + '</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez de ' + doseSel(ctx.poids) + ', puis une nuit au réfrigérateur à découvert. Sur une pièce aussi maigre, l’assaisonnement en profondeur fait une vraie différence — c’est le goût que la pièce n’a pas d’elle-même.' },
        { quand: 'jour', titre: 'Tempérage', duree: 30, dureeTexte: '30 min', texte:
          'Sortez la viande trente minutes d’avance, épongez, poivrez au dernier moment.' },
        { quand: 'jour', titre: 'Saisie sur les deux faces', duree: 5, dureeTexte: '4 à 5 min', texte:
          'Poêle bien chaude, film d’huile : saisissez deux minutes par face sans y toucher, jusqu’à une croûte dorée. Saisissez aussi le pourtour en tenant les tournedos à la pince, comme on roule un tonneau.' },
        { quand: 'jour', titre: 'Beurre, ail, arrosage', duree: 6, dureeTexte: '3 à 6 min', critique: true, texte:
          'Baissez à feu moyen, ajoutez une grosse noix de beurre, l’ail écrasé en chemise et le thym ; inclinez la poêle et arrosez sans relâche. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur pour atteindre ' + ctx.cuisson.coeur + ' °C après repos (' + ctx.cuisson.note + '). ' + (ctx.equip.thermometre ? 'Sondez par le côté, au centre.' : 'Au toucher : souple avec un léger ressort pour saignant, nettement plus ferme pour à point.') + ' Le filet passe vite son point de perfection : mieux vaut vérifier deux fois qu’une.' },
        { quand: 'jour', titre: 'Repos', duree: 6, dureeTexte: '5 à 6 min', texte:
          'Sur une assiette tiède, sous l’aluminium posé lâche, le temps de finir la sauce dans la poêle.' },
      ];
    },
    sauce(ctx) {
      return '<p>Dans la poêle aux sucs, jetez une échalote ciselée, déglacez au cognac, au vin rouge ou au bouillon, réduisez de moitié, ajoutez 125 ml de crème 35 % et une cuillère à thé de poivre vert ou de moutarde ; laissez épaissir deux minutes, puis incorporez les jus du repos. Le filet sans sauce est un rendez-vous manqué.</p>';
    },
    conservation() {
      return '<p>Deux à trois jours au réfrigérateur ; c’est une pièce qui se réchauffe mal, servez plutôt les restes froids, tranchés sur un pain croûté beurré de moutarde.</p>';
    },
    accompagnement() {
      return '<p>Une purée fine, des champignons poêlés à feu vif, ou des asperges rôties quand la saison s’y prête.</p>';
    },
  },

  /* ===================== PORC ===================== */

  {
    id: 'filet-de-porc',
    nom: 'Filet de porc',
    categorie: 'porc',
    emoji: '🐖',
    description: 'Saisi puis fini au four, rosé pâle et juteux',
    perissable: 'viande',
    poids: { min: 300, max: 800, defaut: 500, indication: 'Un filet nourrit deux à trois personnes.' },
    cuissons: [
      { id: 'rose', nom: 'Rosée pâle', retrait: 60, coeur: 63, note: 'juteuse, à peine rosée — le porc d’aujourd’hui le permet' },
      { id: 'cuite', nom: 'Bien cuite', retrait: 68, coeur: 71, note: 'la norme officielle de Santé Canada, plus sèche' },
    ],
    intro(ctx) {
      return '<p>Le filet de porc est maigre et fin : il cuit vite et sèche encore plus vite. La vieille consigne du porc bien gris date d’une époque où l’on craignait la trichinose, aujourd’hui à peu près disparue des élevages d’ici ; à 63 °C à cœur, tenus par le repos, un filet entier est à la fois sûr et juteux. Santé Canada recommande officiellement 71 °C pour les coupes entières de porc — je vous donne les deux, et je vous dis franchement le compromis : à 71 °C, il sera sec.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut le filet de ' + Moteur.poids(ctx.poids) + ', débarrassé de sa membrane argentée (glissez la pointe du couteau dessous et tirez en ruban — elle ne fond jamais à la cuisson), du gros sel, du poivre, de l’huile, une noix de beurre, et pour la sauce une échalote, une cuillère à soupe de moutarde de Dijon et un fond de cidre, de jus de pomme ou de bouillon de poulet.</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez de ' + doseSel(ctx.poids) + ' et réfrigérez à découvert jusqu’au lendemain : le sel pénètre cette pièce maigre et l’aide à retenir ses jus, ce dont elle a cruellement besoin.' },
        { quand: 'jour', titre: 'Tempérage et four', duree: 30, dureeTexte: '30 min', texte:
          'Sortez le filet trente minutes d’avance, épongez, poivrez. Préchauffez le four à 190 °C.' },
        { quand: 'jour', titre: 'La saisie', duree: 8, dureeTexte: '6 à 8 min', texte:
          'Dans une poêle allant au four, feu vif, film d’huile : dorez le filet sur toutes ses faces. Repliez la pointe mince sous elle-même' + (ctx.equip.ficelle ? ' et ficelez-la' : '') + ' pour égaliser l’épaisseur, sans quoi la queue sera trop cuite avant le corps.' },
        { quand: 'jour', titre: 'Finition au four', duree: 15, dureeTexte: '10 à 15 min', critique: true, texte:
          'Glissez la poêle au four, une noix de beurre sur le filet. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur — le repos portera la pièce à ' + ctx.cuisson.coeur + ' °C (' + ctx.cuisson.note + '). ' + (ctx.equip.thermometre ? 'La sonde au centre du corps, pas dans la pointe.' : 'Sans thermomètre : la chair doit résister sous le doigt comme la paume à demi fermée, et les jus perler rosé très pâle à la piqûre.') + ' C’est ici que les filets meurent : cinq minutes de trop et il est gris. Vérifiez tôt, vérifiez souvent.' },
        { quand: 'jour', titre: 'Repos', duree: 10, dureeTexte: '8 à 10 min', texte:
          'Sur une planche, sous l’aluminium lâche. Pendant ce temps, la poêle et ses sucs deviennent la sauce.' },
        { quand: 'jour', titre: 'Tranchage', duree: 3, dureeTexte: '3 min', texte:
          'En médaillons d’un bon centimètre et demi, légèrement en biseau. Une chair uniformément nacrée-rosée, des jus clairs qui restent dans la tranche : c’est gagné.' },
      ];
    },
    sauce(ctx) {
      return '<p>Dans la poêle aux sucs, l’échalote ciselée une minute, puis le cidre ou le bouillon ; grattez, réduisez de moitié, fouettez la moutarde, ajoutez les jus du repos et, si vous en avez, une lampée de crème. Deux minutes de frémissement et la sauce est prête — les sucs d’un filet saisi valent de l’or, ne les rincez jamais dans l’évier.</p>';
    },
    conservation() {
      return '<p>Trois jours au réfrigérateur. Réchauffez les médaillons dans la sauce, à feu très doux et à couvert — jamais au micro-ondes à découvert, qui en ferait des ronds de liège.</p>';
    },
    accompagnement() {
      return '<p>Des pommes de terre rattes écrasées à la fourchette avec du beurre, et un chou vert braisé ou des pommes poêlées, qui aiment le porc d’amour tendre.</p>';
    },
  },

  {
    id: 'cotelettes-de-porc',
    nom: 'Côtelettes de porc épaisses',
    categorie: 'porc',
    emoji: '🥓',
    description: 'Avec os, 3 cm et plus, saumure sèche et poêle',
    perissable: 'viande',
    poids: { min: 250, max: 900, defaut: 450, indication: 'Une belle côtelette avec os de 3 cm pèse 350 à 450 g.' },
    cuissons: [
      { id: 'rose', nom: 'Rosée pâle', retrait: 58, coeur: 62, note: 'juteuse, rosé discret près de l’os' },
      { id: 'cuite', nom: 'Bien cuite', retrait: 68, coeur: 71, note: 'la norme officielle, au prix du moelleux' },
    ],
    intro(ctx) {
      return '<p>Achetez-les épaisses : la côtelette mince est une invention pour presser le souper, et elle se paie en sécheresse — le temps de la colorer, elle est déjà trop cuite. Une côtelette de trois centimètres, salée la veille et cuite en la retournant souvent, reste juteuse jusqu’à l’os.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut les côtelettes (' + Moteur.poids(ctx.poids) + ' en tout), du gros sel, du poivre, de l’huile, du beurre, une gousse d’ail et de la sauge ou du thym — la sauge a une affinité ancienne avec le porc, mais le thym la remplace sans drame. '
        + (ctx.equip.fonte ? 'Sortez le poêlon de fonte.' : 'Votre poêle la plus lourde fera le travail.')
        + '</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Saumure sèche', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez les côtelettes de ' + doseSel(ctx.poids) + ' et laissez-les à découvert au réfrigérateur jusqu’au lendemain. Le porc d’épicerie est maigre ; ce salage-là est sa meilleure assurance contre la sécheresse, et la couenne séchée croustillera au lieu de bouillir.' },
        { quand: 'jour', titre: 'Tempérage', duree: 30, dureeTexte: '30 min', texte:
          'Trente minutes hors du froid, un bon épongeage, un tour de moulin à poivre. Entaillez le gras de bordure tous les deux centimètres, sans toucher la chair : la côtelette ne se cambrera pas à la cuisson.' },
        { quand: 'jour', titre: 'Cuisson en retournant souvent', duree: 12, dureeTexte: '8 à 12 min', critique: true, texte:
          'Poêle bien chaude, film d’huile, et retournez toutes les quarante-cinq secondes. Tenez aussi les côtelettes debout à la pince, gras de bordure contre la poêle, une minute, pour le rendre croustillant. En fin de cuisson, beurre, ail et sauge, et arrosez. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur' + (ctx.equip.thermometre ? ', sonde par le côté, loin de l’os' : '') + ' pour finir à ' + ctx.cuisson.coeur + ' °C après repos (' + ctx.cuisson.note + '). L’os fausse le toucher : près de lui la chair semble toujours plus molle, jugez la pièce en son centre.' },
        { quand: 'jour', titre: 'Repos', duree: 7, dureeTexte: '5 à 8 min', texte:
          'Sous l’aluminium lâche. Les jus qui perlent dans l’assiette pendant le repos retournent dans la sauce, pas dans l’évier.' },
      ];
    },
    sauce(ctx) {
      return '<p>Déglacez la poêle au cidre ou au bouillon de poulet, grattez les sucs, réduisez, puis montez au beurre avec une pointe de moutarde et les jus du repos. Une cuillère de sirop d’érable n’y serait pas un crime — le porc et l’érable se connaissent depuis longtemps par ici.</p>';
    },
    conservation() {
      return '<p>Trois jours au réfrigérateur. Réchauffez à couvert dans un fond de bouillon à feu doux, ou effeuillez la chair froide dans un sandwich — l’os, lui, parfumera une soupe de pois.</p>';
    },
    accompagnement() {
      return '<p>Une compote de pommes non sucrée, à peine tiède, et des haricots verts au beurre. L’acidité de la pomme réveille le gras de la côtelette.</p>';
    },
  },

  {
    id: 'epaule-de-porc',
    nom: 'Épaule de porc (soc)',
    categorie: 'porc',
    emoji: '🌮',
    description: 'Effilochée, cuisson lente au four ou au BBQ',
    perissable: 'viande',
    poids: { min: 1500, max: 5000, defaut: 2500, indication: 'Comptez 250 g crus par personne ; l’épaule perd le tiers de son poids en cuisant.' },
    cuissons: [
      { id: 'effilochee', nom: 'Effilochée', retrait: null, coeur: '90 à 95', note: 'la sonde entre partout comme dans du beurre' },
    ],
    intro(ctx) {
      return '<p>Le soc de porc est la pièce la plus indulgente qui soit : grasse, tissée de collagène, elle réclame seulement du temps et une chaleur basse. On la mène entre 90 et 95 °C à cœur — non pour la sécurité, acquise bien avant, mais parce que c’est là que le collagène a fondu et que la viande s’effiloche à la fourchette. La mijoteuse en fait une version honnête mais bouillie ; le four à découvert donne en plus l’écorce brune qui fait la moitié du plaisir. Compromis : le four demande un après-midi entier à la maison.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut l’épaule de ' + Moteur.poids(ctx.poids) + ', du gros sel, de la cassonade, du paprika fumé si vous en avez — du paprika ordinaire avec une pincée de cumin sinon —, du poivre et une pointe de cayenne. Prévoyez une plaque à rebords' + (ctx.equip.grille ? ' avec sa grille' : ', avec un lit d’oignons en grosses tranches pour surélever la pièce') + ', et un peu de jus de pomme pour la fin.'
        + (ctx.equip.bbq ? ' Si le BBQ permet une cuisson indirecte stable à 120-135 °C avec une poignée de copeaux de bois, vous gagnerez la fumée en prime.' : '')
        + '</p>';
    },
    etapes(ctx) {
      const [cMin, cMax] = parKg(ctx.poids, 130, 170);
      return [
        { quand: 'veille', titre: 'Salage et épices', duree: 10, dureeTexte: '10 min, puis une nuit au frigo', texte:
          'Massez la pièce de ' + doseSel(ctx.poids) + ', puis d’un mélange de deux cuillères à soupe de cassonade, une de paprika, une cuillère à thé de poivre et la cayenne. Une nuit au réfrigérateur, à découvert : le sel descend, le sucre fera l’écorce.' },
        { quand: 'jour', titre: 'Départ tôt, four bas', duree: 15, dureeTexte: '15 min', texte:
          'Pas besoin de tempérer une si grosse pièce. Four à 135 °C, l’épaule sur la grille de la plaque, gras vers le haut' + (ctx.equip.thermometre ? ', sonde au centre de la masse, loin de l’os' : '') + '. Un fond d’eau dans la plaque empêchera les gouttes de brûler — ces gouttes sont la base de votre sauce.' },
        { quand: 'jour', titre: 'La longue cuisson', duree: cMax, dureeTexte: Moteur.plage(cMin, cMax), critique: true, texte:
          'Laissez faire. Vers 70 °C à cœur, la température fera du surplace pendant une heure ou deux — c’est le fameux plateau, l’évaporation qui refroidit la pièce autant que le four la chauffe. Ne montez pas le feu, n’ouvrez pas la porte : le plateau est le moment précis où le collagène fond, c’est lui qui fabrique le moelleux. L’abandon du plateau est la grande erreur de cette recette. Poursuivez jusqu’à 90-95 °C, quand la sonde — ou une fourchette — entre sans aucune résistance et que l’écorce est d’un brun profond qui embaume.' },
        { quand: 'jour', titre: 'Repos enveloppé', duree: 45, dureeTexte: '45 min à 1 h', texte:
          'Enveloppez l’épaule de papier d’aluminium, puis d’un linge, et laissez-la se remettre de ses émotions — dans une glacière vide, elle patiente même deux heures sans refroidir. Ce long repos redistribue les jus dans une masse pareille.' },
        { quand: 'jour', titre: 'Effilochage et sauce des sucs', duree: 20, dureeTexte: '15 à 20 min', texte:
          'Effilochez à deux fourchettes, en écartant les amas de gras dur mais en gardant l’écorce, hachée menu — c’est le meilleur. Dégraissez le jus de la plaque, détendez-le d’un peu de jus de pomme, grattez tous les sucs, et arrosez-en la viande effilochée : elle reboit tout, et c’est ce qui la garde brillante au lieu de sécher dans le plat.' },
      ];
    },
    sauce() {
      return '<p>La vraie sauce est déjà dans la viande — les sucs de la plaque, dégraissés et remélangés. S’il vous en reste, un trait de vinaigre de cidre, une cuillère de cassonade et une pointe de moutarde en font une sauce BBQ minute qui ne doit rien au commerce.</p>';
    },
    conservation() {
      return '<p>Quatre jours au réfrigérateur, trois mois au congélateur, toujours avec son jus. Réchauffez à couvert avec une lampée de jus de pomme, à feu doux ; l’effiloché réchauffé à sec devient de la charpie.</p>';
    },
    accompagnement() {
      return '<p>Pains briochés grillés et salade de chou crémeuse, ou tacos avec oignon rouge mariné et coriandre. La fraîcheur acide est le contrepoint obligé de tout ce moelleux.</p>';
    },
  },

  {
    id: 'longe-de-porc',
    nom: 'Longe de porc rôtie',
    categorie: 'porc',
    emoji: '🍖',
    description: 'Rôti du dimanche, four doux et croûte finale',
    perissable: 'viande',
    poids: { min: 800, max: 3000, defaut: 1500, indication: 'Comptez 200 à 250 g par personne.' },
    cuissons: [
      { id: 'rose', nom: 'Rosée pâle', retrait: 59, coeur: 63, note: 'juteuse et nacrée — la longe sèche vite au-delà' },
      { id: 'cuite', nom: 'Bien cuite', retrait: 68, coeur: 71, note: 'la norme officielle de Santé Canada' },
    ],
    intro(ctx) {
      return '<p>La longe n’est pas l’épaule : maigre, sans collagène à fondre, elle se conduit comme un rôti de bœuf et se gâche comme lui, par excès de zèle. Le four doux jusqu’à la température juste, un vrai repos, une saisie brève — la méthode inversée, encore, parce que la méthode du four fort en continu cuit le pourtour à 80 °C le temps que le centre en atteigne 60.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut la longe de ' + Moteur.poids(ctx.poids) + (ctx.equip.ficelle ? ', ficelée en rôti régulier — trois tours suffisent si le boucher ne l’a pas fait' : ' — demandez-la ficelée par le boucher si possible') + ', du gros sel, du poivre, deux gousses d’ail, du romarin ou de la sauge, de l’huile et du beurre, plus un fond de bouillon de poulet et une pomme ou un oignon pour la sauce.</p>';
    },
    etapes(ctx) {
      const [fMin, fMax] = parKg(ctx.poids, 45, 65);
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez de ' + doseSel(ctx.poids) + ' sur toutes les faces et réfrigérez à découvert. La longe est la pièce qui profite le plus de cette nuit-là : maigre et épaisse, elle n’a que le sel pour défendre son moelleux.' },
        { quand: 'jour', titre: 'Tempérage', duree: 60, dureeTexte: '1 h', texte:
          'Une heure hors du froid, un épongeage, du poivre, et quelques incisions piquées d’éclats d’ail et de romarin si le cœur vous en dit.' },
        { quand: 'jour', titre: 'Four doux', duree: fMax, dureeTexte: Moteur.plage(fMin, fMax), critique: true, texte:
          'Four à 140 °C, la longe gras vers le haut sur une grille au-dessus de la plaque' + (ctx.equip.thermometre ? ', sonde au centre' : '') + '. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur — le repos conduira aux ' + ctx.cuisson.coeur + ' °C visés (' + ctx.cuisson.note + '). La fenêtre affichée dépend du diamètre autant que du poids : commencez à vérifier au premier tiers. Ici se joue tout le rôti : chaque degré au-delà de la cible se paiera en tranches sèches.' },
        { quand: 'jour', titre: 'Repos', duree: 20, dureeTexte: '15 à 20 min', texte:
          'Sous l’aluminium lâche, pendant que le four monte à pleine puissance.' },
        { quand: 'jour', titre: 'Saisie éclair', duree: 8, dureeTexte: '5 à 8 min', texte:
          'Repassez le rôti au four brûlant — ou roulez-le dans une poêle vive — juste le temps de dorer le gras. La peau du dessus doit crépiter et sentir le rôti du dimanche.' },
        { quand: 'jour', titre: 'Tranchage', duree: 5, dureeTexte: '5 min', texte:
          'Ôtez la ficelle, tranchez en tranches d’un centimètre. Une chair rosée pâle et brillante, un jus clair qui reste dans la viande : c’est la réussite.' },
      ];
    },
    sauce(ctx) {
      return '<p>Les sucs de la plaque, déglacés au bouillon avec l’oignon ou la pomme en dés, réduits puis passés, montés d’une noix de beurre et des jus du repos : une sauce claire qui suffit amplement. Le gras figé de la plaque, réservé au frigo, fera rôtir vos prochaines patates.</p>';
    },
    conservation() {
      return '<p>Quatre jours au réfrigérateur. Le rôti froid tranché mince est un trésor de semaine — sandwichs, salades — et se réchauffe convenablement dans sa sauce, à feu doux, jamais à sec.</p>';
    },
    accompagnement() {
      return '<p>Patates rôties dans le gras du rôti, chou rouge braisé aux pommes, ou une purée de céleri-rave pour changer des habitudes.</p>';
    },
  },

  /* ===================== VOLAILLE ===================== */

  {
    id: 'poulet-entier',
    nom: 'Poulet entier rôti',
    categorie: 'volaille',
    emoji: '🍗',
    description: 'Peau croustillante, chair juteuse, sauce du plat',
    perissable: 'volaille',
    poids: { min: 1200, max: 2800, defaut: 1800, indication: 'Un poulet de 1,8 kg nourrit quatre personnes.' },
    cuissons: [
      { id: 'roti', nom: 'Rôti classique', retrait: null, coeur: '82 / 74', note: 'cuisse 82 °C, poitrine 74 °C — les jus coulent clairs à la jointure' },
    ],
    intro(ctx) {
      return '<p>Le poulet rôti est un problème de géométrie : la cuisse veut 82 °C et la poitrine voudrait s’arrêter bien avant. Tout ce qui suit — le salage de la veille, la peau séchée, les cuisses exposées et la poitrine ménagée — sert à réconcilier les deux. L’arrosage constant, si populaire, joue contre vous : chaque ouverture de porte refroidit le four, mouille la peau et allonge la cuisson ; on arrose une fois, tard, ou pas du tout.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut le poulet de ' + Moteur.poids(ctx.poids) + ', du gros sel, du poivre, un demi-citron et quelques gousses d’ail pour la cavité, une noix de beurre mou, et un fond de bouillon pour la sauce. '
        + (ctx.equip.ficelle ? 'Un bout de ficelle pour lier les pattes, sans plus — le bridage serré complique la cuisson des cuisses au lieu de l’aider.' : 'Pas de ficelle nécessaire : les pattes libres cuisent même mieux.')
        + '</p>';
    },
    etapes(ctx) {
      const [rMin, rMax] = parKg(ctx.poids, 33, 42, 12);
      return [
        { quand: 'veille', titre: 'Salage à sec, peau à l’air', duree: 10, dureeTexte: '10 min, puis une nuit au frigo', texte:
          'Épongez le poulet dedans et dehors — sans le rincer : rincer une volaille asperge l’évier de bactéries que seule la cuisson tue. Salez-le de ' + doseSel(ctx.poids, 0.9) + ', en glissant une pincée sous la peau de la poitrine, et laissez-le au réfrigérateur à découvert, sur une grille, toute la nuit. La peau qui sèche est le seul vrai secret de la peau qui croustille. Lavez-vous les mains et tout ce que le poulet cru a touché.' },
        { quand: 'jour', titre: 'Tempérage et four', duree: 45, dureeTexte: '45 min', texte:
          'Sortez le poulet quarante-cinq minutes d’avance. Four à 200 °C. Citron et ail dans la cavité, beurre massé sur la peau, poivre. Posez-le dans un plat juste à sa taille, cuisses vers le fond du four — c’est le coin le plus chaud, et ce sont elles qui en demandent le plus.' },
        { quand: 'jour', titre: 'Le rôtissage', duree: rMax, dureeTexte: Moteur.plage(rMin, rMax), critique: true, texte:
          'Enfournez et résistez à la porte. Visez 82 °C dans le creux de la cuisse et au moins 74 °C au plus épais de la poitrine' + (ctx.equip.thermometre ? ' — sondez les deux, sans toucher l’os' : '') + '. Sans thermomètre, piquez la jointure de la cuisse : les jus doivent couler parfaitement clairs, sans trace rosée, et le pilon se déhancher librement. Sur la volaille, la température de sécurité n’est pas négociable — c’est l’étape où l’on ne triche pas. Si la peau fonce trop vite, coiffez la poitrine d’une feuille d’aluminium et continuez.' },
        { quand: 'jour', titre: 'Repos', duree: 15, dureeTexte: '15 min', texte:
          'Sur une planche creusée ou une assiette, sans couvrir serré — la vapeur ramollirait cette peau qui vous a coûté une nuit. Les jus qui s’écoulent rejoignent la sauce.' },
        { quand: 'jour', titre: 'Découpe', duree: 10, dureeTexte: '8 à 10 min', texte:
          'Cuisses détachées à la jointure, poitrines levées le long du bréchet puis tranchées. Gardez la carcasse : elle vaut un litre de bouillon.' },
      ];
    },
    sauce(ctx) {
      return '<p>Le fond du plat est un concentré qu’aucun cube n’égale : dégraissez-le en partie, posez le plat sur le feu, déglacez au bouillon en grattant, réduisez, ajoutez les jus du repos et une noix de beurre. Une cuillère de moutarde ou le jus du demi-citron confit de la cavité l’achèvent joliment.</p>';
    },
    conservation() {
      return '<p>Trois à quatre jours au réfrigérateur, chair détachée de la carcasse. Réchauffez à couvert avec un peu de bouillon ; la carcasse, elle, mijote une heure avec oignon, carotte et laurier pour donner le bouillon de la semaine. D’un poulet, rien ne se jette.</p>';
    },
    accompagnement() {
      return '<p>Des légumes-racines rôtis sous le poulet même, dans son gras, ou un riz au jus et une salade amère — chicorée, roquette — pour la fraîcheur.</p>';
    },
  },

  {
    id: 'hauts-de-cuisse',
    nom: 'Hauts de cuisse de poulet',
    categorie: 'volaille',
    emoji: '🍢',
    description: 'Peau dorée à la poêle, départ en douceur',
    perissable: 'volaille',
    poids: { min: 400, max: 1500, defaut: 800, indication: 'Quatre hauts de cuisse avec peau et os font environ 800 g.' },
    cuissons: [
      { id: 'fondant', nom: 'Fondants', retrait: null, coeur: '85', note: 'bien au-delà du minimum officiel de 74 °C : c’est là que la cuisse devient fondante' },
    ],
    intro(ctx) {
      return '<p>La cuisse est l’anti-poitrine : riche en collagène, elle ne sèche pas à 85 °C, elle y devient meilleure. La cuire au minimum réglementaire de 74 °C la laisse caoutchouteuse près de l’os ; poussée à 85, elle fond. La méthode : poser la peau dans une poêle à peine chaude et la laisser rendre son gras longuement — la peau frite dans son propre gras, c’est elle le plat.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut les hauts de cuisse (' + Moteur.poids(ctx.poids) + '), avec peau et idéalement avec os, du gros sel, du poivre, et pour la sauce une échalote, un fond de bouillon et une cuillère de moutarde ou un trait de citron. Aucune huile : la peau fournira tout le gras nécessaire.</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez de ' + doseSel(ctx.poids, 0.9) + ', surtout côté peau, et laissez à découvert au réfrigérateur. Peau sèche, peau croustillante — la règle ne souffre pas d’exception.' },
        { quand: 'jour', titre: 'Départ à la poêle tiède', duree: 5, dureeTexte: '5 min', texte:
          'Épongez, poivrez. Déposez les hauts de cuisse côté peau dans la poêle froide ou à peine tiède, bien à plat, et allumez à feu moyen-doux. Le gras fond avant que la peau ne brûle : c’est tout l’intérêt du départ à froid.' },
        { quand: 'jour', titre: 'La peau qui confit', duree: 18, dureeTexte: '15 à 20 min', critique: true, texte:
          'Ne touchez à rien, sinon pour presser doucement les morceaux à plat. La peau grésille, blondit, puis acajou. La tentation de monter le feu est le piège : trop fort, la peau brûle avant que le gras n’ait fondu et la chair reste crue dessous. Quand la peau se détache d’elle-même et résonne sec sous l’ongle, elle est prête.' },
        { quand: 'jour', titre: 'Finir côté chair', duree: 8, dureeTexte: '5 à 8 min', texte:
          'Retournez, montez légèrement le feu, et menez la chair à 85 °C au plus épais, contre l’os' + (ctx.equip.thermometre ? '' : ' — les jus piqués doivent couler clairs et la chair se détacher de l’os sans forcer') + '. Sur la volaille, jamais moins de 74 °C, nulle part.' },
        { quand: 'jour', titre: 'Repos court', duree: 5, dureeTexte: '4 à 5 min', texte:
          'Peau vers le haut, jamais couverte — cinq minutes, le temps de la sauce.' },
      ];
    },
    sauce(ctx) {
      return '<p>Versez l’excédent de gras dans un petit pot — c’est du gras de poulet parfumé, il rôtira des patates mémorables. Dans la poêle aux sucs blonds, l’échalote une minute, le bouillon, une réduction brève, la moutarde ou le citron, et les jus du repos : sauce faite.</p>';
    },
    conservation() {
      return '<p>Trois à quatre jours au réfrigérateur. Réchauffez au four à 180 °C, peau à l’air et à sec, dix minutes — au micro-ondes, la peau qui vous a tant coûté redevient chiffe molle.</p>';
    },
    accompagnement() {
      return '<p>Un riz pilaf cuit dans le gras de la poêle, ou une salade de pommes de terre tièdes à la moutarde ; quelque chose qui recueille la sauce.</p>';
    },
  },

  {
    id: 'poitrines-de-poulet',
    nom: 'Poitrines de poulet',
    categorie: 'volaille',
    emoji: '🤍',
    description: 'Saisies puis finies en douceur, l’anti-semelle',
    perissable: 'volaille',
    poids: { min: 250, max: 1000, defaut: 500, indication: 'Deux poitrines désossées font environ 500 g.' },
    cuissons: [
      { id: 'juteuse', nom: 'Juteuses', retrait: 71, coeur: 74, note: 'le seuil de sécurité atteint sans un degré de trop' },
    ],
    intro(ctx) {
      return '<p>La poitrine n’a ni gras ni collagène pour la défendre : chaque degré au-delà de 74 °C lui coûte des jus qu’elle ne rendra pas. La méthode douce — saisir une face, retourner, couvrir, feu au plus bas — la mène à la cible sans jamais la brutaliser. Le gril à feu vif du début à la fin, si répandu, est la fabrique officielle de la semelle de botte : ce qu’on y gagne en quadrillage, on le perd deux fois en moelleux.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut les poitrines (' + Moteur.poids(ctx.poids) + '), du gros sel, du poivre, un peu d’huile et de beurre, et un couvercle qui ferme bien votre poêle — à défaut, une plaque à biscuits posée dessus fait le même office. Citron, câpres ou estragon, selon l’humeur, pour la sauce.</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Salage à sec', duree: 5, dureeTexte: '5 min, puis une nuit au frigo', texte:
          'Salez de ' + doseSel(ctx.poids, 0.9) + ' et réfrigérez à découvert. Pour cette pièce fragile entre toutes, le salage de la veille n’est pas un raffinement, c’est une bouée : il retient les jus que la cuisson voudra chasser. Aplatissez au besoin la partie la plus épaisse sous la paume, pour égaliser.' },
        { quand: 'jour', titre: 'Tempérage', duree: 20, dureeTexte: '20 min', texte:
          'Vingt minutes hors du froid, un épongeage, du poivre.' },
        { quand: 'jour', titre: 'Saisie d’une seule face', duree: 4, dureeTexte: '3 à 4 min', texte:
          'Poêle à feu moyen-vif, huile et une noix de beurre : posez les poitrines côté bombé et laissez dorer sans y toucher, jusqu’à un blond franc.' },
        { quand: 'jour', titre: 'Couvercle et feu doux', duree: 12, dureeTexte: '8 à 12 min', critique: true, texte:
          'Retournez, baissez le feu au minimum, couvrez, et laissez la chaleur douce finir le travail. Retirez à ' + ctx.cuisson.retrait + ' °C au cœur du plus épais' + (ctx.equip.thermometre ? '' : ' — la chair doit être ferme mais céder sous le doigt, opaque jusqu’au centre, les jus parfaitement clairs') + ' : le repos couvert portera la pièce aux 74 °C réglementaires. C’est l’étape de la retenue ; ouvrir, pousser le feu, prolonger « pour être sûr », voilà comment meurent les poitrines.' },
        { quand: 'jour', titre: 'Repos couvert', duree: 6, dureeTexte: '5 à 6 min', texte:
          'Hors du feu, couvercle en place : la température finit sa montée jusqu’à la cible, les jus se calment. Tranchez ensuite en biseau, contre le grain.' },
      ];
    },
    sauce(ctx) {
      return '<p>Le fond de poêle, doré et beurré, se déglace au jus de citron et au bouillon ; une poignée de câpres ou de l’estragon ciselé, une noix de beurre froide, les jus du repos — et cette pièce réputée ennuyante se découvre une vie intérieure.</p>';
    },
    conservation() {
      return '<p>Trois jours au réfrigérateur. Froide et tranchée, la poitrine fait le meilleur des sandwichs et des salades ; réchauffée, faites-le dans un fond de bouillon couvert, à feu très doux, jamais plus de quelques minutes.</p>';
    },
    accompagnement() {
      return '<p>Un orzo au citron, ou des légumes verts sautés à l’ail ; la poitrine aime les entourages vifs qui compensent sa réserve.</p>';
    },
  },

  {
    id: 'magret-de-canard',
    nom: 'Magret de canard',
    categorie: 'volaille',
    emoji: '🦆',
    description: 'Départ à froid côté gras, servi rosé',
    perissable: 'volaille',
    poids: { min: 250, max: 800, defaut: 375, indication: 'Un magret du Lac Brome fait 350 à 400 g et nourrit deux personnes.' },
    cuissons: [
      { id: 'rose', nom: 'Rosé', retrait: 52, coeur: 56, note: 'la tradition des chefs : le magret se traite en viande rouge' },
      { id: 'a-point', nom: 'À point', retrait: 57, coeur: 61, note: 'rose pâle, plus ferme' },
      { id: 'officiel', nom: 'Norme officielle', retrait: 71, coeur: 74, note: 'le seuil volaille de Santé Canada — chair grise et compacte' },
    ],
    intro(ctx) {
      return '<p>Le magret se cuit comme il s’élève : lentement côté gras, brièvement côté chair. Le départ dans une poêle froide laisse fondre l’épaisse couche de gras avant que la peau ne colore ; parti dans une poêle chaude, le gras brûle dehors et reste cru dedans. Un mot franc sur la température : Santé Canada classe le canard avec la volaille, à 74 °C ; la tradition culinaire le sert rosé à 56 °C, comme un bœuf, et c’est ainsi qu’il est bon. Le risque, faible sur une pièce entière saisie en surface, n’est pas nul — femmes enceintes et personnes immunodéprimées s’en tiendront à la norme, les autres choisiront en connaissance de cause.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut le magret de ' + Moteur.poids(ctx.poids) + ', du gros sel, du poivre, et pour la sauce une orange ou deux cuillères à soupe de sirop d’érable, un trait de vinaigre de cidre et un fond de bouillon. Aucune matière grasse : le magret apporte la sienne, et au-delà.</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'veille', titre: 'Quadrillage et salage', duree: 8, dureeTexte: '8 min, puis une nuit au frigo', texte:
          'Entaillez le gras en croisillons serrés, jusqu’à la chair mais sans jamais l’entamer — chaque losange est une porte de sortie pour le gras. Salez de ' + doseSel(ctx.poids) + ', surtout côté gras, et laissez au réfrigérateur à découvert jusqu’au lendemain.' },
        { quand: 'jour', titre: 'Départ dans la poêle froide', duree: 3, dureeTexte: '3 min', texte:
          'Épongez, poivrez côté chair. Posez le magret gras dessous dans une poêle froide et sèche, et allumez à feu moyen-doux.' },
        { quand: 'jour', titre: 'La fonte du gras', duree: 12, dureeTexte: '10 à 14 min', critique: true, texte:
          'Le gras chante doucement et fond en nappe ; videz-le dans un pot à mesure qu’il s’accumule — c’est de l’or, on y revient. La peau doit finir acajou et rigide, réduite au tiers de son épaisseur. Monter le feu par impatience est LA façon de rater un magret : peau carbonisée, gras intact, chair crue. La patience, ici, sent la châtaigne grillée.' },
        { quand: 'jour', titre: 'Côté chair, brièvement', duree: 4, dureeTexte: '2 à 4 min', texte:
          'Retournez, feu moyen, et menez la pièce à ' + ctx.cuisson.retrait + ' °C à cœur' + (ctx.equip.thermometre ? ', sonde par le côté au plus épais' : ' — au toucher, un rosé se prend comme un bifteck saignant-plus, souple avec un ressort net') + '. Le repos conduira aux ' + ctx.cuisson.coeur + ' °C (' + ctx.cuisson.note + ').' },
        { quand: 'jour', titre: 'Repos', duree: 8, dureeTexte: '7 à 8 min', texte:
          'Peau vers le haut, sans couvrir, sur une planche tiède. Le magret tranché sans repos pleure tout son rosé sur la planche.' },
        { quand: 'jour', titre: 'Tranchage', duree: 3, dureeTexte: '3 min', texte:
          'En tranches d’un demi-centimètre, en biseau, perpendiculaires à la longueur. Éventail rosé, lisière acajou : c’est l’image de la réussite.' },
      ];
    },
    sauce(ctx) {
      return '<p>Videz le gras de la poêle — sans la rincer —, déglacez au jus d’orange ou au sirop d’érable et au vinaigre, grattez les sucs, réduisez au sirupeux, allongez du bouillon et des jus de repos. L’aigre-doux et le canard sont un vieux ménage heureux. Quant au gras recueilli, filtré dans un pot au frigo, il se garde des mois et fait les meilleures patates rôties du monde connu.</p>';
    },
    conservation() {
      return '<p>Trois jours au réfrigérateur. Le magret se réchauffe mal — servez plutôt les tranches froides, à peine sorties d’avance, sur une salade aux noix et à l’orange.</p>';
    },
    accompagnement() {
      return '<p>Patates sarladaises — rôties dans son propre gras avec de l’ail —, ou une purée de courge, et quelque chose d’amer ou d’acide en verdure.</p>';
    },
  },

  {
    id: 'dinde-entiere',
    nom: 'Dinde entière',
    categorie: 'volaille',
    emoji: '🦃',
    description: 'La pièce des Fêtes, planifiée sur plusieurs jours',
    perissable: 'volaille',
    poids: { min: 4000, max: 12000, defaut: 6000, indication: 'Comptez environ 500 g brut par personne, restes compris — et désirés.' },
    cuissons: [
      { id: 'rotie', nom: 'Rôtie', retrait: null, coeur: '82 / 74', note: 'cuisse 82 °C, poitrine 74 °C — jus clairs, cuisse qui se déhanche' },
    ],
    intro(ctx) {
      const joursDecongelation = Math.ceil(ctx.poids / 2000);
      return '<p>Une dinde se gagne au calendrier avant de se gagner au four. Congelée, elle exige ' + joursDecongelation + ' jour' + (joursDecongelation > 1 ? 's' : '') + ' pleins de dégel au réfrigérateur pour son poids — jamais sur le comptoir, où la surface passe des heures en zone dangereuse pendant que le cœur dégèle. Deux mots encore de franchise : la farce dans la cavité, si chère à la tradition, oblige à surcuire toute la bête pour que le centre de la farce atteigne 74 °C — cuisez la farce à part, dans son plat, arrosée du jus ; et l’arrosage aux quinze minutes, qui ouvre le four sans relâche, allonge la cuisson sans rien donner en retour.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut la dinde de ' + Moteur.poids(ctx.poids) + ', beaucoup de gros sel, du beurre mou, poivre, thym et laurier, deux oignons et deux carottes pour le fond du plat, et un litre de bouillon de poulet. Le thermomètre à sonde est, pour cette pièce, presque obligatoire' + (ctx.equip.thermometre ? ' — vous l’avez, tant mieux.' : ' : si un seul achat de cuisine devait suivre cette recette, ce serait lui, une dinde se joue à quelques degrés près.') + '</p>';
    },
    etapes(ctx) {
      const joursDecongelation = Math.ceil(ctx.poids / 2000);
      const [rMin, rMax] = parKg(ctx.poids, 32, 40);
      return [
        { quand: { joursAvant: joursDecongelation + 2 }, titre: 'Le dégel au réfrigérateur', duree: 10, dureeTexte: joursDecongelation + ' jour' + (joursDecongelation > 1 ? 's' : ''), texte:
          'Si la dinde est congelée, installez-la dans un plat à rebords au bas du réfrigérateur, dans son emballage, et comptez un jour par deux kilos. Une dinde encore glacée aux articulations le matin du repas est un naufrage sans remède — prenez de l’avance, elle patiente sans mal un jour de plus au froid.' },
        { quand: { joursAvant: 2 }, titre: 'Salage à sec, deux jours devant', duree: 15, dureeTexte: '15 min, puis 48 h au frigo', texte:
          'Retirez les abats de la cavité (réservez cou et gésier pour le bouillon de sauce), épongez partout. Massez la bête de ' + doseSel(ctx.poids, 0.8) + ', un peu sous la peau des poitrines, et laissez-la à découvert sur la grille du réfrigérateur deux jours entiers. Sur une masse pareille, le sel a besoin de ce temps pour voyager ; la peau, elle, sèche en parchemin doré d’avance.' },
        { quand: 'jour', titre: 'Tempérage et mise en place', duree: 90, dureeTexte: '1 h 30', texte:
          'Sortez la dinde une heure et demie avant le four. Beurrez toute la peau, poivrez, thym et demi-oignon dans la cavité — rien de plus. Oignons et carottes en gros morceaux dans le fond du plat, la dinde posée dessus' + (ctx.equip.grille ? ' ou sur la grille' : '') + ', un verre d’eau au fond pour protéger les sucs.' },
        { quand: 'jour', titre: 'Le rôtissage', duree: rMax, dureeTexte: Moteur.plage(rMin, rMax), critique: true, texte:
          'Four à 160 °C, cuisses vers le fond. Visez 82 °C au creux de la cuisse et 74 °C au plus épais de la poitrine, sonde loin des os. Quand la poitrine prend de l’avance — c’est sa nature —, coiffez-la d’aluminium et laissez les cuisses finir. Les jus piqués à la jointure doivent couler clairs. Une seule règle absolue : sur la volaille, 74 °C partout, sans marchandage. La fenêtre affichée reste une estimation ; c’est la sonde qui décide de l’heure du repas, prévoyez du jeu.' },
        { quand: 'jour', titre: 'Le grand repos', duree: 40, dureeTexte: '30 à 45 min', texte:
          'Sur la planche, sous une tente d’aluminium lâche. Une masse pareille garde sa chaleur bien au-delà de quarante minutes, et ce repos-là décide de chaque tranche : servez-la sans lui et la poitrine s’éponge sur la planche. C’est le temps exact qu’il faut à la sauce.' },
        { quand: 'jour', titre: 'La découpe', duree: 15, dureeTexte: '15 min', texte:
          'Cuisses d’abord, détachées à la jointure et séparées en pilon et haut ; poitrines levées entières le long du bréchet, puis tranchées épais, contre le grain. La carcasse part au bouillon, jamais aux ordures.' },
      ];
    },
    sauce(ctx) {
      return '<p>Pendant le rôtissage, faites frémir cou et gésier dans le bouillon une heure : voilà votre fond. À la sortie de la dinde, dégraissez le plat en gardant trois cuillères à soupe de gras, singez de trois cuillères de farine sur le feu, mouillez du fond chaud en fouettant, écrasez les légumes confits, laissez épaissir dix minutes et passez. Les jus du grand repos entrent en dernier. C’est la sauce dont on se souvient en janvier.</p>';
    },
    conservation() {
      return '<p>Quatre jours au réfrigérateur, chair désossée et sauce à part ; trois mois au congélateur en portions arrosées de sauce. Réchauffez toujours dans la sauce ou le bouillon, à couvert et doucement — la dinde réchauffée à sec a fait plus de tort aux Fêtes que les chicanes de famille.</p>';
    },
    accompagnement() {
      return '<p>La farce cuite à part et dorée, une purée, des atocas maison à peine sucrés — leur acidité est la respiration du repas — et un légume vert pour la conscience.</p>';
    },
  },

  /* ===================== AGNEAU ===================== */

  {
    id: 'gigot-agneau',
    nom: 'Gigot d’agneau',
    categorie: 'agneau',
    emoji: '🐑',
    description: 'Rôti rosé, ail et romarin, sauce déglacée',
    perissable: 'viande',
    poids: { min: 1500, max: 3500, defaut: 2200, indication: 'Un gigot raccourci de 2 à 2,5 kg nourrit six personnes.' },
    cuissons: [
      { id: 'rose', nom: 'Rosé', retrait: 54, coeur: 58, note: 'rose franc, juteux — l’école classique du gigot' },
      { id: 'a-point', nom: 'À point', retrait: 58, coeur: 62, note: 'rose pâle, plus sage' },
    ],
    intro(ctx) {
      return '<p>Le gigot se rôtit entier et se sert rosé : c’est une pièce noble qui n’a besoin que d’ail, de romarin et d’un four maîtrisé. Le départ à four vif saisit la surface, puis la chaleur douce mène le cœur sans brutalité — l’inverse du four fort en continu, qui donne un gigot cerné de gris. Sa forme fuselée est une chance : la souris et les extrémités seront plus cuites, le cœur rosé, et chacun autour de la table y trouvera sa tranche.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut le gigot de ' + Moteur.poids(ctx.poids) + ', quatre gousses d’ail en éclats, deux branches de romarin — le thym ou la sarriette le remplacent honorablement —, du gros sel, du poivre, de l’huile d’olive, et un verre de vin blanc ou de bouillon pour la sauce.</p>';
    },
    etapes(ctx) {
      const [rMin, rMax] = parKg(ctx.poids, 25, 35, 15);
      return [
        { quand: 'veille', titre: 'Salage à sec et aromates', duree: 10, dureeTexte: '10 min, puis une nuit au frigo', texte:
          'Piquez le gigot d’incisions profondes et glissez-y les éclats d’ail et les aiguilles de romarin. Massez-le de ' + doseSel(ctx.poids) + ' et laissez-le à découvert au réfrigérateur jusqu’au lendemain : sur une pièce de cette épaisseur, seul le temps porte le sel — et l’ail — jusqu’au cœur.' },
        { quand: 'jour', titre: 'Tempérage', duree: 75, dureeTexte: '1 h à 1 h 30', texte:
          'Sortez le gigot bien d’avance : un cœur à 15 °C au départ cuit plus vite et plus également qu’un cœur à 4. Huilez, poivrez.' },
        { quand: 'jour', titre: 'Saisie au four vif', duree: 15, dureeTexte: '15 min', texte:
          'Four à 220 °C, le gigot dans son plat côté bombé vers le haut : quinze minutes pour dorer la surface et lancer les sucs.' },
        { quand: 'jour', titre: 'La chaleur douce', duree: rMax, dureeTexte: Moteur.plage(rMin, rMax), critique: true, texte:
          'Baissez à 160 °C sans ouvrir. Retirez à ' + ctx.cuisson.retrait + ' °C au cœur de la partie la plus épaisse' + (ctx.equip.thermometre ? ', sonde loin de l’os' : ' — au toucher, la chair rosée garde un ressort net, et les premières gouttes piquées sortent rose clair') + ' ; le repos conduira aux ' + ctx.cuisson.coeur + ' °C (' + ctx.cuisson.note + '). L’os fausse la mesure et le gigot continue de cuire fort au repos : mieux vaut retirer un degré trop tôt qu’un degré trop tard.' },
        { quand: 'jour', titre: 'Repos', duree: 20, dureeTexte: '20 min', texte:
          'Sous l’aluminium lâche, sur la planche creusée. Un gigot sans repos pleure son rosé au premier coup de couteau.' },
        { quand: 'jour', titre: 'Tranchage', duree: 8, dureeTexte: '8 min', texte:
          'Tenez l’os du manche — un linge aide —, et tranchez perpendiculairement à l’os, en tranches fines, en tournant autour. Servez sur des assiettes chaudes : le gras d’agneau fige vite, c’est son seul défaut.' },
      ];
    },
    sauce(ctx) {
      return '<p>Le plat déglacé au vin blanc, gratté de tous ses sucs, réduit avec une branche de romarin, allongé des jus du repos et monté d’une noix de beurre : le gigot n’en demande pas plus. La gelée de menthe des uns et l’ail confit des autres sont affaire de chapelle — les deux se défendent.</p>';
    },
    conservation() {
      return '<p>Trois à quatre jours au réfrigérateur. Le gigot froid tranché mince vaut le meilleur rosbif ; réchauffé, faites-le dans la sauce à feu doux. L’os et les parures font un bouillon qui transforme un couscous.</p>';
    },
    accompagnement() {
      return '<p>Flageolets ou haricots blancs à l’ail, patates boulangères cuites sous le gigot dans son jus, et la salade la plus simple.</p>';
    },
  },

  /* ===================== POISSONS ===================== */

  {
    id: 'filet-de-saumon',
    nom: 'Filet de saumon',
    categorie: 'poisson',
    emoji: '🐟',
    description: 'Four doux et nacre fondante, ou peau croustillante',
    perissable: 'poisson',
    poids: { min: 200, max: 1200, defaut: 600, indication: 'Comptez 150 à 180 g par personne.' },
    cuissons: [
      { id: 'nacre', nom: 'Mi-cuit nacré', retrait: 46, coeur: 49, note: 'cœur nacré, fondant — l’école des restaurants' },
      { id: 'a-point', nom: 'À point', retrait: 52, coeur: 55, note: 'opaque mais juteux, se défait en feuillets' },
      { id: 'officiel', nom: 'Norme officielle', retrait: 68, coeur: 70, note: 'le 70 °C de Santé Canada — sec, disons-le' },
    ],
    intro(ctx) {
      return '<p>Le saumon est cuit bien avant qu’on ne le croie : à 49 °C à cœur il est nacré et fondant, à 55 il se défait en feuillets juteux, à 70 — la norme officielle — il a rendu les armes et son gras perle en écume blanche à la surface. Cette albumine blanche est d’ailleurs votre témoin : dès qu’elle paraît en quantité, vous avez dépassé. Un mot de franchise : sous 70 °C, on s’en remet à la qualité et à la fraîcheur du poisson ; achetez-le chez un poissonnier qui a réponse à vos questions, et les personnes vulnérables s’en tiendront à la norme. Le four très doux est ici supérieur à la poêle vive pour l’uniformité ; la poêle garde l’avantage de la peau croustillante — je vous donne le four, le plus sûr des deux chemins.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut le filet de ' + Moteur.poids(ctx.poids) + ', du sel fin, un filet d’huile d’olive, et un citron. Passez les doigts à rebrousse-poil sur la chair : les arêtes qui pointent se retirent à la pince à sourcils. La saumure éclair remplace ici le salage de la veille — le sel d’une nuit raidirait la chair du poisson comme un début de gravlax, ce qui est un autre plat.</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'jour', titre: 'Saumure éclair', duree: 30, dureeTexte: '30 min', texte:
          'Trente minutes avant le four, salez le filet de sel fin sur toute la chair et rendez-le au réfrigérateur. Ce court salage assaisonne, raffermit juste ce qu’il faut et limite l’albumine blanche — c’est la version poisson du salage de la veille, ramenée à l’échelle d’une chair fragile.' },
        { quand: 'jour', titre: 'Four très doux', duree: 5, dureeTexte: '5 min', texte:
          'Four à 120 °C. Épongez le filet, huilez-le, posez-le peau dessous dans un plat' + (ctx.equip.parchemin ? ' sur papier parchemin' : '') + '.' },
        { quand: 'jour', titre: 'La cuisson qui n’en a pas l’air', duree: 22, dureeTexte: '15 à 25 min selon l’épaisseur', critique: true, texte:
          'Enfournez. Rien ne grésille, rien ne dore — c’est normal, et c’est le secret. Retirez à ' + ctx.cuisson.retrait + ' °C au cœur du plus épais' + (ctx.equip.thermometre ? '' : ' — la lame d’un couteau glissée au cœur dix secondes doit ressortir tiède, non chaude, et la chair se détacher en feuillets sous une pression douce') + ' ; la chaleur résiduelle mènera aux ' + ctx.cuisson.coeur + ' °C (' + ctx.cuisson.note + '). Le poisson passe de parfait à sec en trois minutes : restez dans la cuisine.' },
        { quand: 'jour', titre: 'Repos bref', duree: 4, dureeTexte: '3 à 5 min', texte:
          'Sur le plat, hors du four, sans couvrir. Le poisson demande un repos court — sa chaleur résiduelle est brève, servez sur assiettes tièdes.' },
      ];
    },
    sauce(ctx) {
      return '<p>Le saumon au four doux ne fait pas de sucs — il n’en a pas besoin, mais ne perdez pas pour autant les jus du plat : un beurre blanc paresseux les recueille. Faites réduire deux cuillères à soupe de jus de citron avec une échalote ciselée, puis fouettez-y hors du feu une grosse noix de beurre froid en dés et les jus du plat : c’est fait en cinq minutes et cela habille le poisson sans le couvrir.</p>';
    },
    conservation() {
      return '<p>Deux jours au réfrigérateur, pas davantage — le poisson cuit vieillit vite. Ne le réchauffez pas : émietté froid sur une salade, des pâtes citronnées ou un bagel, il se réinvente mieux qu’il ne se répète.</p>';
    },
    accompagnement() {
      return '<p>Des pommes de terre vapeur écrasées à l’huile d’olive et à l’aneth, des asperges ou des haricots à peine cuits, et le citron en quartiers.</p>';
    },
  },

  {
    id: 'poisson-blanc',
    nom: 'Poisson blanc (morue, aiglefin)',
    categorie: 'poisson',
    emoji: '🎣',
    description: 'Au four, beurre citronné, feuilleté et nacré',
    perissable: 'poisson',
    poids: { min: 200, max: 1000, defaut: 500, indication: 'Comptez 150 à 180 g par personne. Frais ou décongelé une nuit au frigo.' },
    cuissons: [
      { id: 'feuillete', nom: 'Nacré, en feuillets', retrait: 52, coeur: 55, note: 'opaque, se sépare en feuillets brillants' },
    ],
    intro(ctx) {
      return '<p>La morue et l’aiglefin sont des chairs maigres et délicates qui ne demandent au four qu’une chose : la douceur. À 55 °C à cœur, les feuillets se séparent, nacrés et brillants ; dix degrés de plus et ils s’émiettent en ouate sèche. La poêle vive, séduisante sur le papier, malmène ces filets fragiles qui se brisent au retournement — le four à chaleur modérée, sous un beurre citronné, les respecte de bout en bout.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut les filets (' + Moteur.poids(ctx.poids) + '), du sel fin, du beurre, un citron, et si le garde-manger le permet une échalote et un peu de persil ou de ciboulette. Un filet encore un peu givré au centre fausserait toute la cuisson : décongelez la veille au réfrigérateur, jamais sous l’eau chaude.</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'jour', titre: 'Salage bref', duree: 20, dureeTexte: '20 min', texte:
          'Salez les filets de sel fin et rendez-les vingt minutes au réfrigérateur : la chair se raffermit et tiendra mieux au service.' },
        { quand: 'jour', titre: 'Le beurre citronné', duree: 5, dureeTexte: '5 min', texte:
          'Four à 190 °C. Fondez une grosse noix de beurre avec le jus d’un demi-citron et l’échalote ciselée. Épongez les filets, rangez-les dans un plat beurré, parties minces repliées dessous pour égaliser l’épaisseur, et nappez du beurre citronné.' },
        { quand: 'jour', titre: 'Cuisson douce au four', duree: 12, dureeTexte: '10 à 14 min', critique: true, texte:
          'Enfournez et surveillez dès la dixième minute. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur' + (ctx.equip.thermometre ? '' : ' — la chair devient tout juste opaque et se sépare en feuillets sous la fourchette, sans forcer') + ' ; la chaleur du plat finira la course vers ' + ctx.cuisson.coeur + ' °C. Le poisson blanc ne prévient pas : une minute il résiste, la suivante il s’émiette. La cuillère de trop n’existe pas ici, seule la minute de trop.' },
        { quand: 'jour', titre: 'Service immédiat', duree: 3, dureeTexte: '3 min', texte:
          'Deux minutes de repos dans le plat, pas plus, et servez à la pelle à poisson sur assiettes chaudes, arrosé du beurre du plat et de persil ciselé.' },
      ];
    },
    sauce() {
      return '<p>La sauce est déjà dans le plat : le beurre citronné, enrichi des jus laiteux du poisson, se verse à la cuillère. Ne le laissez pas au fond du plat — il est le liant du repas, sur le poisson comme sur les pommes de terre.</p>';
    },
    conservation() {
      return '<p>Deux jours au réfrigérateur au grand maximum. Froid et émietté, il fait des croquettes de poisson dominicales — lié de purée, pané, doré au beurre — qui valent presque le plat premier.</p>';
    },
    accompagnement() {
      return '<p>Pommes de terre vapeur, petits pois au beurre, et un trait de citron frais. La sobriété est ici une politesse envers le poisson.</p>';
    },
  },

  {
    id: 'petoncles',
    nom: 'Gros pétoncles',
    categorie: 'poisson',
    emoji: '🥟',
    description: 'Saisie éclair, croûte dorée, cœur nacré',
    perissable: 'poisson',
    poids: { min: 150, max: 600, defaut: 300, indication: 'Six gros pétoncles (calibre U-10 ou U-15) font environ 300 g, pour deux en plat principal.' },
    cuissons: [
      { id: 'nacre', nom: 'Cœur nacré', retrait: 46, coeur: 49, note: 'doré dehors, tout juste opaque et soyeux dedans' },
    ],
    intro(ctx) {
      return '<p>Le pétoncle se joue en moins de quatre minutes et se perd en trente secondes. Deux conditions décident de tout avant même d’allumer le feu : des pétoncles « secs », non traités — ceux gonflés aux phosphates rendent une eau laiteuse et refusent obstinément de dorer, demandez-le franchement au poissonnier — et une surface épongée jusqu’à la dernière goutte. Le reste est affaire de courage : une poêle réellement brûlante, et la retenue de ne pas y toucher.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut les pétoncles (' + Moteur.poids(ctx.poids) + '), débarrassés du petit muscle latéral coriace (il se pince et se tire), du sel fin, une huile qui tolère le feu vif, du beurre et un demi-citron. '
        + (ctx.equip.fonte ? 'Le poêlon de fonte est parfait — bien chauffé d’avance.' : 'Prenez votre poêle la plus lourde et donnez-lui trois vraies minutes de préchauffage.')
        + '</p>';
    },
    etapes(ctx) {
      return [
        { quand: 'jour', titre: 'Séchage obstiné', duree: 15, dureeTexte: '15 min', texte:
          'Épongez les pétoncles, posez-les sur un papier absorbant au réfrigérateur quinze minutes, épongez encore. Salez juste avant la poêle. L’eau est l’ennemie : un pétoncle humide bout, blanchit et durcit sans jamais dorer.' },
        { quand: 'jour', titre: 'La poêle brûlante', duree: 3, dureeTexte: '3 min', texte:
          'Feu vif, un film d’huile, jusqu’au premier voile de fumée. Pas avant.' },
        { quand: 'jour', titre: 'Saisie sans y toucher', duree: 4, dureeTexte: '3 à 4 min en tout', critique: true, texte:
          'Déposez les pétoncles face plate dessous, sans qu’ils se touchent, et n’y touchez plus : quatre-vingt-dix secondes à deux minutes, jusqu’à ce qu’ils se décollent d’eux-mêmes, ourlés d’une croûte caramel. Retournez, une noix de beurre, et trente à soixante secondes de l’autre côté en arrosant. Retirez à ' + ctx.cuisson.retrait + ' °C à cœur' + (ctx.equip.thermometre ? ' si votre sonde est fine, sinon' : ' —') + ' au toucher : souple comme le gras du pouce, tout juste opaque à mi-hauteur. Trente secondes de trop et c’est de la gomme à effacer — c’est l’étape couperet.' },
        { quand: 'jour', titre: 'Service dans la minute', duree: 2, dureeTexte: '2 min', texte:
          'Pas de repos pour les pétoncles : la chaleur résiduelle achève le cœur vers ' + ctx.cuisson.coeur + ' °C pendant le trajet vers la table. Assiettes chaudes, obligatoirement.' },
      ];
    },
    sauce(ctx) {
      return '<p>Dans la poêle éteinte, le beurre bruni qui reste est déjà une sauce : un trait de citron pour le faire chanter, une cuillère d’eau pour le détendre, et versez sur les pétoncles. Rien d’autre ; les sucs d’un pétoncle sont trop précieux et trop rares pour être noyés.</p>';
    },
    conservation() {
      return '<p>À vrai dire, il ne devrait pas y avoir de restes. S’il y en a, un jour au réfrigérateur, et froids sur une salade — réchauffés, ils finissent en caoutchouc, ce serait leur faire injure.</p>';
    },
    accompagnement() {
      return '<p>Une purée de chou-fleur ou de panais très lisse, quelques pousses citronnées, et un pain qui essuie le beurre noisette.</p>';
    },
  },

  /* ===================== LÉGUMES ===================== */

  {
    id: 'chou-fleur-entier',
    nom: 'Chou-fleur entier rôti',
    categorie: 'legume',
    emoji: '🥦',
    description: 'Rôti entier, beurre épicé, cœur fondant',
    perissable: 'legume',
    poids: { min: 600, max: 1800, defaut: 1000, indication: 'Un chou-fleur moyen fait environ 1 kg et sert quatre personnes en accompagnement.' },
    cuissons: [
      { id: 'fondant', nom: 'Fondant à cœur', retrait: null, coeur: 'au couteau', note: 'la lame entre jusqu’au trognon sans résistance' },
    ],
    intro(ctx) {
      return '<p>Rôti entier, le chou-fleur devient un plat de résistance : croûte dorée aux épices, cœur crémeux qui se tranche comme un rôti. Ici, pas de température chiffrée — les légumes ne se sondent pas en degrés mais à la lame : le couteau doit entrer jusqu’au trognon sans rencontrer de résistance. Le blanchiment préalable, que certains prêchent, ramollit la fleur et mouille ce que le four devra ensuite sécher ; le four seul, plus long, garde le grain et concentre le goût.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut le chou-fleur de ' + Moteur.poids(ctx.poids) + ', débarrassé de ses feuilles et du pied taillé à ras pour qu’il s’assoie bien, 60 g de beurre mou — ou d’huile d’olive —, du sel, du paprika fumé, du cumin et une pointe de cayenne, tous remplaçables par ce que votre tiroir à épices propose : cari, zaatar, ou simplement poivre et ail.</p>';
    },
    etapes(ctx) {
      const [rMin, rMax] = parKg(ctx.poids, 55, 75);
      return [
        { quand: 'jour', titre: 'Le beurre d’épices', duree: 10, dureeTexte: '10 min', texte:
          'Four à 200 °C. Mélangez le beurre mou, une cuillère à thé de sel et les épices, et massez-en le chou-fleur partout, en insistant pour faire pénétrer entre les fleurons.' },
        { quand: 'jour', titre: 'Le rôtissage entier', duree: rMax, dureeTexte: Moteur.plage(rMin, rMax), critique: true, texte:
          'Posez-le dans un plat ou une poêle allant au four et enfournez sans couvrir. La patience est l’épreuve : à mi-chemin il semblera doré et prêt, mais le cœur sera encore crayeux — c’est le piège classique. Poursuivez jusqu’à ce qu’une lame fine glissée au centre, jusqu’au trognon, entre sans aucune résistance et ressorte chaude. La croûte doit être brun profond par endroits ; le presque-brûlé des pointes est un goût, pas un accident.' },
        { quand: 'jour', titre: 'Repos court et découpe', duree: 5, dureeTexte: '5 min', texte:
          'Cinq minutes de repos pour que la vapeur interne se calme, puis tranchez en quartiers ou en tranches épaisses, comme un rôti, en arrosant du beurre du plat.' },
      ];
    },
    sauce(ctx) {
      return '<p>Le beurre d’épices tombé au fond du plat est la sauce : détendez-le d’un jus de citron et versez-le sur les tranches. Une cuillère de yogourt nature ou de tahini délayé au citron l’accompagne à merveille et rafraîchit les épices.</p>';
    },
    conservation() {
      return '<p>Trois jours au réfrigérateur. Réchauffez au four à 190 °C, à sec, une dizaine de minutes — le micro-ondes le rend spongieux. Les restes, écrasés à la fourchette avec un œuf et de la chapelure, font d’excellentes galettes dorées à la poêle.</p>';
    },
    accompagnement() {
      return '<p>En plat principal, un grain — riz, freekeh, couscous israélien —, des herbes fraîches à pleines mains et le yogourt citronné. En accompagnement, il escorte sans complexe un gigot ou un poulet rôti.</p>';
    },
  },

  {
    id: 'legumes-racines',
    nom: 'Légumes-racines rôtis',
    categorie: 'legume',
    emoji: '🥕',
    description: 'Carottes, panais, betteraves — caramel et fondant',
    perissable: 'legume',
    poids: { min: 400, max: 2500, defaut: 1000, indication: 'Un kilo de légumes mêlés sert quatre personnes en accompagnement.' },
    cuissons: [
      { id: 'caramelise', nom: 'Caramélisés', retrait: null, coeur: 'au couteau', note: 'bords bruns caramel, la lame entre sans résistance' },
    ],
    intro(ctx) {
      return '<p>Rôtir des légumes-racines n’a qu’une seule règle qui compte : leur laisser de la place. Les entasser sur la plaque, c’est les condamner à cuire à la vapeur de leurs voisins — mous, pâles, tristes. Une seule couche, des morceaux égaux, un four franc, et le sucre des racines caramélise en bords bruns pendant que le cœur fond. Comme pour tout légume, pas de degrés à viser : la lame du couteau est le seul thermomètre.</p>';
    },
    besoins(ctx) {
      return '<p>Il vous faut environ ' + Moteur.poids(ctx.poids) + ' de racines mêlées — carottes, panais, betteraves, navets, patates douces, ce que le frigo offre —, de l’huile d’olive ou du gras de canard si votre pot en garde, du gros sel, du poivre, et du thym ou du romarin. Les betteraves teignent tout ce qu’elles touchent : donnez-leur leur coin de plaque, ou leur plaque à elles.</p>';
    },
    etapes(ctx) {
      const grandePlaque = ctx.poids > 1200;
      return [
        { quand: 'jour', titre: 'La coupe égale', duree: 15, dureeTexte: '15 min', texte:
          'Four à 205 °C, plaque' + (grandePlaque ? 's' : '') + ' à l’intérieur pour préchauffer. Pelez et taillez tout en morceaux du même calibre — de la grosseur d’un bouchon de liège : c’est l’égalité de la coupe qui fait l’égalité de la cuisson. Huilez généreusement dans un bol, salez, poivrez.' },
        { quand: 'jour', titre: 'Une seule couche, faces coupées dessous', duree: 5, dureeTexte: '5 min', critique: true, texte:
          'Versez sur la plaque chaude — le grésillement immédiat est bon signe — et étalez en une seule couche, faces coupées contre le métal, sans que les morceaux se touchent trop. ' + (grandePlaque ? 'Pour ce poids, il faudra deux plaques : mieux vaut deux plaques aérées qu’une seule bondée, c’est ici que tout se décide. ' : 'Si la plaque déborde, retirez plutôt que de tasser — c’est ici que tout se décide. ') + 'Le thym s’ajoutera à mi-cuisson, entier ; mis trop tôt, il brûle.' },
        { quand: 'jour', titre: 'Le rôtissage', duree: 45, dureeTexte: '35 à 50 min', texte:
          'Enfournez. Ne remuez qu’une fois, à mi-cuisson, quand les faces d’appui sont déjà brunes — remuer trop tôt arrache la caramélisation naissante. C’est prêt quand la lame entre sans résistance dans les plus gros morceaux et que les bords sont d’un brun caramel qui embaume le sucre grillé.' },
        { quand: 'jour', titre: 'L’assaisonnement de sortie', duree: 3, dureeTexte: '3 min', texte:
          'À la sortie, un filet d’huile fraîche ou une noix de beurre, une pincée de fleur de sel, et si le cœur vous en dit un trait de vinaigre de cidre ou de sirop d’érable — l’acide et le sucre réveillent les racines.' },
      ];
    },
    sauce(ctx) {
      return '<p>Les sucs ici sont les petits fonds bruns collés à la plaque : déglacez-la encore chaude d’un trait d’eau ou de bouillon, grattez, et versez ce jus court sur les légumes — ou gardez-le pour la sauce de la viande qu’ils accompagnent. Une plaque rincée sans être déglacée, c’est du goût dans l’évier.</p>';
    },
    conservation() {
      return '<p>Quatre jours au réfrigérateur. Réchauffez au four ou à la poêle, à sec et assez fort pour raviver les bords — jamais au micro-ondes, qui les ramollit. Froids, en salade avec une vinaigrette moutardée et des noix, ils se suffisent.</p>';
    },
    accompagnement() {
      return '<p>Ils sont l’accompagnement — du poulet rôti, du gigot, de la longe. En plat principal, ajoutez un œuf mollet, du fromage en grains ou un yogourt à l’ail, et du pain grillé.</p>';
    },
  },

];
