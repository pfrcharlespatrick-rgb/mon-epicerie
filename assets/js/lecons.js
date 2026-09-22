/**
 * La Brigade — les parcours et les leçons.
 *
 * Même principe que `recettes.js` : tout le contenu tient ici, en clair. Ce que
 * l'élève accumule — leçons réussies, techniques acquises, portions choisies —
 * vit à côté, dans le navigateur, et n'est jamais écrasé quand une leçon est
 * corrigée.
 *
 * Le modèle d'une leçon
 * ---------------------
 *   chefId        le chef qui l'enseigne : sa voix et sa pédagogie colorent
 *                 toute la narration.
 *   gratuit       les leçons en libre accès, qui servent de démonstration.
 *   statut        'publiee', ou 'en-preparation' pour une leçon annoncée dont
 *                 le contenu n'est pas encore écrit.
 *   techniques    ce que la leçon fait acquérir ; c'est la monnaie de l'arbre
 *                 des techniques.
 *   conseilleApres  techniques qu'il vaut mieux posséder d'abord. Un conseil,
 *                 jamais un verrou : on ne bloque pas quelqu'un qui a payé.
 *   portions      le nombre pour lequel les quantités sont écrites ; tout se
 *                 remet à l'échelle à partir de là.
 *   ingredients   `cle` permet d'insérer la quantité mise à l'échelle dans la
 *                 narration : « Versez {{eau}} » devient « Versez 360 ml
 *                 d’eau », et « {{eau:q}} » donne « 360 ml » tout seul.
 *                 `rayon` place l'article au bon endroit dans la liste
 *                 d'épicerie ; `null` pour ce qu'on n'achète pas (l'eau).
 *   etapes        une étape = une scène de la capsule = un écran du mode
 *                 mains libres. `texte` est la consigne écrite ; `voix` est ce
 *                 que le chef dit, à la première personne. `minuterie` (en
 *                 minutes) propose un compte à rebours. `scene` choisit
 *                 l'illustration animée dans `scenes.js`.
 *   debrief       le mot du chef après l'auto-évaluation : réussi, ou à refaire.
 */

/** Les familles de techniques : les branches de l'arbre. */
export const FAMILLES = [
  { id: 'couteau', nom: 'Le couteau', emoji: '🔪' },
  { id: 'feu', nom: 'Le feu et la viande', emoji: '🔥' },
  { id: 'liquides', nom: 'Fonds, bouillons et sauces', emoji: '🍲' },
  { id: 'mesure', nom: 'La mesure et la température', emoji: '🌡️' },
  { id: 'pates', nom: 'Pâtes, pains et crèmes', emoji: '🥖' },
];

/** Chaque technique appartient à une famille et se gagne dans une leçon. */
export const TECHNIQUES = {
  'tenue-couteau': { nom: 'Tenir le couteau : pince et griffe', famille: 'couteau' },
  emincer: { nom: 'Émincer', famille: 'couteau' },
  ciseler: { nom: 'Ciseler un oignon et des herbes', famille: 'couteau' },
  julienne: { nom: 'Julienne et bâtonnets', famille: 'couteau' },
  brunoise: { nom: 'Brunoise', famille: 'couteau' },
  'soin-couteau': { nom: 'Entretenir la lame', famille: 'couteau' },

  'lire-la-poele': { nom: 'Lire la chaleur d’une poêle', famille: 'feu' },
  saisir: { nom: 'Saisir sans coller', famille: 'feu' },
  arroser: { nom: 'Arroser au beurre', famille: 'feu' },
  reposer: { nom: 'Laisser reposer la viande', famille: 'feu' },
  'saler-a-sec': { nom: 'Saler à sec la veille', famille: 'feu' },
  rotir: { nom: 'Rôtir une volaille entière', famille: 'feu' },
  decouper: { nom: 'Découper une volaille', famille: 'feu' },
  colorer: { nom: 'Colorer par petites quantités', famille: 'feu' },
  braiser: { nom: 'Braiser et mijoter', famille: 'feu' },
  'peau-croustillante': { nom: 'Peau croustillante', famille: 'feu' },
  'mi-cuit': { nom: 'Le mi-cuit', famille: 'feu' },

  'depart-a-froid': { nom: 'Le départ à froid', famille: 'liquides' },
  fremissement: { nom: 'Tenir un frémissement', famille: 'liquides' },
  ecumer: { nom: 'Écumer et dégraisser', famille: 'liquides' },
  mirepoix: { nom: 'La garniture aromatique', famille: 'liquides' },
  passer: { nom: 'Passer au chinois', famille: 'liquides' },
  'jus-de-cuisson': { nom: 'Déglacer et faire un jus', famille: 'liquides' },
  'laver-le-riz': { nom: 'Laver et tremper le riz', famille: 'liquides' },
  absorption: { nom: 'Cuisson par absorption', famille: 'liquides' },
  infusion: { nom: 'Infuser sans bouillir', famille: 'liquides' },
  emulsion: { nom: 'Monter une émulsion chaude', famille: 'liquides' },
  roux: { nom: 'Le roux brun', famille: 'liquides' },

  thermometre: { nom: 'Cuire au thermomètre', famille: 'mesure' },
  'refroidir-vite': { nom: 'Refroidir vite et conserver', famille: 'mesure' },
  peser: { nom: 'Peser plutôt que mesurer', famille: 'mesure' },
  'pourcentage-boulanger': { nom: 'Le pourcentage du boulanger', famille: 'mesure' },
  'temperer-oeufs': { nom: 'Tempérer les œufs', famille: 'mesure' },

  sablage: { nom: 'Sabler une pâte brisée', famille: 'pates' },
  abaisser: { nom: 'Abaisser et foncer', famille: 'pates' },
  farce: { nom: 'Lier une farce', famille: 'pates' },
  dorer: { nom: 'Dorer et cuire une croûte', famille: 'pates' },
  panade: { nom: 'La panade desséchée', famille: 'pates' },
  pocher: { nom: 'Pocher à la poche', famille: 'pates' },
  'creme-patissiere': { nom: 'La crème pâtissière', famille: 'pates' },
  petrir: { nom: 'Pétrir jusqu’au voile', famille: 'pates' },
  pointage: { nom: 'Pointage et apprêt', famille: 'pates' },
  faconner: { nom: 'Façonner un pain', famille: 'pates' },
  'cuire-le-pain': { nom: 'Cuire un pain à cœur', famille: 'pates' },
  feuilletage: { nom: 'Le feuilletage rapide', famille: 'pates' },
};

export const PARCOURS = [
  {
    id: 'fondations',
    ordre: 1,
    titre: 'Les fondations',
    sousTitre: 'Le couteau, le fond, la sauce : la grammaire de tout le reste',
    chefId: 'aurele',
    description:
      'Trois leçons qui changent toutes les recettes que vous ferez ensuite. ' +
      'On y apprend à couper vite et régulier, à tirer un bouillon limpide ' +
      'd’une carcasse, et à monter une sauce qui ne tranche pas.',
  },
  {
    id: 'feu',
    ordre: 2,
    titre: 'Le feu et la viande',
    sousTitre: 'Lire la chaleur, saisir, rôtir, mijoter',
    chefId: 'amadou',
    description:
      'La différence entre une viande grise et une croûte dorée tient à ' +
      'trois choses : une surface sèche, une poêle assez chaude, et la ' +
      'patience de ne pas y toucher. Amadou vous apprend à les entendre.',
  },
  {
    id: 'quebec',
    ordre: 3,
    titre: 'La mémoire du Québec',
    sousTitre: 'Les plats de nos tables, avec leurs chiffres justes',
    chefId: 'rosalie',
    description:
      'Tourtière, ragoût de boulettes, tarte au sucre : des plats qu’on croit ' +
      'connaître et qu’on rate souvent. Rosalie donne les gestes, les ' +
      'histoires — et les températures qui manquent aux cahiers de famille.',
  },
  {
    id: 'precision',
    ordre: 4,
    titre: 'Précision et texture',
    sousTitre: 'Riz, bouillon clair, peau croustillante, mi-cuit',
    chefId: 'naoko',
    description:
      'Des plats simples en apparence, où tout se joue au degré et à la ' +
      'seconde. Naoko nomme ce qu’il faut voir, entendre et sentir pour ' +
      'obtenir la texture voulue, à chaque fois.',
  },
  {
    id: 'sucre',
    ordre: 5,
    titre: 'La chimie du sucré',
    sousTitre: 'Pâtes, crèmes et pain, expliqués par ce qui s’y passe',
    chefId: 'lea',
    description:
      'Léa remplace la superstition par la mesure : la pâte à choux par ' +
      'l’amidon, le pain par l’hydratation, la crème pâtissière par la ' +
      'température. Comprendre, c’est réussir du premier coup.',
  },
];

export const LECONS = [
  /* =====================================================================
     PARCOURS 1 — LES FONDATIONS (Chef Aurèle)
     ===================================================================== */
  {
    id: 'couteau-cinq-coupes',
    parcoursId: 'fondations',
    chefId: 'aurele',
    numero: 1,
    titre: 'Tenir son couteau : les cinq coupes',
    accroche: 'Le geste qui rend toutes les autres leçons possibles.',
    gratuit: true,
    statut: 'publiee',
    duree: 40,
    difficulte: 1,
    techniques: ['tenue-couteau', 'emincer', 'ciseler', 'julienne', 'brunoise', 'soin-couteau'],
    conseilleApres: [],
    portions: 1,
    portionsLibelle: 'séance de pratique',
    resultat:
      'Un oignon émincé en demi-lunes régulières, un second ciselé en petits dés, ' +
      'une carotte en julienne et en brunoise, du persil ciselé sans être écrasé — ' +
      'et des mains qui savent où elles sont.',
    pourquoi:
      'On croit qu’un bon cuisinier coupe vite. En réalité, il coupe régulier, et la ' +
      'vitesse vient toute seule. La régularité n’est pas une coquetterie : des ' +
      'morceaux de même taille cuisent en même temps. Une brunoise inégale, c’est ' +
      'des dés brûlés à côté de dés crus dans la même poêle.\n\n' +
      'La deuxième idée de cette leçon, c’est qu’on ne se coupe presque jamais ' +
      'avec la lame : on se coupe avec la main qui tient le légume. La « griffe » — ' +
      'les doigts repliés, les articulations en avant — met la lame en contact avec ' +
      'les os des doigts, pas avec leurs extrémités. Une fois que ce geste est dans ' +
      'les mains, on peut regarder ailleurs et continuer à couper.',
    materiel: [
      'Un couteau de chef de 20 cm environ, affûté — c’est la seule vraie condition',
      'Une planche assez grande pour poser le légume et la main, en bois ou en plastique',
      'Un linge humide à glisser sous la planche',
      'Un bol pour les épluchures, pour ne pas encombrer la planche',
    ],
    ingredients: [
      { cle: 'oignons', q: 2, u: '', nom: 'Oignons jaunes', note: 'Un pour émincer, un pour ciseler', rayon: 'produce' },
      { cle: 'carottes', q: 2, u: '', nom: 'Carottes', note: 'Grosses et droites : plus faciles à équarrir', rayon: 'produce' },
      { cle: 'persil', q: 1, u: '', nom: 'Bouquet de persil plat', rayon: 'produce' },
      { cle: 'ail', q: 2, u: '', nom: 'Gousses d’ail', rayon: 'produce' },
    ],
    etapes: [
      {
        titre: 'La pince et la griffe',
        scene: 'planche',
        duree: '5 min',
        minuterie: null,
        texte:
          'Pincez la lame juste devant le manche entre le pouce et l’index ; les trois autres ' +
          'doigts entourent le manche. L’autre main forme une griffe : bout des doigts repliés ' +
          'sous les articulations, qui avancent en premier. La lame glisse contre les articulations.',
        voix:
          'Avant de couper quoi que ce soit, regardons vos mains. La main du couteau ne serre ' +
          'pas le manche : elle pince la lame, là où elle rejoint le manche, entre le pouce et ' +
          'l’index. Vous gagnez un contrôle que le manche seul ne donne jamais. L’autre main, ' +
          'c’est la griffe : repliez le bout des doigts sous vos articulations, comme si vous ' +
          'teniez une balle. Les articulations avancent en premier, et la lame vient s’appuyer ' +
          'contre elles. Tant que le bout de vos doigts reste derrière, la lame ne peut pas ' +
          'les trouver. Faites le geste à vide, dix fois, lentement.',
        piege: 'Pointer l’index sur le dos de la lame « pour guider ». Ça bloque le poignet et ça fatigue en dix minutes.',
        reussite: 'La lame touche vos articulations à chaque coupe sans que vous y pensiez, et le poignet reste souple.',
      },
      {
        titre: 'Une planche qui ne bouge pas',
        scene: 'planche',
        duree: '2 min',
        minuterie: null,
        texte:
          'Glissez un linge humide sous la planche. Vérifiez la lame : elle doit couper une feuille ' +
          'de papier tenue en l’air d’un seul trait, sans l’accrocher. Une lame émoussée glisse sur ' +
          'la peau de l’oignon — et sur la vôtre.',
        voix:
          'Une planche qui glisse, c’est la première cause d’accident en cuisine, bien avant la ' +
          'lame. Un linge humide dessous, et elle ne bouge plus. Ensuite, la lame : prenez une feuille ' +
          'de papier, tenez-la en l’air, et tranchez. Si la lame coupe net, on y va. Si elle accroche ' +
          'ou plie le papier, elle est émoussée, et une lame émoussée est plus dangereuse qu’une lame ' +
          'vive : elle glisse au lieu de mordre. On verra l’entretien à la fin.',
        piege: 'Couper sur une planche trop petite : la main de la griffe finit hors de la planche et perd son appui.',
        reussite: 'La planche ne bouge pas quand vous appuyez dessus d’une main, et le papier se coupe d’un trait.',
      },
      {
        titre: 'Émincer l’oignon en demi-lunes',
        scene: 'planche',
        duree: '6 min',
        minuterie: null,
        texte:
          'Coupez l’oignon en deux par la racine, pelez-le en gardant la racine intacte : c’est elle ' +
          'qui tient les couches ensemble. Posez la moitié à plat, et tranchez de la pointe vers la ' +
          'racine, en tranches de 2 à 3 mm, la lame appuyée contre la griffe qui recule d’une largeur ' +
          'de tranche à chaque coupe.',
        voix:
          'Premier oignon. Coupez-le en deux en passant par la racine, puis pelez-le, mais gardez ' +
          'la racine : c’est elle qui retient les couches, sinon tout se défait sous la lame. Posez ' +
          'la moitié à plat, face coupée contre la planche. Maintenant, la griffe se place sur ' +
          'l’oignon, et vous tranchez de la pointe vers la racine. Le mouvement part de la pointe ' +
          'de la lame, qui reste presque en contact avec la planche, et le talon descend. On ne ' +
          'hache pas de haut en bas : on glisse vers l’avant. À chaque tranche, la griffe recule de ' +
          'deux ou trois millimètres, pas plus. C’est la griffe qui décide de l’épaisseur, pas le ' +
          'couteau.',
        piege: 'Regarder la lame. Regardez vos articulations : la lame, elle, ne peut aller que là où elles sont.',
        reussite: 'Les demi-lunes ont toutes la même épaisseur et tiennent encore ensemble par la racine.',
      },
      {
        titre: 'Ciseler l’oignon en dés',
        scene: 'planche',
        duree: '6 min',
        minuterie: null,
        texte:
          'Deuxième moitié : faites des incisions verticales de la pointe vers la racine, sans la ' +
          'traverser, tous les 3 mm. Puis une ou deux incisions horizontales, la lame parallèle à la ' +
          'planche, toujours sans atteindre la racine. Enfin, tranchez perpendiculairement : les dés ' +
          'tombent tout seuls.',
        voix:
          'Ciseler, c’est faire des dés. Même position, mais cette fois les premières coupes sont ' +
          'des incisions : la lame descend de la pointe vers la racine, tous les trois millimètres, ' +
          'et s’arrête avant la racine. L’oignon reste entier. Puis couchez la lame, parallèle à ' +
          'la planche, et faites une ou deux entailles horizontales — la paume bien à plat sur le ' +
          'dessus de l’oignon, les doigts relevés, hors du chemin. Et pour finir, vous tranchez en ' +
          'travers, comme tout à l’heure. Regardez : les dés tombent tout seuls, réguliers. Ce qui ' +
          'reste au bout, avec la racine, va dans le bol : il parfumera un bouillon.',
        piege: 'Traverser la racine avec les incisions : l’oignon s’ouvre en éventail et il faut tout ramasser à la main.',
        reussite: 'Des dés de 3 mm, presque tous pareils, et une racine intacte qu’on jette à la fin.',
      },
      {
        titre: 'La carotte : équarrir, puis la julienne',
        scene: 'planche',
        duree: '8 min',
        minuterie: null,
        texte:
          'Coupez la carotte en tronçons de 6 cm. Taillez quatre côtés pour obtenir un bloc rectangulaire ' +
          'qui ne roule pas. Tranchez ce bloc en planches de 2 mm, empilez trois planches, et coupez ' +
          'des bâtonnets de 2 mm : c’est la julienne. Les chutes iront au bouillon.',
        voix:
          'La carotte roule, et ce qui roule se coupe mal. Alors on l’équarrit : des tronçons de six ' +
          'centimètres, et on rabote quatre côtés pour faire un bloc bien posé. Oui, on perd un ' +
          'peu — rien ne se perd, ça va au bouillon. Maintenant, tranchez le bloc en planches de ' +
          'deux millimètres, la griffe dessus, la lame qui glisse vers l’avant. Empilez trois ' +
          'planches, pas plus, sinon la pile bascule, et recoupez-les en bâtonnets de deux ' +
          'millimètres. Ce sont des fils de carotte : la julienne. Elle cuit en trente secondes, ' +
          'c’est pour ça qu’on la veut si fine.',
        piege: 'Empiler trop de planches : la pile glisse, les bâtonnets sortent en biais.',
        reussite: 'Des bâtonnets carrés, comme des allumettes, de même longueur.',
      },
      {
        titre: 'La brunoise',
        scene: 'planche',
        duree: '5 min',
        minuterie: null,
        texte:
          'Avec le second tronçon, faites des planches et des bâtonnets de 3 mm, puis recoupez les ' +
          'bâtonnets en travers, tous les 3 mm : des cubes. La brunoise sert aux garnitures, aux ' +
          'sauces, aux farces : tout ce qui doit cuire vite et se fondre dans le reste.',
        voix:
          'La brunoise, ce sont des dés minuscules — trois millimètres. Même chemin : planches, ' +
          'bâtonnets, et cette fois vous recoupez les bâtonnets en travers. Alignez-en une petite ' +
          'poignée, bien parallèles, tenez-les de la griffe, et tranchez tous les trois millimètres. ' +
          'Comptez à voix haute si ça aide : la régularité vient de la lenteur. Si vos cubes sont ' +
          'tous pareils, ils cuiront tous en même temps, et c’est toute la raison de cet exercice.',
        piege: 'Vouloir aller vite. Personne ne regarde. La vitesse viendra d’elle-même après cent carottes.',
        reussite: 'Des cubes qu’on pourrait croire sortis d’une machine. Presque.',
      },
      {
        titre: 'Ciseler les herbes, hacher l’ail',
        scene: 'planche',
        duree: '5 min',
        minuterie: null,
        texte:
          'Persil : séchez-le bien, rassemblez les feuilles en boule serrée et tranchez fin, d’un ' +
          'seul passage — le repasser dessus l’écrase et le noircit. Ail : écrasez la gousse du plat ' +
          'de la lame pour libérer la peau, puis hachez en balançant la lame, la pointe posée, une ' +
          'pincée de sel dessus pour qu’il ne colle pas.',
        voix:
          'Les herbes ont une règle : on les coupe une fois. Le persil est sec, vous le roulez en ' +
          'boule serrée, et vous tranchez fin, d’un seul passage. Si vous repassez la lame dessus ' +
          'dix fois, vous n’avez pas ciselé, vous avez écrasé : il noircit et il perd son parfum sur ' +
          'la planche. L’ail, c’est l’inverse : posez la gousse, un coup du plat de la lame, la peau ' +
          'se détache. Puis la pointe de la lame reste sur la planche, et vous balancez le talon, ' +
          'l’autre main à plat sur le dos de la lame. Une pincée de sel sur l’ail, et il arrête de ' +
          'coller au couteau.',
        piege: 'Hacher du persil humide : il colle à la lame par paquets et finit en purée.',
        reussite: 'Le persil est vert vif et sec dans le bol, l’ail est en pâte fine sans morceaux.',
      },
      {
        titre: 'Le soin du couteau',
        scene: 'soin',
        duree: '3 min',
        minuterie: null,
        texte:
          'Lavez la lame à la main tout de suite, séchez-la. Avant chaque séance, passez-la sur le ' +
          'fusil : 15 à 20 degrés, cinq allers-retours de chaque côté, sans forcer. Une fois par mois, ' +
          'la pierre. Jamais le lave-vaisselle : la chaleur et les chocs détruisent le fil.',
        voix:
          'Dernière chose, et pas la moindre. Une lame se lave à la main, tout de suite, et se sèche. ' +
          'Jamais au lave-vaisselle : le fil se cogne, l’acier chauffe, le manche se fend. Avant ' +
          'chaque séance, le fusil : posez la lame à quinze ou vingt degrés — l’épaisseur de deux ' +
          'pièces de monnaie — et faites cinq passages de chaque côté, du talon à la pointe, sans ' +
          'appuyer. Le fusil ne coupe pas d’acier, il redresse le fil qui s’est couché. Une fois par ' +
          'mois, ou quand le test du papier échoue, c’est la pierre. Et voilà. Vous avez les mains ' +
          'd’un cuisinier. Tout le reste n’est que des recettes.',
        piege: 'Aiguiser à quarante-cinq degrés « pour aller plus vite » : on fabrique un biseau qui n’est plus tranchant.',
        reussite: 'Le papier se coupe net avant chaque séance, et la lame ne rouille pas.',
      },
    ],
    debrief: {
      reussi:
        'Vos morceaux sont réguliers ? Alors vous venez de gagner du temps sur toutes les recettes ' +
        'de votre vie. Passez au fond de volaille : c’est là que ces chutes vont servir.',
      aRefaire:
        'La régularité vient avec la lenteur, jamais l’inverse. Refaites une carotte, une seule, ' +
        'en comptant à voix haute. Et vérifiez la lame : neuf fois sur dix, c’est elle.',
    },
  },

  {
    id: 'fond-volaille-bouillon-clair',
    parcoursId: 'fondations',
    chefId: 'aurele',
    numero: 2,
    titre: 'Le fond de volaille et son bouillon clair',
    accroche: 'Trois litres d’or limpide tirés d’une carcasse qu’on aurait jetée.',
    gratuit: false,
    statut: 'publiee',
    duree: 240,
    difficulte: 1,
    techniques: ['depart-a-froid', 'fremissement', 'ecumer', 'mirepoix', 'passer', 'refroidir-vite'],
    conseilleApres: ['tenue-couteau'],
    portions: 12,
    portionsLibelle: 'tasses de 250 ml',
    resultat:
      'Environ trois litres de fond de volaille clair, doré, qui prend en gelée au froid. La base ' +
      'des soupes, des sauces, des risottos, et le secret des plats qui goûtent « restaurant ».',
    pourquoi:
      'Un fond, c’est de l’eau qui a pris le temps d’extraire deux choses des os : le goût, et le ' +
      'collagène. Le collagène se transforme en gélatine au-dessus de 160 °F, lentement — c’est lui ' +
      'qui donne le corps, cette rondeur en bouche, et la gelée ferme au frigo.\n\n' +
      'La limpidité, elle, se joue sur un seul point : ne jamais bouillir. À l’ébullition, le gras ' +
      'et les protéines sont battus en une émulsion trouble et grise qu’aucune passoire ne ' +
      'rattrape. Un frémissement à 180-190 °F laisse les impuretés monter tranquillement en ' +
      'écume, où on les cueille à la louche. Le départ à l’eau froide sert la même cause : les ' +
      'protéines coagulent progressivement et remontent, au lieu de se disperser.',
    materiel: [
      'Une grande marmite de 6 à 8 litres',
      'Une louche et une écumoire',
      'Un thermomètre à lecture instantanée',
      'Une passoire fine — un chinois — et, si possible, un linge propre ou une étamine',
      'Des contenants de 250 ml et 500 ml pour congeler',
    ],
    avertissements: [
      {
        titre: 'Le refroidissement compte autant que la cuisson',
        texte:
          'Trois litres de bouillon tiède mettent une nuit à refroidir au frigo — et passent ces ' +
          'heures entre 40 et 140 °F, la zone où les bactéries doublent toutes les vingt minutes. ' +
          'Refroidissez dans un évier d’eau glacée jusqu’à tiède en moins de deux heures, puis au ' +
          'frigo. Un fond n’est pas stérile parce qu’il a cuit longtemps.',
      },
    ],
    temperatures: [
      { quoi: 'Le frémissement', f: 185, note: 'Entre 180 et 190 °F : une bulle perce la surface de temps en temps, jamais un bouillon' },
      { quoi: 'Refroidir sous', f: 70, note: 'En moins de deux heures, dans un bain d’eau glacée' },
      { quoi: 'Conserver au frigo sous', f: 40, note: 'Quatre jours, ou six mois au congélateur' },
    ],
    ingredients: [
      { cle: 'carcasses', q: 1500, u: 'g', nom: 'Carcasses, dos, cous et ailes de poulet', note: 'Le boucher les vend pour presque rien ; sinon, gardez les carcasses de vos poulets rôtis au congélateur', rayon: 'meats' },
      { cle: 'eau', q: 3500, u: 'ml', nom: 'Eau', note: 'Froide, du robinet', rayon: null },
      { cle: 'carottes', q: 200, u: 'g', nom: 'Carottes', note: 'Deux moyennes, en gros tronçons', rayon: 'produce' },
      { cle: 'oignons', q: 250, u: 'g', nom: 'Oignons jaunes', note: 'Deux, coupés en quatre, avec la peau si elle est propre : elle dore le fond', rayon: 'produce' },
      { cle: 'poireau', q: 150, u: 'g', nom: 'Vert de poireau', note: 'Le vert qu’on jette d’habitude — bien lavé, il est parfait ici', substitution: 'Un troisième oignon', rayon: 'produce' },
      { cle: 'celeri', q: 120, u: 'g', nom: 'Céleri', note: 'Deux branches, feuilles comprises', rayon: 'produce' },
      { cle: 'thym', q: 3, u: '', nom: 'Branches de thym', substitution: '2 ml de thym séché', rayon: 'produce' },
      { cle: 'laurier', q: 2, u: '', nom: 'Feuilles de laurier', rayon: 'pantry' },
      { cle: 'poivre', q: 8, u: '', nom: 'Grains de poivre noir', rayon: 'pantry' },
      { cle: 'persil', q: 6, u: '', nom: 'Tiges de persil', note: 'Les tiges, justement : les feuilles serviront ailleurs', rayon: 'produce' },
    ],
    etapes: [
      {
        titre: 'Choisir et rincer les os',
        scene: 'balance',
        duree: '5 min',
        minuterie: null,
        texte:
          'Prenez {{carcasses}}. Les dos, les cous et les ailes sont riches en collagène : c’est eux ' +
          'qui donnent le corps. Rincez à l’eau froide pour ôter le sang et les éclats d’os. Pas de ' +
          'coloration au four pour un fond blanc : on veut la clarté.',
        voix:
          'Un fond commence par le choix des os. Il vous faut {{carcasses}} : des dos, des cous, ' +
          'des ailes, des carcasses. Pas les beaux morceaux — les morceaux à cartilage, à ' +
          'articulations. C’est là que se cache le collagène, et le collagène, c’est le corps du ' +
          'bouillon. Rincez-les sous l’eau froide, une minute, pour emporter le sang et les petits ' +
          'éclats d’os. On ne les fait pas dorer : c’est un fond blanc que nous faisons aujourd’hui, ' +
          'clair et doux, celui qui sert à tout.',
        piege: 'Utiliser une carcasse qui a traîné : un os douteux fait un fond douteux, et la cuisson longue n’y change rien.',
        reussite: 'L’eau de rinçage coule claire, les os sentent le poulet frais et rien d’autre.',
      },
      {
        titre: 'Le départ à froid',
        scene: 'casserole',
        duree: '20 min',
        minuterie: null,
        texte:
          'Mettez les os dans la marmite, couvrez de {{eau}} froide — les os doivent être ' +
          'recouverts de 5 cm. Chauffez à feu moyen, sans couvercle, jusqu’au premier frémissement. ' +
          'Ne salez pas.',
        voix:
          'Les os dans la marmite, et par-dessus, {{eau}} froide. Froide, j’insiste. Si vous ' +
          'partez à l’eau chaude, les protéines de surface coagulent d’un coup et se dispersent en ' +
          'un nuage gris qui trouble tout. À froid, elles coagulent doucement, s’agglomèrent, et ' +
          'montent en écume à la surface, où l’on pourra les enlever. Feu moyen, sans couvercle, ' +
          'et on attend le premier frémissement. Et pas de sel : le fond va réduire, il servira ' +
          'dans des sauces qui réduiront encore. On sale le plat, jamais le fond.',
        piege: 'Couvrir pour aller plus vite : la température grimpe, on rate le frémissement et le fond bout sans qu’on le voie.',
        reussite: 'Une écume grise et mousseuse se forme à la surface au moment où les premières bulles apparaissent.',
      },
      {
        titre: 'Le frémissement, jamais l’ébullition',
        scene: 'thermometre',
        duree: '5 min',
        minuterie: null,
        texte:
          'Baissez le feu dès que la surface tremble. Visez 180 à 190 °F : une bulle perce la ' +
          'surface toutes les secondes ou deux. Réglez le feu jusqu’à tenir cette température, et ' +
          'vérifiez au thermomètre les premières fois.',
        voix:
          'Voilà le geste de toute la leçon. Dès que la surface tremble, baissez le feu. Ce que ' +
          'nous voulons s’appelle un frémissement : cent quatre-vingt à cent quatre-vingt-dix ' +
          'degrés Fahrenheit. À l’œil, c’est une bulle qui perce la surface de temps en temps, ' +
          'paresseusement. Pas un bouillon. Plongez le thermomètre, réglez le feu, et revérifiez ' +
          'dans cinq minutes. Si ça bout, le gras se bat avec l’eau et le fond devient trouble et ' +
          'gris — irrémédiablement. Un frémissement pendant trois heures vaut mieux qu’une ' +
          'ébullition pendant une.',
        piege: 'Se fier au réglage de la cuisinière : il change selon la quantité et la marmite. Le thermomètre, lui, ne change pas.',
        reussite: 'La surface est presque immobile, le thermomètre dit entre 180 et 190 °F, et le fond reste doré.',
      },
      {
        titre: 'Écumer',
        scene: 'casserole',
        duree: '20 min',
        minuterie: 20,
        texte:
          'Pendant les vingt premières minutes, retirez à la louche l’écume grise qui monte. Faites ' +
          'des passages réguliers, sans remuer le fond : remuer renvoie les impuretés dans le liquide.',
        voix:
          'Maintenant on écume. Cette mousse grise qui se rassemble à la surface, ce sont les ' +
          'protéines coagulées et les impuretés. Cueillez-les à la louche, en effleurant la ' +
          'surface, et jetez-les. Revenez toutes les deux ou trois minutes pendant vingt minutes : ' +
          'c’est pendant ce temps-là que presque tout remonte. Et surtout, ne remuez pas. Remuer, ' +
          'c’est renvoyer au fond ce que vous venez de faire monter. Le fond travaille seul ; vous, ' +
          'vous surveillez.',
        piege: 'Écumer en raclant : on emporte le gras doré qui donne du goût. On effleure, on ne creuse pas.',
        reussite: 'Après vingt minutes, il ne monte presque plus rien, et la surface est nette.',
      },
      {
        titre: 'La garniture aromatique',
        scene: 'planche',
        duree: '10 min',
        minuterie: null,
        texte:
          'Après 45 minutes, ajoutez {{carottes}}, {{oignons}}, {{poireau}} et {{celeri}}, en gros ' +
          'morceaux, puis {{thym}}, {{laurier}}, {{persil}} et {{poivre}}. Les morceaux restent gros : ' +
          'des petits dés se déferaient en trois heures et troubleraient le fond.',
        voix:
          'Trois quarts d’heure ont passé, l’écume est partie : c’est le moment des légumes. ' +
          '{{carottes}}, {{oignons}}, {{poireau}}, {{celeri}}. En gros morceaux, et c’est voulu : ' +
          'une brunoise se déferait complètement en trois heures et troublerait le fond. Ici, la ' +
          'régularité de la coupe compte peu, la taille compte beaucoup. Ajoutez le thym, le laurier, ' +
          'les tiges de persil et les grains de poivre. Pas de clou de girofle, pas de sel, pas ' +
          'd’ail : on veut un fond neutre qui ira partout. Les légumes remontent d’abord, puis ' +
          'coulent en cuisant. Laissez-les faire.',
        piege: 'Mettre les légumes dès le début : ils sont épuisés bien avant les os, et donnent un goût de légume bouilli.',
        reussite: 'Le fond prend une teinte dorée franche dans l’heure qui suit, et sent la soupe du dimanche.',
      },
      {
        titre: 'Trois heures de patience',
        scene: 'casserole',
        duree: '3 h',
        minuterie: 180,
        texte:
          'Laissez frémir trois heures, sans couvercle, en revérifiant la température de temps en ' +
          'temps. Si le niveau descend sous les os, ajoutez de l’eau chaude. Écumez le gras qui ' +
          's’accumule si vous en avez envie ; il partira de toute façon au froid.',
        voix:
          'Et maintenant, le temps fait le travail. Trois heures de frémissement, sans couvercle. ' +
          'Passez de temps en temps : la température, le niveau. Si les os affleurent, ajoutez de ' +
          'l’eau chaude — chaude, pour ne pas casser le frémissement. Vous verrez le fond se ' +
          'concentrer, se colorer, épaissir presque. Quatre heures ne l’améliorent pas beaucoup ; ' +
          'deux heures, c’est un peu court pour le collagène. Trois, c’est le bon compte pour des ' +
          'os de volaille.',
        piege: 'Le laisser monter à l’ébullition pendant qu’on fait autre chose. Un minuteur qui rappelle de vérifier toutes les trente minutes règle la question.',
        reussite: 'Les os se défont sous la cuillère, le liquide a réduit d’un bon quart et nappe légèrement la louche.',
      },
      {
        titre: 'Passer au chinois',
        scene: 'passoire',
        duree: '10 min',
        minuterie: null,
        texte:
          'Posez le chinois, garni d’un linge, sur un grand bol. Prélevez le fond à la louche et ' +
          'versez-le doucement à travers — ne renversez pas la marmite, ne pressez jamais les os ' +
          'ni les légumes : vous renverriez dans le fond tout ce que la patience en a sorti.',
        voix:
          'On passe. Le chinois sur un grand bol, un linge propre dedans si vous en avez un. Et là, ' +
          'du calme : on prélève à la louche, on verse doucement, on laisse couler. On ne vide pas la ' +
          'marmite d’un coup, ça soulève le dépôt du fond. Et on ne presse pas les os ni les légumes ' +
          'pour en tirer plus — c’est exactement le geste qui trouble un fond qu’on a mis trois ' +
          'heures à garder clair. Le fond de la marmite, le dernier centimètre, on le laisse.',
        piege: 'Presser les légumes dans la passoire. C’est un réflexe, et c’est la dernière chance de tout gâcher.',
        reussite: 'Le fond est limpide et doré ; on lit le fond du bol à travers.',
      },
      {
        titre: 'Refroidir vite, dégraisser froid',
        scene: 'frigo',
        duree: '1 h, puis une nuit',
        minuterie: 60,
        texte:
          'Posez le bol dans un évier d’eau très froide avec de la glace, remuez de temps en temps : ' +
          'il doit être tiède en moins d’une heure. Puis au frigo, à découvert d’abord. Le lendemain, ' +
          'soulevez le disque de gras figé d’un coup de cuillère. Portionnez et congelez.',
        voix:
          'Dernière étape, et elle est sérieuse. Un grand bol de bouillon chaud mis directement au ' +
          'frigo met la nuit à refroidir, et passe des heures dans la zone où les bactéries se ' +
          'multiplient. Alors : l’évier, de l’eau très froide, des glaçons, et le bol dedans. Remuez ' +
          'de temps en temps. En moins d’une heure, il est tiède ; au frigo. Le lendemain, le gras a ' +
          'figé en un disque à la surface, et le fond a pris en gelée. Le disque se soulève d’un coup ' +
          'de cuillère, et la gelée, c’est votre certificat : il y a du collagène là-dedans. ' +
          'Portionnez en contenants de deux cent cinquante millilitres, et congelez. Vous avez six ' +
          'mois de sauces devant vous.',
        piege: 'Couvrir le bol chaud : la condensation retombe, et la chaleur ne sort pas.',
        reussite: 'Le lendemain, le fond tremble comme une gelée quand on secoue le bol, et le gras se lève en une seule galette.',
      },
    ],
    debrief: {
      reussi:
        'Une gelée ferme et limpide : vous tenez la base de toute la cuisine de sauce. La prochaine ' +
        'fois, doublez la quantité — le travail est le même, le congélateur en profitera.',
      aRefaire:
        'Trouble ? Il a bouilli, ou quelqu’un a remué. Grisâtre ? On n’a pas écumé au début. Sans ' +
        'gelée ? Pas assez d’os à cartilage, ou pas assez d’heures. Trois causes, trois remèdes, ' +
        'tous faciles. Le fond ne se rate pas : il se réapprend.',
    },
  },

  {
    id: 'beurre-blanc-emulsion',
    parcoursId: 'fondations',
    chefId: 'aurele',
    numero: 3,
    titre: 'La sauce au beurre monté : l’émulsion sans peur',
    accroche: 'Pourquoi une sauce tranche, et comment la rattraper en dix secondes.',
    gratuit: false,
    statut: 'en-preparation',
    duree: 30,
    difficulte: 2,
    techniques: ['emulsion', 'jus-de-cuisson'],
    conseilleApres: ['fremissement'],
    portions: 4,
    resultat: 'Un beurre blanc nacré, qui nappe la cuillère et tient au chaud vingt minutes.',
    pourquoi: '',
    materiel: [],
    ingredients: [],
    etapes: [],
    debrief: { reussi: '', aRefaire: '' },
  },

  /* =====================================================================
     PARCOURS 2 — LE FEU ET LA VIANDE (Chef Amadou)
     ===================================================================== */
  {
    id: 'saisir-sans-coller',
    parcoursId: 'feu',
    chefId: 'amadou',
    numero: 1,
    titre: 'Saisir sans coller : lire la poêle',
    accroche: 'Une croûte dorée n’est pas une question de poêle. C’est une question d’oreille.',
    gratuit: true,
    statut: 'publiee',
    duree: 45,
    difficulte: 1,
    techniques: ['lire-la-poele', 'saisir', 'arroser', 'thermometre', 'reposer'],
    conseilleApres: [],
    portions: 4,
    resultat:
      'Quatre hauts de cuisse de poulet à la peau dorée et craquante, la chair juteuse, arrosés ' +
      'au beurre, à l’ail et au thym — et une poêle qui n’a rien retenu.',
    pourquoi:
      'Ce qui colle, c’est une protéine qui a formé des liaisons avec le métal avant d’avoir eu le ' +
      'temps de former une croûte. La croûte, c’est la réaction de Maillard : elle demande une ' +
      'surface sèche et une température au-dessus de 300 °F. Une viande humide, posée dans une ' +
      'poêle tiède, passe de longues minutes à bouillir dans son eau, s’accroche, et se déchire ' +
      'quand on la retourne. La même viande, séchée, salée à l’avance et posée dans une poêle ' +
      'bien chaude, se soude un instant — puis, la croûte formée, se détache toute seule.\n\n' +
      'Le reste, c’est de la lecture : la goutte d’eau qui roule en bille dit que la poêle est ' +
      'prête ; le grésillement régulier dit que la chaleur est bonne ; le thermomètre dit quand ' +
      'c’est cuit. Trois signaux, et vous n’avez plus jamais besoin de « sept minutes de chaque côté ».',
    materiel: [
      'Une poêle lourde en acier inoxydable ou en fonte — pas d’antiadhésif à haute température',
      'Une pince de cuisine',
      'Un thermomètre à lecture instantanée',
      'Du papier essuie-tout, et une grille ou une assiette pour le repos',
    ],
    temperatures: [
      { quoi: 'La poêle prête', f: 375, note: 'La goutte d’eau roule en bille — c’est l’effet Leidenfrost' },
      { quoi: 'Volaille, minimum de sécurité', f: 165, note: 'Santé Canada : 74 °C pour les morceaux de volaille' },
      { quoi: 'Haut de cuisse, la cible', f: 175, note: 'Le collagène de la cuisse fond mieux un peu plus haut : plus tendre, pas plus sec' },
    ],
    ingredients: [
      { cle: 'poulet', q: 600, u: 'g', nom: 'Hauts de cuisse de poulet désossés, avec la peau', note: 'Quatre morceaux ; la peau est la moitié du plaisir', substitution: 'Des cuisses avec l’os : comptez 10 minutes de plus', rayon: 'meats' },
      { cle: 'sel', q: 6, u: 'g', nom: 'Sel fin', note: 'Un pour cent du poids de la viande — une cuillère à thé rase', rayon: 'pantry' },
      { cle: 'huile', q: 30, u: 'ml', nom: 'Huile de canola', note: 'Une huile qui supporte la chaleur : canola, pépins de raisin, arachide', rayon: 'pantry' },
      { cle: 'beurre', q: 20, u: 'g', nom: 'Beurre', rayon: 'dairy' },
      { cle: 'ail', q: 2, u: '', nom: 'Gousses d’ail', note: 'Écrasées, avec la peau', rayon: 'produce' },
      { cle: 'thym', q: 3, u: '', nom: 'Branches de thym', rayon: 'produce' },
      { cle: 'citron', q: 0.5, u: '', nom: 'Citron', note: 'Pour déglacer, facultatif', rayon: 'produce' },
      { cle: 'poivre', q: null, u: '', nom: 'Poivre noir du moulin', rayon: 'pantry' },
    ],
    etapes: [
      {
        titre: 'Sécher et saler à l’avance',
        scene: 'planche',
        duree: '15 min',
        minuterie: 15,
        texte:
          'Épongez les hauts de cuisse — {{poulet:q}} en tout — avec du papier, des deux côtés. Salez avec {{sel}}, surtout côté peau, ' +
          'et laissez reposer 15 minutes à découvert, peau vers le haut. Le sel tire l’eau, puis la ' +
          'viande la reprend, assaisonnée ; la peau sèche pendant ce temps.',
        voix:
          'On commence par la chose que tout le monde saute : sécher. {{poulet}}, et du papier ' +
          'essuie-tout, des deux côtés, jusqu’à ce que la peau soit mate. L’eau, c’est l’ennemi de la ' +
          'croûte : tant qu’il y en a, la poêle fait de la vapeur au lieu de dorer. Ensuite, {{sel}} — ' +
          'un pour cent du poids, c’est la règle que je vous donne pour toutes les viandes. Salez ' +
          'surtout la peau, et laissez la viande respirer quinze minutes, peau vers le ciel. Le sel ' +
          'va tirer l’eau à la surface, puis la viande va la reboire, salée cette fois. Et la peau, ' +
          'pendant ce temps, sèche. Quinze minutes qu’on ne regrette jamais.',
        piege: 'Saler et poser tout de suite dans la poêle : l’eau tirée par le sel arrive pile au moment de saisir.',
        reussite: 'Après quinze minutes, la peau est sèche et légèrement collante ; la chair a une teinte plus soutenue.',
      },
      {
        titre: 'Lire la poêle à vide',
        scene: 'poele',
        duree: '4 min',
        minuterie: 4,
        texte:
          'Chauffez la poêle vide à feu moyen-vif, 3 à 4 minutes. Jetez une goutte d’eau : si elle ' +
          's’étale et grésille, c’est trop froid. Si elle disparaît instantanément en fumée, trop chaud. ' +
          'Si elle se rassemble en une bille qui roule comme du mercure, la poêle est à 375 °F environ : prête.',
        voix:
          'La poêle, on la chauffe vide. Feu moyen-vif, trois, quatre minutes. Et on la lit avec une ' +
          'goutte d’eau. Écoutez bien. La goutte s’étale et grésille ? Trop froid, la viande collera. La ' +
          'goutte disparaît d’un coup dans un nuage ? Trop chaud, l’huile va fumer et brûler. Mais si la ' +
          'goutte se rassemble en une bille qui roule, qui danse sur le métal comme une perle — là, la ' +
          'poêle est prête. Autour de trois cent soixante-quinze degrés. Ça s’appelle l’effet ' +
          'Leidenfrost, et c’est le thermomètre le moins cher du monde.',
        piege: 'Mettre l’huile dès le début : on ne peut plus faire le test de la goutte, et l’huile brûle pendant qu’on attend.',
        reussite: 'La goutte roule en bille pendant plusieurs secondes avant de s’évaporer.',
      },
      {
        titre: 'L’huile, puis la viande',
        scene: 'poele',
        duree: '1 min',
        minuterie: null,
        texte:
          'Versez {{huile}} : elle frissonne en quelques secondes, presque sans fumée. Posez les morceaux ' +
          'côté peau, en les couchant vers l’extérieur pour ne pas vous éclabousser. Laissez de l’espace ' +
          'entre eux : une poêle trop pleine perd sa chaleur et fait bouillir la viande.',
        voix:
          '{{huile}} dans la poêle. Regardez-la : en quelques secondes, elle frissonne, elle ondule. ' +
          'C’est le moment, avant qu’elle fume. Prenez chaque morceau par la pince et posez-le côté ' +
          'peau, en le couchant loin de vous, pour que les éclaboussures partent de l’autre côté. Et ' +
          'laissez de l’air entre les morceaux. Une poêle pleine à craquer, c’est une poêle qui refroidit ' +
          'd’un coup, et la viande se met à bouillir dans son jus au lieu de dorer. Deux fournées valent ' +
          'mieux qu’une fournée ratée.',
        piege: 'Surcharger la poêle. Si les morceaux se touchent, ils s’étuvent.',
        reussite: 'Un grésillement franc et régulier dès que la peau touche le métal.',
      },
      {
        titre: 'Ne touchez pas',
        scene: 'poele',
        duree: '6 min',
        minuterie: 6,
        texte:
          'Laissez cuire 5 à 7 minutes sans bouger les morceaux. Ils collent au début : c’est normal. ' +
          'Quand la croûte est formée, ils se détachent d’eux-mêmes. Écoutez le son : un crépitement ' +
          'régulier. Des crachements violents, c’est trop fort — baissez. Un chuintement mou, montez.',
        voix:
          'Et maintenant, le plus dur : on ne touche pas. Cinq, six, sept minutes. La viande va coller ' +
          'au début, et vous allez vouloir la décoller — non. Elle est en train de former sa croûte, et ' +
          'quand la croûte sera là, elle se détachera toute seule, je vous le promets. Pendant ce temps, ' +
          'vous écoutez. Un crépitement régulier, comme une pluie fine : c’est parfait. Des crachements ' +
          'violents, des grosses gouttes qui sautent : trop fort, baissez d’un cran. Un chuintement mou, ' +
          'presque un silence : trop doux, montez. Le feu se lit à l’oreille.',
        piege: 'Soulever pour « voir ». À chaque fois, on arrache la croûte qui commençait.',
        reussite: 'Quand vous poussez doucement le morceau avec la pince, il glisse. La peau est brun doré, uniforme.',
      },
      {
        titre: 'Retourner et arroser',
        scene: 'poele',
        duree: '5 min',
        minuterie: 5,
        texte:
          'Retournez. Ajoutez {{beurre}}, {{ail}} et {{thym}}. Inclinez la poêle et, à la cuillère, ' +
          'arrosez la peau avec le beurre mousseux, plusieurs fois par minute, pendant 4 à 6 minutes.',
        voix:
          'La croûte est là ? On retourne. Et maintenant on fait plaisir à la viande : {{beurre}}, ' +
          '{{ail}} écrasé avec sa peau, {{thym}}. Le beurre mousse, il prend le goût de l’ail et du ' +
          'thym. Inclinez la poêle vers vous, le beurre se rassemble, et vous le versez à la cuillère ' +
          'sur la peau. Encore. Encore. Ce beurre parfumé cuit le dessus pendant que le dessous ' +
          'finit. Quatre à six minutes, et si le beurre fonce trop vite, baissez le feu : brun ' +
          'noisette, oui ; noir, jamais.',
        piege: 'Mettre le beurre au début : il aurait brûlé bien avant la croûte.',
        reussite: 'Le beurre est brun noisette et sent la noix ; la peau brille.',
      },
      {
        titre: 'Le thermomètre décide',
        scene: 'thermometre',
        duree: '1 min',
        minuterie: null,
        texte:
          'Piquez le morceau le plus épais en son centre. Cent soixante-cinq °F est le minimum pour la ' +
          'volaille ; pour un haut de cuisse, visez 170 à 175 °F : la chair y est plus tendre, pas plus ' +
          'sèche, parce que son collagène a fondu. Sous la cible, poursuivez à feu moyen en arrosant.',
        voix:
          'On ne devine pas, on mesure. Le thermomètre dans le morceau le plus épais, au centre. Cent ' +
          'soixante-cinq degrés Fahrenheit, c’est le minimum pour que la volaille soit sûre. Mais une ' +
          'cuisse, c’est un muscle qui travaille, plein de collagène, et le collagène fond mieux un ' +
          'peu plus haut. Alors pour un haut de cuisse, je vise cent soixante-quinze. Pas plus sec, ' +
          'plus tendre. Vous n’y êtes pas ? Feu moyen, on continue d’arroser, on remesure dans deux ' +
          'minutes. Le thermomètre a remplacé la chance.',
        piege: 'Mesurer contre la poêle ou près de la surface : on lit la chaleur du métal, pas celle de la viande.',
        reussite: 'Entre 170 et 175 °F au centre du morceau le plus épais.',
      },
      {
        titre: 'Le repos et le jus',
        scene: 'assiette',
        duree: '5 min',
        minuterie: 5,
        texte:
          'Posez la viande sur une grille ou une assiette, peau vers le haut, 5 minutes sans la couvrir. ' +
          'Pendant ce temps, remettez la poêle sur le feu, pressez {{citron}} dedans, grattez les sucs, ' +
          'une cuillère d’eau si besoin : c’est la sauce.',
        voix:
          'Sortez la viande, peau vers le ciel, sur une grille ou une assiette, et laissez-la cinq ' +
          'minutes. Ne la couvrez pas : la vapeur ramollirait la peau qu’on a mis vingt minutes à ' +
          'rendre croustillante. Pendant le repos, les jus qui se sont réfugiés au centre redescendent ' +
          'dans toute la chair. Coupez maintenant, et ils coulent dans l’assiette ; coupez dans cinq ' +
          'minutes, et ils restent dans la bouche. La poêle, elle, n’a pas fini : {{citron}} pressé ' +
          'dedans, on gratte les sucs avec une cuillère de bois, une cuillère d’eau si c’est trop ' +
          'épais. Vous avez une sauce. Et vous avez saisi sans coller.',
        piege: 'Couper tout de suite « pour vérifier ». Le thermomètre a déjà vérifié.',
        reussite: 'La planche reste presque sèche quand vous tranchez ; la peau craque sous le couteau.',
      },
    ],
    debrief: {
      reussi:
        'La peau a craqué ? Vous savez lire une poêle, et ça marche pareil pour un steak, un pavé de ' +
        'poisson ou un champignon. Montez d’un cran : le poulet entier, au thermomètre.',
      aRefaire:
        'Ça a collé ? La poêle n’était pas assez chaude, ou la viande pas assez sèche, ou vous avez ' +
        'touché trop tôt. Ça a brûlé ? Le feu était trop fort et vous n’avez pas écouté les ' +
        'crachements. Refaites-le avec deux morceaux seulement : moins de viande, plus d’attention.',
    },
  },

  {
    id: 'poulet-roti-a-coeur',
    parcoursId: 'feu',
    chefId: 'amadou',
    numero: 2,
    titre: 'Le poulet entier rôti au thermomètre',
    accroche: 'Salé la veille, cuit à la sonde, reposé quinze minutes. Plus jamais de poitrine sèche.',
    gratuit: false,
    statut: 'publiee',
    duree: 120,
    difficulte: 2,
    techniques: ['saler-a-sec', 'rotir', 'thermometre', 'reposer', 'jus-de-cuisson', 'decouper'],
    conseilleApres: ['saisir', 'thermometre'],
    portions: 4,
    portionsLibelle: 'convives',
    resultat:
      'Un poulet à la peau laquée et croquante, la poitrine juteuse à 160 °F, la cuisse fondante à ' +
      '175 °F, un jus de cuisson clair, et un découpage propre en huit morceaux.',
    pourquoi:
      'Le poulet entier pose un problème de géométrie : la poitrine est cuite à 160 °F et sèche ' +
      'au-delà, la cuisse n’est bonne qu’à partir de 175 °F. Deux muscles, deux cibles, un seul ' +
      'four. On triche de trois façons : la cuisse, plus exposée, cuit plus vite si on ne serre ' +
      'pas les pattes contre le corps ; le repos fait monter la poitrine de 5 °F sans la sécher ; ' +
      'et le salage à sec de la veille garde l’eau dans la chair même quand on dépasse un peu.\n\n' +
      'Le salage à sec, c’est la même chimie que dans nos côtes levées : le sel tire l’eau de ' +
      'surface, cette saumure est réabsorbée en profondeur et modifie les protéines pour qu’elles ' +
      'retiennent leur jus à la cuisson. Une nuit à découvert au frigo sèche la peau par-dessus ' +
      'le marché — et une peau sèche est une peau qui croustille.',
    materiel: [
      'Un thermomètre à lecture instantanée, ou mieux, une sonde qu’on laisse dans la cuisse',
      'Une rôtissoire ou un plat à bord bas, avec une grille si possible',
      'De la ficelle de cuisine',
      'Une plaque et une grille pour la nuit au frigo',
      'Un grand couteau, une planche à rigole',
    ],
    avertissements: [
      {
        titre: 'On ne rince jamais une volaille',
        texte:
          'Rincer un poulet cru ne le nettoie pas : ça projette des gouttelettes contaminées à un ' +
          'mètre autour de l’évier. La chaleur du four fait le travail. On éponge, on jette le ' +
          'papier, on lave les mains et la planche à l’eau chaude savonneuse.',
      },
      {
        titre: 'Tablette du bas, sur une plaque',
        texte:
          'Le poulet passe la nuit au frigo à découvert : sur une grille, dans une plaque à rebord, ' +
          'sur la tablette du bas. Rien de cru ne doit pouvoir goutter sur quoi que ce soit.',
      },
      {
        titre: 'Les températures de sécurité',
        texte:
          'Santé Canada recommande 82 °C (180 °F) pour une volaille entière, 74 °C (165 °F) pour ' +
          'les morceaux. La cible de 175 °F à la cuisse donnée ici est celle des cuisiniers ; si ' +
          'vous cuisinez pour une personne fragile, montez la cuisse à 180 °F — la poitrine sera ' +
          'un peu moins juteuse, et le repas sera irréprochable.',
      },
    ],
    temperatures: [
      { quoi: 'Le four, départ', f: 425, note: 'Vingt minutes pour la couleur' },
      { quoi: 'Le four, cuisson', f: 375, note: 'Le reste du temps, pour cuire à cœur sans brûler la peau' },
      { quoi: 'La cuisse, cible', f: 175, note: 'Entre la cuisse et le corps, sans toucher l’os' },
      { quoi: 'La poitrine, à la sortie', f: 160, note: 'Elle monte à 165 °F pendant le repos' },
    ],
    ingredients: [
      { cle: 'poulet', q: 1800, u: 'g', nom: 'Poulet entier', note: 'Un poulet de 1,8 kg nourrit quatre personnes avec des restes', rayon: 'meats' },
      { cle: 'sel', q: 18, u: 'g', nom: 'Gros sel', note: 'Un pour cent du poids du poulet — pesez-le', substitution: '14 g de sel de table fin', rayon: 'pantry' },
      { cle: 'beurre', q: 30, u: 'g', nom: 'Beurre mou', rayon: 'dairy' },
      { cle: 'citron', q: 1, u: '', nom: 'Citron', note: 'Coupé en deux', rayon: 'produce' },
      { cle: 'ail', q: 1, u: '', nom: 'Tête d’ail', note: 'Coupée en deux dans la largeur', rayon: 'produce' },
      { cle: 'thym', q: 5, u: '', nom: 'Branches de thym', rayon: 'produce' },
      { cle: 'oignon', q: 1, u: '', nom: 'Oignon', note: 'En quartiers, pour le lit', rayon: 'produce' },
      { cle: 'carottes', q: 2, u: '', nom: 'Carottes', note: 'En tronçons, pour le lit', rayon: 'produce' },
      { cle: 'celeri', q: 1, u: '', nom: 'Branche de céleri', rayon: 'produce' },
      { cle: 'eau', q: 250, u: 'ml', nom: 'Eau ou fond de volaille', note: 'Pour le jus', rayon: null },
      { cle: 'poivre', q: null, u: '', nom: 'Poivre noir du moulin', rayon: 'pantry' },
    ],
    etapes: [
      {
        titre: 'La veille : le salage à sec',
        scene: 'frigo',
        duree: '12 à 24 h',
        minuterie: null,
        texte:
          'Retirez les abats de la cavité. Épongez {{poulet}} partout, sans le rincer. Répartissez ' +
          '{{sel}} sur toute la peau et dans la cavité, en saupoudrant de haut. Posez-le sur une ' +
          'grille, dans une plaque, à découvert, tablette du bas du frigo, pour la nuit.',
        voix:
          'Tout commence la veille. Sortez les abats de la cavité — gardez le cou et le gésier pour ' +
          'un fond. Épongez le poulet partout avec du papier ; on ne le rince pas, jamais, ça ' +
          'éclabousse la cuisine de ce qu’on voulait justement enlever. Puis {{sel}}, un pour cent ' +
          'du poids, que vous saupoudrez de haut, comme la neige : partout sur la peau, un peu dans ' +
          'la cavité. Sur une grille, dans une plaque, à découvert, tablette du bas. Cette nuit, le ' +
          'sel entre dans la chair et la peau sèche. Demain, vous comprendrez pourquoi on ne fait ' +
          'plus jamais autrement.',
        piege: 'Couvrir le poulet au frigo. La peau doit sécher à l’air : c’est ce qui la rend croustillante.',
        reussite: 'Le lendemain, la peau est tendue, sèche, presque parcheminée, et il n’y a pas de sel visible.',
      },
      {
        titre: 'Tempérer, beurrer, garnir',
        scene: 'planche',
        duree: '45 min',
        minuterie: 45,
        texte:
          'Sortez le poulet 45 minutes avant le four. Épongez une dernière fois. Massez la peau avec ' +
          '{{beurre}}, poivrez. Glissez {{citron}}, {{ail}} et {{thym}} dans la cavité. Repliez les ' +
          'ailes sous le dos, et liez les pattes sans les serrer contre le corps.',
        voix:
          'Sortez-le du frigo trois quarts d’heure avant : un poulet glacé au centre cuit mal et long. ' +
          'Épongez encore une fois — il aura rendu un peu d’eau. Puis {{beurre}} que vous massez ' +
          'partout sur la peau, et du poivre. Dans la cavité : {{citron}}, {{ail}}, {{thym}}. Ils ' +
          'parfument de l’intérieur et ils parfumeront le jus. Repliez les ailes sous le dos pour ' +
          'qu’elles ne brûlent pas, et liez les pattes avec un tour de ficelle — sans les serrer ' +
          'contre le corps. Une cuisse qui respire cuit plus vite que la poitrine, et c’est exactement ' +
          'ce qu’on veut.',
        piege: 'Brider serré comme sur les photos : la cuisse se cache derrière la poitrine et finit crue quand la poitrine est sèche.',
        reussite: 'La peau est luisante de beurre, les ailes tiennent, les pattes sont liées mais écartées du corps.',
      },
      {
        titre: 'Le four à 425 °F, sur un lit de légumes',
        scene: 'four',
        duree: '10 min',
        minuterie: null,
        texte:
          'Préchauffez à 425 °F, grille au centre. Dans le plat, disposez {{oignon}}, {{carottes}} et ' +
          '{{celeri}} : ils surélèvent le poulet et parfument le jus. Posez le poulet dessus, poitrine ' +
          'vers le haut.',
        voix:
          'Le four à quatre cent vingt-cinq, grille au centre, et on lui laisse le temps d’y arriver ' +
          'vraiment : la lumière qui s’éteint ne veut pas dire que les parois sont chaudes. Dans le ' +
          'plat, {{oignon}}, {{carottes}}, {{celeri}} : c’est le lit. Il soulève le poulet pour que ' +
          'l’air passe dessous, et il va caraméliser dans le gras pour donner le goût du jus. Le ' +
          'poulet dessus, poitrine vers le ciel. Au four.',
        piege: 'Poser le poulet à même le plat : le dessous bout dans son jus et la peau y reste blanche.',
        reussite: 'Le poulet est surélevé de deux ou trois centimètres, et l’air circule autour.',
      },
      {
        titre: 'Vingt minutes fort, puis on baisse',
        scene: 'four',
        duree: '20 min',
        minuterie: 20,
        texte:
          'Enfournez 20 minutes à 425 °F pour saisir la peau et lancer la couleur. Puis baissez à 375 °F ' +
          'sans ouvrir la porte.',
        voix:
          'Vingt minutes à feu vif. C’est le moment où la peau se tend, où le beurre grésille, où la ' +
          'couleur commence. On n’ouvre pas. Au bout de vingt minutes, on baisse le four à trois cent ' +
          'soixante-quinze, toujours sans ouvrir : le reste de la cuisson se fait plus doucement, pour ' +
          'que l’intérieur rattrape l’extérieur sans que la peau brûle. Le four fait le travail, vous ' +
          'faites autre chose.',
        piege: 'Arroser toutes les dix minutes en ouvrant la porte : le four perd 50 °F à chaque fois et la peau ramollit.',
        reussite: 'À vingt minutes, la peau est déjà dorée par endroits et le lit de légumes commence à sentir.',
      },
      {
        titre: 'Le thermomètre, pas l’horloge',
        scene: 'thermometre',
        duree: '50 à 70 min',
        minuterie: 50,
        texte:
          'Après 50 minutes à 375 °F, première mesure : sonde entre la cuisse et le corps, sans toucher ' +
          'l’os. Cible : 175 °F. La poitrine, au plus épais : 160 °F. Comptez environ 1 h 15 à 1 h 30 ' +
          'au total pour 1,8 kg, mais c’est le thermomètre qui décide. Remesurez toutes les 10 minutes.',
        voix:
          'Au bout de cinquante minutes, on mesure pour la première fois. La sonde entre la cuisse et ' +
          'le corps, là où c’est le plus épais, sans toucher l’os — l’os est plus chaud et vous ' +
          'mentirait. Je veux cent soixante-quinze à la cuisse. Et je vérifie la poitrine au plus ' +
          'gros : cent soixante. Si vous n’y êtes pas, dix minutes de plus et on remesure. Pour un ' +
          'poulet de ce poids, on arrive généralement entre une heure et quart et une heure et demie, ' +
          'mais je vous en prie, oubliez ce chiffre. Deux poulets du même poids n’ont pas la même ' +
          'forme, deux fours n’ont pas la même chaleur. Le thermomètre, lui, dit toujours la vérité.',
        piege: 'Se fier au « jus clair » ou à la patte qui bouge : ce sont des signes de poulet trop cuit, pas de poulet cuit.',
        reussite: 'Cuisse à 175 °F, poitrine à 160 °F, peau acajou, jus qui grésille dans le plat.',
      },
      {
        titre: 'Le repos : quinze minutes',
        scene: 'assiette',
        duree: '15 min',
        minuterie: 15,
        texte:
          'Sortez le poulet sur une planche, posé sur son dos ou incliné pour que le jus de la cavité ' +
          'coule dans le plat. Laissez-le 15 minutes, sans le couvrir. La poitrine monte à 165 °F ' +
          'pendant ce temps.',
        voix:
          'On sort le poulet du plat, sur la planche, et on le laisse tranquille quinze minutes. Pas ' +
          'de papier d’aluminium serré : la peau ramollirait. Pendant ce repos, la chaleur de ' +
          'l’extérieur continue de voyager vers le centre — la poitrine gagne encore cinq degrés — et ' +
          'les fibres se détendent et reprennent leur jus. Un poulet coupé tout de suite perd une ' +
          'flaque dans la planche. Un poulet reposé garde tout dans la chair. Quinze minutes, c’est ' +
          'exactement le temps de faire le jus.',
        piege: 'Couper avant le repos, parce que tout le monde a faim. Servez le pain, faites le jus, et attendez.',
        reussite: 'Après quinze minutes, la poitrine mesure 165 °F, et la planche est presque sèche.',
      },
      {
        titre: 'Le jus de cuisson',
        scene: 'casserole',
        duree: '8 min',
        minuterie: null,
        texte:
          'Mettez le plat sur le feu. Versez {{eau}}, grattez les sucs à la cuillère de bois, écrasez un ' +
          'peu les légumes, laissez frémir 3 minutes. Passez au chinois, dégraissez à la cuillère, ' +
          'goûtez, salez si besoin. Ajoutez le jus qui a coulé de la cavité.',
        voix:
          'Le plat, avec ses légumes caramélisés et ses sucs collés au fond, c’est la sauce qui ' +
          'attend. Sur le feu, {{eau}} ou du fond si vous en avez, et on gratte — tout ce qui est ' +
          'brun et collé, c’est du goût. Écrasez un peu les légumes, laissez frémir trois minutes, ' +
          'passez au chinois dans une petite casserole. Le gras remonte : cueillez-le à la cuillère. ' +
          'Goûtez. Le sel de la veille est déjà là, souvent il n’en manque pas. Et ajoutez le jus qui ' +
          'a coulé de la cavité pendant le repos : c’est le meilleur.',
        piege: 'Jeter les légumes du lit « parce qu’ils sont brûlés » : les parties brunes font le jus, les parties noires se retirent à la main.',
        reussite: 'Un jus brun clair, brillant, qui goûte le poulet et le thym, sans gras en surface.',
      },
      {
        titre: 'Découper',
        scene: 'planche',
        duree: '5 min',
        minuterie: null,
        texte:
          'Cuisses d’abord : incisez la peau entre la cuisse et le corps, écartez la cuisse jusqu’à ce ' +
          'que l’articulation saute, coupez à travers. Séparez pilon et haut de cuisse à la jointure. ' +
          'Poitrines : longez l’os du bréchet de la pointe du couteau, suivez la cage thoracique, ' +
          'détachez chaque poitrine entière, puis tranchez-la en travers.',
        voix:
          'Le découpage, calmement. Les cuisses en premier : incisez la peau entre la cuisse et le ' +
          'corps, prenez la cuisse dans la main et écartez-la jusqu’à ce que l’articulation saute. ' +
          'Vous entendez le petit craquement ? Coupez à travers, c’est fait. Séparez le pilon du haut ' +
          'de cuisse à la jointure — cherchez la ligne de gras, le couteau y passe tout seul. Puis les ' +
          'poitrines : la pointe du couteau le long de l’os du milieu, le bréchet, et vous suivez la ' +
          'cage thoracique en descendant, la lame contre l’os, jusqu’à détacher la poitrine entière. ' +
          'Tranchez-la en travers, en gardant la peau sur chaque tranche. Le jus à côté. Et regardez ' +
          'cette poitrine : rosée de jus, pas rose de sang. C’est ça, un poulet rôti.',
        piege: 'Scier la poitrine sur l’os avec un couteau émoussé : on la déchiquette. La pointe suit l’os, la lame ne le combat pas.',
        reussite: 'Huit morceaux nets, la peau intacte sur chacun, et une carcasse propre — qui va droit au congélateur pour le fond.',
      },
    ],
    debrief: {
      reussi:
        'Une poitrine juteuse et une cuisse fondante dans le même poulet : vous venez de résoudre le ' +
        'problème que la plupart des cuisiniers du dimanche n’ont jamais résolu. La carcasse est au ' +
        'congélateur ? Alors la leçon d’Aurèle sur le fond vous attend.',
      aRefaire:
        'Poitrine sèche ? Elle a dépassé 165 °F : mesurez-la plus tôt, et sortez le poulet dès que la ' +
        'cuisse est à 175. Cuisse rosée à l’os ? Les pattes étaient trop serrées contre le corps. ' +
        'Peau molle ? Elle n’a pas séché au frigo, ou vous avez couvert au repos. Rien de tout ça ' +
        'n’est grave : c’est un réglage.',
    },
  },

  {
    id: 'mafe-ragout-arachide',
    parcoursId: 'feu',
    chefId: 'amadou',
    numero: 3,
    titre: 'Le mafé : un ragoût bâti couche par couche',
    accroche: 'Colorer, suer, cuire la tomate, délayer l’arachide : quatre couches, un plat.',
    gratuit: false,
    statut: 'en-preparation',
    duree: 150,
    difficulte: 2,
    techniques: ['colorer', 'braiser', 'fremissement'],
    conseilleApres: ['saisir'],
    portions: 6,
    resultat: 'Un ragoût de bœuf à l’arachide, épais et brillant, dont le gras remonte en perles dorées.',
    pourquoi: '',
    materiel: [],
    ingredients: [],
    etapes: [],
    debrief: { reussi: '', aRefaire: '' },
  },

  /* =====================================================================
     PARCOURS 3 — LA MÉMOIRE DU QUÉBEC (Mamie Rosalie)
     ===================================================================== */
  {
    id: 'tourtiere-de-rosalie',
    parcoursId: 'quebec',
    chefId: 'rosalie',
    numero: 1,
    titre: 'La tourtière de Rosalie',
    accroche: 'Une pâte qui feuillette, une farce qui ne coule pas, et la cheminée qui fait tout tenir.',
    gratuit: false,
    statut: 'publiee',
    duree: 150,
    difficulte: 2,
    techniques: ['sablage', 'abaisser', 'farce', 'dorer', 'thermometre'],
    conseilleApres: ['ciseler'],
    portions: 8,
    portionsLibelle: 'parts',
    resultat:
      'Une tourtière de 23 cm, la croûte dorée et croustillante jusque dessous, la farce moelleuse, ' +
      'parfumée de cannelle, de clou et de sarriette, qui se tranche net sans s’effondrer.',
    pourquoi:
      'Une tourtière rate de deux façons : la croûte du dessous est molle, ou la farce est sèche. ' +
      'Les deux ont la même cause — l’eau au mauvais endroit. Une farce encore chaude posée sur la ' +
      'pâte fait fondre le beurre avant que le four ait pu le figer : la pâte boit, elle ne ' +
      'croustille plus. Et une farce trop mouillée détrempe tout, tandis qu’une farce qu’on a fait ' +
      'réduire trop longtemps devient de la sciure.\n\n' +
      'La pomme de terre règle la seconde question : écrasée dans la viande, elle absorbe les jus ' +
      'et les garde dans la tranche au lieu de les laisser couler dans la pâte. Le refroidissement ' +
      'complet de la farce règle la première. Le reste — le sablage, la cheminée, le repos avant de ' +
      'couper — c’est de la patience, et Rosalie en a pour deux.',
    materiel: [
      'Une assiette à tarte de 23 cm (9 po), en métal ou en verre',
      'Un rouleau à pâte',
      'Un grand bol froid et un couteau à pâte, ou simplement les doigts',
      'Une grande poêle ou une sauteuse',
      'Un pinceau pour la dorure, un thermomètre',
    ],
    avertissements: [
      {
        titre: 'Viande hachée : 160 °F',
        texte:
          'La viande hachée mélange la surface et l’intérieur ; Santé Canada demande 71 °C (160 °F) à ' +
          'cœur. Ici elle cuit deux fois — à la poêle, puis au four — et la tourtière sort à plus de ' +
          '165 °F au centre. Vérifiez au thermomètre par la cheminée.',
      },
    ],
    temperatures: [
      { quoi: 'Le four, départ', f: 400, note: 'Vingt minutes, grille du bas, pour saisir la croûte du dessous' },
      { quoi: 'Le four, fin', f: 350, note: 'Trente à trente-cinq minutes pour dorer sans brûler' },
      { quoi: 'Le centre de la farce', f: 165, note: 'Mesuré par la cheminée' },
    ],
    ingredients: [
      { cle: 'farine', q: 375, u: 'g', nom: 'Farine tout usage', groupe: 'La pâte brisée', rayon: 'pantry' },
      { cle: 'sel-pate', q: 5, u: 'g', nom: 'Sel', groupe: 'La pâte brisée', rayon: 'pantry' },
      { cle: 'beurre', q: 190, u: 'g', nom: 'Beurre froid', groupe: 'La pâte brisée', note: 'En dés. Ou moitié beurre, moitié saindoux : c’est la pâte de nos mères', rayon: 'dairy' },
      { cle: 'eau', q: 110, u: 'ml', nom: 'Eau', groupe: 'La pâte brisée', note: 'Glacée : un glaçon dedans pendant qu’on sable', rayon: null },
      { cle: 'vinaigre', q: 5, u: 'ml', nom: 'Vinaigre blanc', groupe: 'La pâte brisée', note: 'Une cuillère à thé : la pâte reste tendre et ne se rétracte pas', rayon: 'pantry' },
      { cle: 'porc', q: 500, u: 'g', nom: 'Porc haché mi-maigre', groupe: 'La farce', rayon: 'meats' },
      { cle: 'veau', q: 250, u: 'g', nom: 'Veau haché', groupe: 'La farce', substitution: 'Du bœuf haché maigre', rayon: 'meats' },
      { cle: 'oignon', q: 200, u: 'g', nom: 'Oignon jaune', groupe: 'La farce', note: 'Un gros, haché fin', rayon: 'produce' },
      { cle: 'ail', q: 1, u: '', nom: 'Gousse d’ail, hachée', groupe: 'La farce', rayon: 'produce' },
      { cle: 'patate', q: 200, u: 'g', nom: 'Pomme de terre', groupe: 'La farce', note: 'Une moyenne, bouillie et écrasée à la fourchette', rayon: 'produce' },
      { cle: 'bouillon', q: 125, u: 'ml', nom: 'Bouillon de poulet', groupe: 'La farce', substitution: 'De l’eau', rayon: 'pantry' },
      { cle: 'sel', q: 6, u: 'g', nom: 'Sel', groupe: 'La farce', note: 'Une cuillère à thé', rayon: 'pantry' },
      { cle: 'poivre', q: 2, u: 'g', nom: 'Poivre noir moulu', groupe: 'La farce', rayon: 'pantry' },
      { cle: 'cannelle', q: 1, u: 'g', nom: 'Cannelle moulue', groupe: 'La farce', note: 'Un quart de cuillère à thé', rayon: 'pantry' },
      { cle: 'clou', q: 0.5, u: 'g', nom: 'Clou de girofle moulu', groupe: 'La farce', note: 'Une bonne pincée — le clou se sent vite', rayon: 'pantry' },
      { cle: 'sarriette', q: 1, u: 'g', nom: 'Sarriette séchée', groupe: 'La farce', note: 'Une demi-cuillère à thé ; c’est l’herbe du Québec', substitution: 'Du thym séché', rayon: 'pantry' },
      { cle: 'oeuf', q: 1, u: '', nom: 'Œuf', groupe: 'La dorure', note: 'Battu avec une cuillère à soupe de lait', rayon: 'dairy' },
    ],
    etapes: [
      {
        titre: 'La pâte : le sablage',
        scene: 'bol',
        duree: '10 min, puis 30 min de repos',
        minuterie: 30,
        texte:
          'Mélangez {{farine}} et {{sel-pate}}. Ajoutez {{beurre}} en dés et écrasez-le du bout ' +
          'des doigts jusqu’à obtenir des morceaux de la taille d’un pois, pas plus petits. Versez ' +
          '{{eau}} mélangée à {{vinaigre}}, rassemblez sans pétrir, formez deux disques, filmez, 30 ' +
          'minutes au frigo.',
        voix:
          'Ma mère disait : la pâte, on la touche comme un bébé qui dort. Le moins possible. ' +
          '{{farine}}, {{sel-pate}}, et {{beurre}}, en dés. Vous écrasez les dés entre le ' +
          'pouce et les doigts, vite, pour ne pas les réchauffer, jusqu’à des morceaux gros comme des ' +
          'pois. Pas de la chapelure — des pois. Ce sont ces morceaux de beurre qui, en fondant au ' +
          'four, laisseront des poches de vapeur : c’est ça qui feuillette. Ensuite {{eau}} glacée avec ' +
          '{{vinaigre}} — le vinaigre, c’est le truc de ma tante Yvonne, la pâte reste tendre. On ' +
          'rassemble, on ne pétrit pas, deux disques, et au frigo une demi-heure. Le beurre redurcit, ' +
          'la farine se détend. Pendant ce temps, on fait la farce.',
        piege: 'Travailler la pâte jusqu’à ce qu’elle soit lisse : le beurre a fondu, il n’y aura pas de feuilles, elle sera dure.',
        reussite: 'On voit encore des grains de beurre dans la pâte, et elle tient en boule quand on la presse sans coller aux doigts.',
      },
      {
        titre: 'Suer l’oignon',
        scene: 'poele',
        duree: '8 min',
        minuterie: 8,
        texte:
          'Dans la grande poêle, à feu moyen, faites fondre {{oignon}} dans une noix de beurre, 6 à 8 ' +
          'minutes, sans le colorer. Ajoutez {{ail}} la dernière minute.',
        voix:
          'La farce commence par l’oignon, et l’oignon, on le fait suer : feu moyen, une noix de ' +
          'beurre, {{oignon}} haché fin — vous vous rappelez comment on cisèle ? Six, huit minutes, ' +
          'jusqu’à ce qu’il devienne translucide et sucré, sans prendre couleur. Un oignon doré, c’est ' +
          'bon dans une soupe ; dans une tourtière, il goûterait le brûlé sous les épices. {{ail}} à la ' +
          'fin, une minute, pas plus.',
        piege: 'Feu trop fort : l’oignon dore avant d’être fondu, et reste croquant dans la farce.',
        reussite: 'L’oignon est transparent, souple, et sent le sucre.',
      },
      {
        titre: 'Cuire la viande doucement',
        scene: 'poele',
        duree: '20 min',
        minuterie: 20,
        texte:
          'Ajoutez {{porc}} et {{veau}}, défaites-les à la cuillère de bois, et cuisez jusqu’à ce qu’il ' +
          'ne reste plus de rose. Ajoutez {{sel}}, {{poivre}}, {{cannelle}}, {{clou}}, {{sarriette}} et ' +
          '{{bouillon}}. Laissez mijoter à découvert 20 minutes, en remuant : la farce doit rester ' +
          'moelleuse et brillante, jamais sèche, jamais noyée.',
        voix:
          'Maintenant la viande : {{porc}} et {{veau}}, et vous la défaites à la cuillère de bois, en ' +
          'petits grains, jusqu’à ce qu’il n’y ait plus de rose. Puis les épices : {{sel}}, {{poivre}}, ' +
          '{{cannelle}}, {{clou}} — attention au clou, une pincée parfume, deux pincées empoisonnent — ' +
          'et {{sarriette}}, l’herbe de chez nous. {{bouillon}}, et on laisse mijoter vingt minutes à ' +
          'découvert, en remuant de temps en temps. Ce qu’on cherche, c’est une farce qui brille sans ' +
          'nager. Si elle nage, elle mouillera la pâte. Si elle est sèche, la tourtière sera de la ' +
          'sciure. Regardez-la, goûtez-la : elle doit sembler un tout petit peu trop assaisonnée, ' +
          'parce qu’elle sera mangée avec de la pâte, et souvent froide le lendemain.',
        piege: 'Faire réduire à sec « pour que ça ne coule pas » : c’est la pomme de terre qui empêche de couler, pas la sécheresse.',
        reussite: 'Une cuillère posée dans la farce laisse une trace qui se referme lentement ; le jus est là, mais il ne coule pas.',
      },
      {
        titre: 'Lier avec la pomme de terre, puis refroidir',
        scene: 'frigo',
        duree: '5 min, puis 30 min de repos',
        minuterie: 30,
        texte:
          'Écrasez {{patate}} bouillie à la fourchette et mélangez-la à la farce chaude : elle boit le ' +
          'jus et le retient dans la tranche. Goûtez, rectifiez. Étalez la farce dans un plat et ' +
          'laissez-la refroidir complètement — 30 minutes au frigo au moins.',
        voix:
          '{{patate}} bouillie, écrasée à la fourchette, dans la farce chaude. Mélangez bien. Voilà le ' +
          'secret de la tranche qui tient : la pomme de terre boit le jus et le garde dans la farce au ' +
          'lieu de le laisser couler dans la pâte. Goûtez une dernière fois. Et maintenant, la chose ' +
          'que personne ne veut faire parce qu’on a hâte : on attend. La farce va dans un plat, étalée, ' +
          'et au frigo jusqu’à ce qu’elle soit froide. Complètement froide. Une farce chaude sur une pâte ' +
          'au beurre, c’est du beurre fondu avant le four, et une croûte du dessous molle à jamais.',
        piege: 'Remplir la tourtière avec une farce tiède. C’est la cause numéro un du fond mou.',
        reussite: 'La farce est froide au toucher, ferme, et se tient en bloc quand on la soulève à la cuillère.',
      },
      {
        titre: 'Abaisser et foncer',
        scene: 'pate',
        duree: '15 min',
        minuterie: null,
        texte:
          'Farinez légèrement. Abaissez le premier disque à 3 mm, en un cercle de 30 cm, en tournant la ' +
          'pâte d’un quart de tour entre chaque passage. Déposez-la dans l’assiette sans l’étirer, ' +
          'appuyez au fond. Versez la farce froide, tassez légèrement, laissez un dôme au centre. ' +
          'Abaissez le second disque.',
        voix:
          'On sort la pâte. Un peu de farine sur le comptoir, le rouleau, et on abaisse en partant du ' +
          'centre vers l’extérieur, un quart de tour entre chaque passage pour garder le rond. Trois ' +
          'millimètres — l’épaisseur d’une pièce de deux dollars — et trente centimètres de large pour ' +
          'une assiette de vingt-trois. Roulez-la sur le rouleau pour la soulever, déroulez-la sur ' +
          'l’assiette, et laissez-la tomber dans le fond toute seule : si vous l’étirez, elle se ' +
          'rétractera au four. Appuyez doucement dans les coins. La farce froide dessus, un peu ' +
          'tassée, avec un petit dôme au milieu. Puis le second disque, pareil.',
        piege: 'Étirer la pâte pour qu’elle arrive au bord : elle se rétracte à la cuisson et le bord glisse dans l’assiette.',
        reussite: 'La pâte épouse l’assiette sans plis ni trous, et déborde de 2 cm tout autour.',
      },
      {
        titre: 'Couvrir, pincer, la cheminée',
        scene: 'pate',
        duree: '5 min',
        minuterie: null,
        texte:
          'Badigeonnez le bord de la pâte du dessous avec {{oeuf}}. Posez le couvercle de pâte, ' +
          'pressez les bords ensemble, coupez l’excédent à 1 cm, roulez-le vers l’intérieur et pincez ' +
          'tout le tour. Au centre, découpez une cheminée d’un centimètre : la vapeur doit sortir.',
        voix:
          'Un peu de dorure au pinceau sur le bord du dessous — c’est la colle. Le couvercle par-dessus, ' +
          'vous pressez les deux pâtes ensemble tout le tour, et vous coupez ce qui dépasse à un ' +
          'centimètre du bord. Ce centimètre, on le roule vers l’intérieur, comme un ourlet, et on ' +
          'pince entre le pouce et l’index, tout le tour : ça fait joli, et surtout, ça scelle. Et au ' +
          'milieu, la cheminée. Un petit trou d’un centimètre, ou une croix. Sans cheminée, la vapeur ' +
          'de la farce pousse la pâte, la décolle, et finit par la percer là où elle veut, pas là où ' +
          'vous voulez. C’est par la cheminée qu’on prendra la température, tout à l’heure.',
        piege: 'Oublier la cheminée. La tourtière gonfle, se fend sur le côté, et le jus coule sur la plaque.',
        reussite: 'Un bord pincé régulier, une cheminée nette au centre, et pas de pâte qui pend.',
      },
      {
        titre: 'Dorer et enfourner à 400 °F',
        scene: 'four',
        duree: '20 min',
        minuterie: 20,
        texte:
          'Badigeonnez tout le dessus de {{oeuf}}, sans en laisser couler dans la cheminée. Enfournez ' +
          'sur la grille du bas d’un four préchauffé à 400 °F, 20 minutes : la chaleur du bas saisit la ' +
          'croûte du dessous avant que la farce ne l’humidifie.',
        voix:
          'La dorure sur tout le dessus, au pinceau, en couche fine — l’œuf et le lait, c’est ce qui ' +
          'donne la couleur acajou et le brillant. Pas dans la cheminée, elle doit rester ouverte. Et ' +
          'au four, sur la grille du bas. Du bas, oui : la chaleur y est plus forte, et c’est la croûte ' +
          'du dessous qui doit cuire en premier, avant que la farce ait le temps de la mouiller. ' +
          'Quatre cents degrés, vingt minutes. Vous allez sentir les épices dans toute la maison.',
        piege: 'Enfourner au centre du four « comme d’habitude » : le dessus dore, le dessous reste blond et mou.',
        reussite: 'À vingt minutes, le bord est déjà doré et la pâte s’est légèrement soulevée.',
      },
      {
        titre: 'Finir à 350 °F',
        scene: 'four',
        duree: '30 à 35 min',
        minuterie: 30,
        texte:
          'Baissez à 350 °F et poursuivez 30 à 35 minutes, jusqu’à ce que la croûte soit uniformément ' +
          'dorée et que la farce bouillonne doucement dans la cheminée. Le thermomètre, glissé par la ' +
          'cheminée, doit dire au moins 165 °F.',
        voix:
          'On baisse à trois cent cinquante et on laisse aller, trente, trente-cinq minutes. Ce qu’on ' +
          'attend : une croûte dorée partout, pareille au centre et sur les bords, et la farce qui fait ' +
          'des petites bulles dans la cheminée. Glissez le thermomètre par la cheminée jusqu’au milieu : ' +
          'cent soixante-cinq, au moins. Si le bord dore trop vite, une bande de papier d’aluminium ' +
          'posée dessus, sans serrer.',
        piege: 'Sortir la tourtière dès qu’elle est dorée sans vérifier le centre : dorée dessus ne veut pas dire chaude dedans.',
        reussite: 'Couleur acajou uniforme, bulles dans la cheminée, 165 °F au centre.',
      },
      {
        titre: 'Attendre avant de couper',
        scene: 'assiette',
        duree: '15 min',
        minuterie: 15,
        texte:
          'Laissez reposer 15 minutes sur une grille. La farce se raffermit et la tranche se tiendra. ' +
          'Servez avec du ketchup aux fruits ou des betteraves marinées. La tourtière se congèle très ' +
          'bien, cuite ou crue.',
        voix:
          'Quinze minutes sur une grille avant de couper. Je sais. Mais une tourtière coupée à la ' +
          'sortie du four s’écroule dans l’assiette ; quinze minutes plus tard, la farce a repris, et ' +
          'la tranche tient debout, la croûte craque, la farce est moelleuse. Le ketchup aux fruits à ' +
          'côté, ou les betteraves de ma mère. Et si vous en faites deux — faites-en deux —, la ' +
          'seconde se congèle crue, telle quelle, et cuit un jour de semaine sans que vous ayez rien ' +
          'à faire. C’est comme ça qu’on se souvient de quelqu’un : en trouvant une tourtière dans son ' +
          'congélateur.',
        piege: 'Couvrir la tourtière chaude : la croûte ramollit dans sa propre vapeur.',
        reussite: 'La première tranche se lève entière ; le fond est doré et craque sous la fourchette.',
      },
    ],
    debrief: {
      reussi:
        'Le fond croustille et la tranche tient ? Vous avez la main. Cette pâte brisée fera aussi ' +
        'vos tartes salées et vos pâtés — et la prochaine fois, doublez-la : elle se congèle en disques.',
      aRefaire:
        'Fond mou : la farce était tiède, ou la tourtière a cuit au centre du four. Farce sèche : elle a ' +
        'réduit trop longtemps, ou la pomme de terre manquait. Pâte dure : trop travaillée, ou pas ' +
        'assez de repos. On recommence dimanche prochain ; c’est ce que faisaient toutes nos mères.',
    },
  },

  {
    id: 'ragout-boulettes-roux-brun',
    parcoursId: 'quebec',
    chefId: 'rosalie',
    numero: 2,
    titre: 'Le ragoût de boulettes et le roux brun grillé',
    accroche: 'La farine grillée à sec, jusqu’à la couleur de la cannelle : le goût du temps des fêtes.',
    gratuit: false,
    statut: 'en-preparation',
    duree: 150,
    difficulte: 2,
    techniques: ['roux', 'braiser', 'farce'],
    conseilleApres: ['ciseler'],
    portions: 8,
    resultat: 'Des boulettes tendres dans une sauce brune, lisse et parfumée, qui nappe sans coller.',
    pourquoi: '',
    materiel: [],
    ingredients: [],
    etapes: [],
    debrief: { reussi: '', aRefaire: '' },
  },

  {
    id: 'tarte-au-sucre-a-la-creme',
    parcoursId: 'quebec',
    chefId: 'rosalie',
    numero: 3,
    titre: 'La tarte au sucre à la crème — et pourquoi elle ne coule pas',
    accroche: 'Cassonade, crème et une température à respecter pour qu’elle prenne sans devenir du caramel.',
    gratuit: false,
    statut: 'en-preparation',
    duree: 90,
    difficulte: 1,
    techniques: ['sablage', 'abaisser', 'thermometre'],
    conseilleApres: ['sablage'],
    portions: 8,
    resultat: 'Une tarte au sucre qui tremble au centre à la sortie du four et se tranche net une fois froide.',
    pourquoi: '',
    materiel: [],
    ingredients: [],
    etapes: [],
    debrief: { reussi: '', aRefaire: '' },
  },

  /* =====================================================================
     PARCOURS 4 — PRÉCISION ET TEXTURE (Chef Naoko)
     ===================================================================== */
  {
    id: 'riz-parfait-dashi',
    parcoursId: 'precision',
    chefId: 'naoko',
    numero: 1,
    titre: 'Le riz parfait et le dashi',
    accroche: 'Deux ingrédients, quatre gestes, et une précision qui change tout le repas.',
    gratuit: true,
    statut: 'publiee',
    duree: 75,
    difficulte: 1,
    techniques: ['laver-le-riz', 'absorption', 'infusion', 'passer'],
    conseilleApres: [],
    portions: 4,
    resultat:
      'Un riz à grain court aux grains distincts et brillants, qui tiennent ensemble sans coller, et ' +
      'un litre de dashi limpide et ambré — le bouillon de base de toute la cuisine japonaise.',
    pourquoi:
      'Le riz ne rate pas au hasard. Il rate parce qu’il y avait trop d’amidon de surface — les ' +
      'grains collent en pâte —, ou pas assez d’eau au cœur du grain — il reste crayeux —, ou parce ' +
      'qu’on a soulevé le couvercle et laissé partir la vapeur qui finissait la cuisson. Laver, ' +
      'tremper, ne pas ouvrir : trois réponses à trois problèmes.\n\n' +
      'Le dashi enseigne l’inverse du fond d’Aurèle : la vitesse. Le kombu libère son umami dans ' +
      'une eau tiède et devient gluant et amer si on le fait bouillir ; les flocons de bonite donnent ' +
      'tout en une minute et prennent un goût de poisson si on insiste. C’est un bouillon qu’on ' +
      'infuse comme un thé, pas qu’on mijote comme une soupe.',
    materiel: [
      'Une casserole lourde avec un couvercle qui ferme bien',
      'Un bol et une passoire fine pour laver le riz',
      'Une seconde casserole pour le dashi, et un thermomètre',
      'Une passoire fine et, idéalement, une étamine ou un linge propre',
      'Une spatule à riz, ou une spatule en bois mouillée',
    ],
    temperatures: [
      { quoi: 'Le kombu — retirer avant', f: 185, note: 'Aux premières petites bulles sur les bords de l’algue ; jamais à l’ébullition' },
      { quoi: 'La bonite', f: 200, note: 'Dans l’eau juste sous l’ébullition, hors du feu, une minute' },
    ],
    ingredients: [
      { cle: 'riz', q: 300, u: 'g', nom: 'Riz japonais à grain court', groupe: 'Le riz', note: 'Koshihikari, ou du Calrose de Californie', rayon: 'pantry' },
      { cle: 'eau-riz', q: 360, u: 'ml', nom: 'Eau froide pour le riz', groupe: 'Le riz', note: '1,2 fois le volume du riz lavé', rayon: null },
      { cle: 'eau-dashi', q: 1000, u: 'ml', nom: 'Eau froide pour le dashi', groupe: 'Le dashi', rayon: null },
      { cle: 'kombu', q: 10, u: 'g', nom: 'Kombu (algue séchée)', groupe: 'Le dashi', note: 'Un morceau de 10 cm ; épiceries asiatiques et boutiques d’aliments naturels', rayon: 'pantry' },
      { cle: 'bonite', q: 15, u: 'g', nom: 'Flocons de bonite (katsuobushi)', groupe: 'Le dashi', note: 'Deux grosses poignées', substitution: '3 shiitakes séchés, trempés avec le kombu, pour un dashi végétal', rayon: 'pantry' },
    ],
    etapes: [
      {
        titre: 'Laver le riz',
        scene: 'bol',
        duree: '5 min',
        minuterie: null,
        texte:
          'Mettez {{riz}} dans un bol, couvrez d’eau froide, remuez doucement du bout des doigts, ' +
          'égouttez aussitôt — la première eau, trouble, est la pire. Répétez quatre ou cinq fois, ' +
          'jusqu’à ce que l’eau soit presque claire. Ne frottez pas : les grains casseraient.',
        voix:
          'Le riz d’abord. {{riz}} dans un bol, de l’eau froide dessus, et vous remuez du bout des ' +
          'doigts, comme si vous cherchiez quelque chose au fond. L’eau devient blanche — c’est ' +
          'l’amidon de surface, celui qui colle. Égouttez tout de suite : cette première eau, le riz ne ' +
          'doit pas la boire. Encore de l’eau, remuez, égouttez. Quatre, cinq fois. Quand l’eau reste ' +
          'presque claire, c’est fait. Doucement : on ne frotte pas, on ne presse pas. Un grain cassé ' +
          'libère son amidon et colle tout autour de lui.',
        piege: 'Laisser le riz tremper dans sa première eau trouble : il absorbe justement ce qu’on voulait enlever.',
        reussite: 'À la cinquième eau, on voit les grains à travers ; ils sont blancs, entiers, brillants.',
      },
      {
        titre: 'Tremper trente minutes',
        scene: 'bol',
        duree: '30 min',
        minuterie: 30,
        texte:
          'Égouttez bien, versez le riz dans la casserole avec {{eau-riz}} — l’eau de cuisson elle-même — ' +
          'et laissez tremper 30 minutes. Le cœur du grain s’hydrate ; sans cela, l’extérieur est cuit ' +
          'quand le centre est encore crayeux.',
        voix:
          'Égouttez le riz une bonne minute, puis mettez-le dans la casserole avec {{eau-riz}}. C’est ' +
          'l’eau de cuisson : on trempe dedans, et on cuit dedans, alors on la mesure une fois pour ' +
          'toutes. Trente minutes de trempage. Pendant ce temps, l’eau pénètre jusqu’au centre du grain. ' +
          'Un riz qui n’a pas trempé cuit de l’extérieur vers l’intérieur et il est collant dehors, ' +
          'dur dedans. Un riz qui a trempé cuit partout à la fois. C’est l’étape qui semble inutile, ' +
          'et c’est celle qui fait la texture.',
        piege: 'Ajouter de l’eau « au pif » après le trempage : le rapport est fixé, 1,2 volume d’eau pour 1 de riz lavé.',
        reussite: 'Les grains sont devenus blanc opaque, un peu plus gros, et l’eau est claire.',
      },
      {
        titre: 'L’ébullition, puis le calme',
        scene: 'riz',
        duree: '17 min',
        minuterie: 12,
        texte:
          'Couvercle fermé, feu moyen-vif jusqu’à l’ébullition : 4 à 5 minutes, on l’entend au ' +
          'cliquetis du couvercle. Baissez immédiatement au minimum et cuisez 12 minutes. Ne soulevez ' +
          'pas le couvercle : la vapeur est la cuisson.',
        voix:
          'Le couvercle fermé, feu moyen-vif. Vous allez entendre l’ébullition arriver : le couvercle ' +
          'commence à cliqueter, la vapeur s’échappe sur les côtés. C’est le signal. Vous baissez tout ' +
          'de suite au minimum, et vous lancez douze minutes. Et pendant ces douze minutes, on ne ' +
          'soulève pas le couvercle. Pas pour regarder, pas pour goûter. L’eau libre disparaît vite ; ' +
          'ensuite, c’est la vapeur enfermée qui finit de cuire le grain. Ouvrir, c’est la laisser partir.',
        piege: 'Remuer le riz pendant la cuisson : les grains cassent et libèrent l’amidon qu’on avait lavé.',
        reussite: 'À la fin des douze minutes, un léger crépitement au fond de la casserole, et plus aucune vapeur qui siffle.',
      },
      {
        titre: 'Le repos, couvercle fermé',
        scene: 'riz',
        duree: '10 min',
        minuterie: 10,
        texte:
          'Éteignez et laissez reposer 10 minutes, toujours couvert. L’humidité se répartit, les grains ' +
          'se raffermissent. Puis ouvrez, et aérez avec une spatule mouillée en gestes de coupe, du bord ' +
          'vers le centre, sans écraser.',
        voix:
          'Éteignez, et attendez encore dix minutes, couvercle fermé. Le riz finit de boire son eau, ' +
          'et les grains, encore fragiles, se raffermissent. Ensuite, ouvrez : la vapeur monte, le riz ' +
          'brille. Mouillez une spatule et aérez-le : des gestes de coupe, comme si vous tranchiez, du ' +
          'bord vers le centre, en soulevant. Pas en tournant — tourner, c’est écraser. Chaque grain ' +
          'doit se détacher tout en tenant aux autres. C’est ça, le riz parfait.',
        piege: 'Servir sans aérer : la vapeur retombe en eau, et le dessous devient pâteux.',
        reussite: 'Des grains distincts, brillants, qui se tiennent en bouchée quand on les presse doucement.',
      },
      {
        titre: 'Le kombu à froid',
        scene: 'casserole',
        duree: '30 min',
        minuterie: 30,
        texte:
          'Pendant que le riz trempe : mettez {{kombu}} dans {{eau-dashi}} et laissez-le 30 ' +
          'minutes — ou toute une nuit au frigo. N’essuyez pas la poudre blanche à sa surface : c’est ' +
          'du sucre naturel, et du goût.',
        voix:
          'Le dashi commence pendant que le riz trempe. {{kombu}} dans {{eau-dashi}}. Vous ' +
          'verrez une poudre blanche sur l’algue : ne l’essuyez pas, ce n’est pas de la poussière, ' +
          'c’est du mannitol, un sucre naturel. Trente minutes à froid, l’algue se déplie et commence ' +
          'à donner. Si vous pouvez, faites-le la veille au frigo : le dashi n’en sera que meilleur, ' +
          'et le lendemain, il ne restera que dix minutes de travail.',
        piege: 'Rincer le kombu. On enlève justement ce qui fait le goût.',
        reussite: 'L’algue est souple et deux fois plus large ; l’eau a pris une teinte légèrement dorée.',
      },
      {
        titre: 'Chauffer sans bouillir',
        scene: 'thermometre',
        duree: '10 min',
        minuterie: null,
        texte:
          'Chauffez doucement, à feu moyen-doux. Quand de petites bulles apparaissent sur les bords de ' +
          'l’algue — vers 175 à 185 °F —, retirez le kombu. À l’ébullition, il devient gluant et amer.',
        voix:
          'Feu moyen-doux, et on regarde. Le thermomètre dans l’eau : on monte lentement. Vers cent ' +
          'soixante-quinze, cent quatre-vingt-cinq degrés, de petites bulles se forment sur les bords de ' +
          'l’algue, et l’eau commence à sentir la mer, doucement. C’est là qu’on retire le kombu. Pas ' +
          'plus tard. Bouilli, il libère une substance gluante et un goût amer, et le bouillon se ' +
          'trouble. Le kombu, on le sort quand il a encore l’air de vouloir rester.',
        piege: 'Se dire « encore deux minutes, pour plus de goût ». Le goût n’augmente plus ; l’amertume, oui.',
        reussite: 'Un bouillon limpide, doré pâle, au parfum marin et doux — et un kombu encore ferme, qu’on peut réutiliser une fois.',
      },
      {
        titre: 'La bonite, une minute',
        scene: 'casserole',
        duree: '2 min',
        minuterie: 1,
        texte:
          'Montez le feu jusqu’au tout début de l’ébullition, éteignez, ajoutez {{bonite}}. Ne remuez ' +
          'pas. Laissez infuser 1 à 2 minutes, le temps que les flocons coulent d’eux-mêmes.',
        voix:
          'Maintenant on monte le feu, jusqu’à ce que les premières grosses bulles arrivent. On éteint. ' +
          'Et {{bonite}} dans l’eau, d’un geste. Ne remuez pas. Les flocons flottent, s’imbibent, et ' +
          'coulent au fond tout seuls : une minute, deux au plus. C’est une infusion, pas une cuisson. ' +
          'Au-delà de deux minutes, le bouillon prend un goût de poisson séché, une âcreté. Ce qu’on ' +
          'veut, c’est la fumée, la profondeur, et rien d’autre.',
        piege: 'Faire bouillir la bonite. En trente secondes, le dashi devient âcre.',
        reussite: 'Les flocons ont tous coulé ; le bouillon est ambré, transparent, et sent la fumée douce.',
      },
      {
        titre: 'Filtrer sans presser',
        scene: 'passoire',
        duree: '3 min',
        minuterie: null,
        texte:
          'Versez à travers la passoire garnie d’une étamine, doucement, sans presser les flocons. Le ' +
          'dashi se garde deux jours au frigo, ou en glaçons au congélateur. Servez le riz à côté, dans ' +
          'des bols chauds.',
        voix:
          'On filtre, tout doucement, à travers la passoire et le linge. Et comme pour le fond ' +
          'd’Aurèle : on ne presse pas. Presser les flocons, c’est faire passer l’amertume et troubler ' +
          'le bouillon. Laissez couler. Voilà votre dashi : une soupe miso dans trois minutes, un ' +
          'bouillon pour des nouilles, une base pour pocher un œuf ou mijoter des légumes. Deux jours ' +
          'au frigo, ou congelé en glaçons. Et le riz vous attend, dans des bols chauds. Deux choses ' +
          'simples, faites exactement. C’est toute ma cuisine.',
        piege: 'Presser le linge pour « récupérer le reste ». Le reste, c’est ce qu’on ne voulait pas.',
        reussite: 'Un litre de dashi limpide qu’on lit à travers, sans la moindre particule.',
      },
    ],
    debrief: {
      reussi:
        'Le riz brille et se détache, le dashi est clair ? Vous tenez la précision. Elle servira au ' +
        'saumon — où tout se joue en trente secondes.',
      aRefaire:
        'Riz collant : pas assez lavé, ou remué en cuisant. Riz dur au centre : pas trempé, ou ' +
        'couvercle ouvert. Dashi amer : le kombu a bouilli, ou la bonite a infusé trop longtemps. ' +
        'Chaque défaut a une seule cause ; c’est ce qui rend cette leçon facile à refaire.',
    },
  },

  {
    id: 'saumon-peau-croustillante',
    parcoursId: 'precision',
    chefId: 'naoko',
    numero: 2,
    titre: 'Le saumon mi-cuit à la peau croustillante',
    accroche: 'Quatre-vingt-dix pour cent de la cuisson côté peau, et une température qui décide de la texture.',
    gratuit: false,
    statut: 'publiee',
    duree: 40,
    difficulte: 2,
    techniques: ['peau-croustillante', 'mi-cuit', 'thermometre', 'lire-la-poele'],
    conseilleApres: ['saisir', 'thermometre'],
    portions: 4,
    resultat:
      'Quatre pavés de saumon à la peau dorée qui craque comme une chips, la chair nacrée qui se ' +
      'défait en pétales, encore translucide au centre.',
    pourquoi:
      'La peau du saumon croustille pour la même raison que celle du poulet : elle doit être sèche ' +
      'et rester en contact avec le métal. Mais elle se contracte à la chaleur et se soulève au ' +
      'centre ; c’est pourquoi on presse le pavé les trente premières secondes. Ensuite, on cuit ' +
      'presque tout côté peau : la couche de gras sous la peau protège la chair, qui cuit doucement ' +
      'de bas en haut, et on voit la ligne opaque monter le long du pavé.\n\n' +
      'La texture, elle, est une température. À 120 °F, la chair est mi-cuite : nacrée, fondante, ' +
      'encore translucide au cœur. À 135 °F, elle est à point, opaque et tendre. À 145 °F, elle ' +
      'commence à sécher et à expulser l’albumine blanche. Choisir sa texture, c’est choisir un ' +
      'chiffre — et le lire au thermomètre plutôt que de deviner.',
    materiel: [
      'Une poêle en acier inoxydable, en fonte ou antiadhésive de bonne qualité',
      'Une spatule large et fine, en métal de préférence',
      'Un thermomètre à lecture instantanée',
      'Une pince à épiler de cuisine pour les arêtes',
      'Du papier essuie-tout, beaucoup',
    ],
    avertissements: [
      {
        titre: 'Le mi-cuit est un choix',
        texte:
          'Santé Canada recommande de cuire le poisson à 70 °C (158 °F). Le mi-cuit à 120-125 °F ' +
          'suppose un saumon très frais ou surgelé en mer, acheté chez un poissonnier de confiance. ' +
          'Pour une femme enceinte, une personne âgée ou immunodéprimée, ou un poisson dont on ' +
          'doute, cuisez à 145 °F et plus : la technique est la même, la peau croustille pareil.',
      },
    ],
    temperatures: [
      { quoi: 'Mi-cuit — nacré au centre', f: 122, note: '120 à 125 °F ; saumon très frais seulement' },
      { quoi: 'À point — opaque et tendre', f: 135, note: 'Le compromis pour une tablée mêlée' },
      { quoi: 'Recommandation de Santé Canada', f: 158, note: '70 °C : pour les personnes fragiles et les poissons ordinaires' },
    ],
    ingredients: [
      { cle: 'saumon', q: 4, u: '', nom: 'Pavés de saumon avec la peau, 150 g chacun, écaillés', note: 'Demandez au poissonnier des pavés de même épaisseur, pris au centre du filet', rayon: 'seafood' },
      { cle: 'sel', q: 5, u: 'g', nom: 'Sel fin', note: 'Une cuillère à thé rase', rayon: 'pantry' },
      { cle: 'huile', q: 15, u: 'ml', nom: 'Huile neutre', note: 'Canola ou pépins de raisin', rayon: 'pantry' },
      { cle: 'citron', q: 0.5, u: '', nom: 'Citron', rayon: 'produce' },
      { cle: 'beurre', q: 10, u: 'g', nom: 'Beurre', note: 'Facultatif, pour la dernière minute', rayon: 'dairy' },
    ],
    etapes: [
      {
        titre: 'Sécher la peau',
        scene: 'frigo',
        duree: '20 min à 1 h',
        minuterie: 20,
        texte:
          'Passez le dos d’un couteau sur la peau, à rebrousse-poil, pour vérifier qu’il ne reste pas ' +
          'd’écailles. Retirez les arêtes à la pince. Épongez {{saumon}} et posez-les peau vers le haut, ' +
          'à découvert, au frigo : 20 minutes au moins, une heure c’est mieux.',
        voix:
          'La peau croustillante commence au frigo. Passez le dos du couteau sur la peau, contre le ' +
          'sens des écailles : s’il en reste, elles se soulèvent, et vous les grattez. Cherchez les ' +
          'arêtes du doigt le long de la ligne centrale, et tirez-les à la pince, dans le sens où elles ' +
          'penchent. Épongez, puis posez les pavés peau en l’air, sans rien dessus, au frigo. L’air ' +
          'froid sèche la peau. Vingt minutes suffisent ; une heure, et la peau est comme du papier. ' +
          'Une peau humide fait de la vapeur dans la poêle, et la vapeur ne croustille jamais.',
        piege: 'Sortir le saumon de son emballage et le cuire tout de suite, mouillé : la peau colle et se déchire.',
        reussite: 'La peau est mate, sèche au doigt, légèrement tendue.',
      },
      {
        titre: 'Saler dix minutes avant',
        scene: 'planche',
        duree: '10 min',
        minuterie: 10,
        texte:
          'Salez les deux faces avec {{sel}}, 10 minutes avant la cuisson. Puis épongez encore : le ' +
          'sel a fait perler de l’eau à la surface, et cette eau doit partir.',
        voix:
          '{{sel}}, réparti sur la chair et sur la peau, dix minutes avant. Le sel assaisonne, mais ' +
          'surtout il fait sortir un peu d’eau. Au bout de dix minutes, vous voyez des perles sur la ' +
          'peau : épongez-les. C’est la dernière humidité qu’on enlève. À partir de maintenant, la peau ' +
          'ne touche plus rien de mouillé.',
        piege: 'Saler plusieurs heures à l’avance : le poisson, plus délicat que la viande, devient ferme et salé comme un gravlax.',
        reussite: 'La peau est de nouveau sèche et un peu collante ; la chair a pris une teinte plus soutenue.',
      },
      {
        titre: 'La poêle à feu moyen-vif',
        scene: 'poele',
        duree: '3 min',
        minuterie: 3,
        texte:
          'Chauffez la poêle à feu moyen-vif, 2 à 3 minutes. Versez {{huile}} : elle doit frissonner ' +
          'sans fumer. Trop chaud, la peau brûle avant que la chair cuise ; trop froid, elle colle.',
        voix:
          'La poêle, à feu moyen-vif. Moins fort que pour le poulet d’Amadou : ici, la peau est fine et ' +
          'la chair est délicate. Deux, trois minutes, puis {{huile}}. Elle frissonne ? C’est bon. Elle ' +
          'fume ? Retirez la poêle du feu dix secondes. On cherche une chaleur franche mais pas ' +
          'violente : la peau doit dorer en cinq minutes, pas en une.',
        piege: 'Attendre la fumée « comme pour un steak » : le saumon n’est pas un steak.',
        reussite: 'L’huile ondule et coule facilement, sans la moindre fumée.',
      },
      {
        titre: 'Poser et presser',
        scene: 'poisson',
        duree: '30 s',
        minuterie: null,
        texte:
          'Posez les pavés peau vers le bas, en les couchant loin de vous. Aussitôt, pressez chacun ' +
          'avec la spatule, fermement, 20 à 30 secondes : la peau veut se contracter et se soulever au ' +
          'centre ; on la garde en contact avec le métal. Baissez à feu moyen.',
        voix:
          'Les pavés, peau vers le bas, couchés loin de vous. Et tout de suite, la spatule dessus : ' +
          'vous pressez, fermement, vingt ou trente secondes. Vous sentez la peau qui pousse contre la ' +
          'spatule ? Elle se contracte à la chaleur et veut se bomber au centre. Si vous la laissez ' +
          'faire, le centre ne touche plus la poêle et reste molle. Pressez, et tout le dessous est en ' +
          'contact. Relâchez, baissez à feu moyen, et à partir de là, on ne touche plus.',
        piege: 'Poser et partir : la peau se bombe en trente secondes et le centre ne croustille jamais.',
        reussite: 'Le pavé reste bien à plat après la spatule, et grésille uniformément sur toute sa surface.',
      },
      {
        titre: 'Quatre-vingt-dix pour cent côté peau',
        scene: 'poisson',
        duree: '5 à 7 min',
        minuterie: 5,
        texte:
          'Laissez cuire 5 à 7 minutes selon l’épaisseur. Regardez le côté du pavé : la chair devient ' +
          'opaque en montant depuis la peau. Quand la ligne opaque atteint les deux tiers de la hauteur, ' +
          'c’est le moment.',
        voix:
          'Maintenant on regarde le côté du pavé, et c’est le plus beau moment de la leçon. La chair ' +
          'change de couleur en partant de la peau : elle devient opaque, rose pâle, et cette ligne ' +
          'monte, lentement. Le gras sous la peau fond et protège la chair, qui cuit doucement, de bas ' +
          'en haut. Cinq minutes pour un pavé mince, sept pour un pavé épais. Quand la ligne opaque ' +
          'est aux deux tiers de la hauteur, la peau, dessous, est dorée et dure : glissez la spatule, ' +
          'vous verrez.',
        piege: 'Retourner à mi-cuisson, par habitude : le dessus se dessèche et la peau n’a pas eu le temps de croustiller.',
        reussite: 'La peau est brun doré, rigide, et la ligne opaque est montée aux deux tiers du pavé.',
      },
      {
        titre: 'Retourner trente secondes',
        scene: 'poisson',
        duree: '1 min',
        minuterie: 1,
        texte:
          'Retournez délicatement. Ajoutez {{beurre}} et un trait de {{citron}} si vous voulez. 30 à 60 ' +
          'secondes côté chair, pas plus. Éteignez.',
        voix:
          'On retourne, avec la spatule glissée bien sous la peau pour ne pas la casser. Côté chair, ' +
          'c’est trente secondes, une minute au plus : juste pour finir le dessus, qui est encore ' +
          'brillant. {{beurre}} et un trait de citron dans la poêle si vous aimez, et vous en arrosez la ' +
          'chair. Éteignez le feu. Le poisson continue de cuire dans sa propre chaleur.',
        piege: 'Laisser côté chair « une petite minute de plus » : c’est la minute qui sépare le mi-cuit du sec.',
        reussite: 'La chair du dessus est nacrée, à peine marquée, et se défait en pétales quand on la presse.',
      },
      {
        titre: 'La température de la texture',
        scene: 'thermometre',
        duree: '2 min',
        minuterie: 2,
        texte:
          'Piquez au centre du pavé le plus épais. 120 à 125 °F : mi-cuit, nacré. 135 °F : à point. ' +
          '145 °F et plus : bien cuit, recommandé pour les personnes fragiles. Reposez 2 minutes sur ' +
          'l’assiette, peau vers le haut — jamais peau vers le bas, elle ramollirait dans son jus.',
        voix:
          'Le thermomètre au centre du pavé le plus épais. Cent vingt à cent vingt-cinq degrés : ' +
          'mi-cuit, le centre encore translucide, fondant comme du beurre. Cent trente-cinq : à ' +
          'point, opaque partout, très tendre. Cent quarante-cinq et plus : bien cuit — c’est ce que ' +
          'je sers aux personnes fragiles, et la peau croustille exactement pareil. Choisissez votre ' +
          'chiffre, et si vous n’y êtes pas, la chaleur résiduelle vous y amène en une minute. Servez ' +
          'peau vers le ciel, toujours. Une peau posée dans son jus redevient molle en trente ' +
          'secondes, et ce serait dommage, après tout ça.',
        piege: 'Poser le saumon peau vers le bas dans l’assiette. Trente secondes, et la peau est molle.',
        reussite: 'La peau craque sous la fourchette, la chair se sépare en pétales nacrés, et le thermomètre a dit le chiffre que vous vouliez.',
      },
    ],
    debrief: {
      reussi:
        'La peau a craqué et le centre est nacré ? Vous savez maintenant qu’une texture est une ' +
        'température. Ça vaut pour un steak, une poitrine de canard, un œuf.',
      aRefaire:
        'Peau molle : pas assez sèche, ou posée dans son jus. Peau collée : poêle trop froide, ou pas ' +
        'pressée au début. Chair sèche : retournée trop tôt, ou une minute de trop côté chair. Achetez ' +
        'deux pavés, refaites-le demain : c’est une leçon de trente minutes.',
    },
  },

  {
    id: 'tempura-legere',
    parcoursId: 'precision',
    chefId: 'naoko',
    numero: 3,
    titre: 'La tempura légère : farine, glace et temps',
    accroche: 'Une pâte à peine mélangée, glacée, dans une huile à 350 °F : la friture qui ne pèse rien.',
    gratuit: false,
    statut: 'en-preparation',
    duree: 45,
    difficulte: 2,
    techniques: ['thermometre', 'lire-la-poele'],
    conseilleApres: ['julienne'],
    portions: 4,
    resultat: 'Des légumes et des crevettes sous une dentelle croustillante et pâle, sans une goutte d’huile en trop.',
    pourquoi: '',
    materiel: [],
    ingredients: [],
    etapes: [],
    debrief: { reussi: '', aRefaire: '' },
  },

  /* =====================================================================
     PARCOURS 5 — LA CHIMIE DU SUCRÉ (Chef Léa)
     ===================================================================== */
  {
    id: 'pate-a-choux-creme-patissiere',
    parcoursId: 'sucre',
    chefId: 'lea',
    numero: 1,
    titre: 'La pâte à choux et la crème pâtissière',
    accroche: 'Un rapport de poids, une panade desséchée, un four qu’on n’ouvre pas : des choux qui gonflent à tout coup.',
    gratuit: false,
    statut: 'publiee',
    duree: 120,
    difficulte: 2,
    techniques: ['peser', 'panade', 'temperer-oeufs', 'pocher', 'creme-patissiere', 'refroidir-vite'],
    conseilleApres: [],
    portions: 24,
    portionsLibelle: 'choux garnis',
    resultat:
      'Vingt-quatre choux dorés, creux et légers, garnis d’une crème pâtissière à la vanille lisse ' +
      'et ferme, qui tient à la cuillère sans être gélatineuse.',
    pourquoi:
      'La pâte à choux est un rapport : 250 de liquide, 100 de beurre, 150 de farine, 250 d’œufs. ' +
      'On la cuit deux fois. La première fois, dans la casserole : la farine versée d’un coup dans le ' +
      'liquide bouillant gélatinise son amidon, puis on dessèche cette panade pour évaporer une ' +
      'partie de l’eau — c’est ce qui permettra d’absorber les œufs. Au four, l’eau restante se ' +
      'transforme en vapeur, gonfle la pâte comme un ballon, et les protéines de l’œuf figent la ' +
      'paroi. Ouvrir le four pendant ce temps, c’est crever le ballon.\n\n' +
      'La crème pâtissière est l’autre face de la même chimie : la fécule épaissit vers 185 °F, mais ' +
      'il faut la porter à l’ébullition une minute pour qu’elle soit complètement cuite — sans goût ' +
      'd’amidon — et pour détruire une enzyme du jaune d’œuf qui, sinon, liquéfierait la crème au ' +
      'frigo pendant la nuit.',
    materiel: [
      'Une balance de cuisine — indispensable, ici plus que partout ailleurs',
      'Une casserole à fond épais, une spatule en bois solide',
      'Un thermomètre à lecture instantanée',
      'Une poche à douille avec une douille lisse de 12 mm (ou un sac à congélation coupé)',
      'Deux plaques, du papier parchemin, une pellicule plastique, un fouet',
    ],
    temperatures: [
      { quoi: 'La panade avant les œufs', f: 140, note: 'En dessous, sinon les œufs coagulent au lieu de s’incorporer' },
      { quoi: 'Le four', f: 375, note: 'Trente à trente-cinq minutes ; la porte reste fermée les vingt-cinq premières' },
      { quoi: 'La crème pâtissière', f: 212, note: 'À l’ébullition, une minute entière, en fouettant' },
      { quoi: 'Refroidir la crème sous', f: 40, note: 'En moins de deux heures : œufs et lait, on ne joue pas' },
    ],
    ingredients: [
      { cle: 'eau', q: 125, u: 'ml', nom: 'Eau', groupe: 'La pâte à choux', rayon: null },
      { cle: 'lait', q: 125, u: 'ml', nom: 'Lait entier', groupe: 'La pâte à choux', note: 'Le lait donne la couleur ; l’eau seule fait des choux plus croustillants mais pâles', rayon: 'dairy' },
      { cle: 'beurre', q: 100, u: 'g', nom: 'Beurre', groupe: 'La pâte à choux', rayon: 'dairy' },
      { cle: 'sel', q: 4, u: 'g', nom: 'Sel', groupe: 'La pâte à choux', rayon: 'pantry' },
      { cle: 'sucre', q: 6, u: 'g', nom: 'Sucre', groupe: 'La pâte à choux', rayon: 'pantry' },
      { cle: 'farine', q: 150, u: 'g', nom: 'Farine tout usage', groupe: 'La pâte à choux', rayon: 'pantry' },
      { cle: 'oeufs', q: 250, u: 'g', nom: 'Œufs entiers, battus', groupe: 'La pâte à choux', note: 'Environ cinq gros œufs — mais pesez : c’est le seul ingrédient qui varie', rayon: 'dairy' },
      { cle: 'lait-creme', q: 500, u: 'ml', nom: 'Lait entier', groupe: 'La crème pâtissière', rayon: 'dairy' },
      { cle: 'vanille', q: 1, u: '', nom: 'Gousse de vanille', groupe: 'La crème pâtissière', substitution: '10 ml d’extrait de vanille pur, ajouté à la fin', rayon: 'pantry' },
      { cle: 'sucre-creme', q: 100, u: 'g', nom: 'Sucre', groupe: 'La crème pâtissière', rayon: 'pantry' },
      { cle: 'jaunes', q: 80, u: 'g', nom: 'Jaunes d’œufs', groupe: 'La crème pâtissière', note: 'Quatre jaunes ; les blancs se congèlent', rayon: 'dairy' },
      { cle: 'fecule', q: 40, u: 'g', nom: 'Fécule de maïs', groupe: 'La crème pâtissière', rayon: 'pantry' },
      { cle: 'beurre-creme', q: 25, u: 'g', nom: 'Beurre', groupe: 'La crème pâtissière', rayon: 'dairy' },
    ],
    etapes: [
      {
        titre: 'Peser, pas mesurer',
        scene: 'balance',
        duree: '10 min',
        minuterie: null,
        texte:
          'Pesez tout, y compris {{oeufs}} et {{eau}}. Préchauffez le four à 375 °F. Préparez la ' +
          'poche à douille et les plaques. La pâte à choux est un rapport 250 / 100 / 150 / 250 : ' +
          'liquide, beurre, farine, œufs. Un œuf « gros » pèse entre 50 et 63 g — d’où la balance.',
        voix:
          'Bienvenue dans mon laboratoire. Première règle : on pèse, on ne mesure pas. Un « gros » œuf ' +
          'pèse entre cinquante et soixante-trois grammes selon la boîte — c’est vingt-cinq pour cent ' +
          'd’écart, et la pâte à choux ne pardonne pas vingt-cinq pour cent. Alors : {{oeufs}}, battus, ' +
          'pesés. {{farine}}, pesée. Même l’eau, sur la balance : un millilitre fait un gramme. Le four ' +
          'à trois cent soixante-quinze dès maintenant, les plaques prêtes, la poche montée. Une fois ' +
          'qu’on commence, ça va vite.',
        piege: 'Compter « cinq œufs » : c’est le seul ingrédient qui varie, et c’est lui qui décide si la pâte gonfle ou s’étale.',
        reussite: 'Chaque ingrédient dans son bol, pesé au gramme, et le four qui préchauffe.',
      },
      {
        titre: 'La panade : l’ébullition franche',
        scene: 'casserole',
        duree: '5 min',
        minuterie: null,
        texte:
          'Dans la casserole : {{eau}}, {{lait}}, {{beurre}} en dés, {{sel}}, {{sucre}}. Portez à une ' +
          'ébullition franche — le beurre doit être entièrement fondu avant que ça bouille, sinon l’eau ' +
          's’évapore pendant qu’on attend. Hors du feu, versez {{farine}} d’un coup et mélangez ' +
          'énergiquement.',
        voix:
          '{{eau}}, {{lait}}, {{beurre}} coupé en petits dés pour qu’il fonde vite, {{sel}}, {{sucre}}. ' +
          'Feu moyen-vif. Ce qu’on veut, c’est que le beurre soit fondu avant l’ébullition : si ça bout ' +
          'pendant deux minutes en attendant un morceau de beurre, on a perdu de l’eau, et le rapport ' +
          'n’est plus le bon. Ébullition franche, on retire du feu, et {{farine}} d’un seul coup. Pas en ' +
          'pluie — d’un coup. Et on mélange fort, à la spatule, jusqu’à ce que ça fasse une boule. La ' +
          'farine boit le liquide bouillant et son amidon gélatinise : la pâte à choux vient de naître.',
        piege: 'Ajouter la farine en pluie : elle fait des grumeaux qu’on ne rattrape plus.',
        reussite: 'Une boule homogène, sans farine sèche, qui se détache déjà des parois.',
      },
      {
        titre: 'Dessécher',
        scene: 'casserole',
        duree: '3 min',
        minuterie: 3,
        texte:
          'Remettez sur feu moyen et travaillez la pâte à la spatule 2 à 3 minutes. Elle sèche, forme ' +
          'une boule lisse, une fine pellicule se dépose au fond et on entend un léger grésillement. ' +
          'Si vous aimez les chiffres : la panade doit peser environ 480 g.',
        voix:
          'Retour sur le feu, moyen, et on dessèche : la spatule qui écrase et retourne la pâte contre ' +
          'le fond, sans arrêt, deux ou trois minutes. La pâte fume légèrement, elle se lisse, elle se ' +
          'rassemble en boule et se détache complètement des parois. Écoutez : un petit grésillement, ' +
          'et un film fin qui se forme au fond de la casserole. C’est le signe. On vient d’évaporer une ' +
          'partie de l’eau pour faire de la place aux œufs. Et si vous êtes comme moi : la casserole ' +
          'sur la balance — la panade doit peser autour de quatre cent quatre-vingts grammes.',
        piege: 'Dessécher trop longtemps : la pâte devient grasse et luisante, le beurre ressort et les choux ne gonflent pas.',
        reussite: 'Une boule lisse et mate, un film au fond, et un grésillement discret.',
      },
      {
        titre: 'Refroidir, puis les œufs un à un',
        scene: 'bol',
        duree: '8 min',
        minuterie: null,
        texte:
          'Transvasez dans un bol et remuez 2 minutes pour descendre sous 140 °F. Ajoutez les œufs en ' +
          'quatre ou cinq fois, en incorporant complètement à chaque fois. Arrêtez quand la pâte, ' +
          'soulevée à la spatule, retombe en formant un « V » qui tient, et qu’un sillon tracé au doigt ' +
          'se referme lentement. Il peut rester un peu d’œuf : c’est normal.',
        voix:
          'La pâte dans un bol, et on remue deux minutes pour la refroidir. Le thermomètre dedans : ' +
          'sous cent quarante degrés. Au-dessus, l’œuf cuirait en touchant la pâte au lieu de s’y ' +
          'mélanger. Maintenant les œufs, un cinquième à la fois. La pâte se sépare, glisse, a l’air ' +
          'ratée — continuez, elle revient toujours. Quand elle est lisse, la portion suivante. On ' +
          's’arrête au signe, pas au poids : soulevez la spatule, la pâte doit retomber en formant un ' +
          'V qui reste accroché. Tracez un sillon au doigt : il se referme, lentement. Trop ferme, il ' +
          'reste ouvert — un peu plus d’œuf. Trop liquide, il disparaît — trop tard, d’où les cinq ' +
          'fois. Il peut vous rester un fond d’œuf : gardez-le pour la dorure.',
        piege: 'Mettre tous les œufs d’un coup. Si c’était un de trop, la pâte s’étale et il n’y a pas de retour.',
        reussite: 'Le V tient à la spatule, la pâte est brillante et lisse, le sillon se referme en trois secondes environ.',
      },
      {
        titre: 'Pocher',
        scene: 'pate',
        duree: '10 min',
        minuterie: null,
        texte:
          'Remplissez la poche. Pochez des dômes de 4 cm, à 5 cm d’intervalle, la douille verticale, ' +
          'en relâchant la pression avant de tourner le poignet pour couper. Aplatissez les pointes ' +
          'avec un doigt mouillé et badigeonnez du reste d’œuf.',
        voix:
          'La poche, la douille droite au-dessus de la plaque, à un centimètre. Pressez : un dôme de ' +
          'quatre centimètres. Relâchez la pression, puis un petit tour du poignet pour couper. Cinq ' +
          'centimètres entre chaque chou : ils vont doubler. Les petites pointes, on les couche avec ' +
          'un doigt mouillé, sinon elles brûlent. Et le reste d’œuf, au pinceau, en couche fine, en ' +
          'lissant la surface : c’est ce qui donne un chou rond et doré au lieu d’un chou craquelé.',
        piege: 'Pocher en tirant la poche vers le haut : on fabrique des cônes qui penchent et cuisent de travers.',
        reussite: 'Vingt-quatre dômes réguliers, brillants, sans pointe.',
      },
      {
        titre: 'Cuire sans ouvrir',
        scene: 'four',
        duree: '30 à 35 min',
        minuterie: 30,
        texte:
          'Enfournez à 375 °F, 30 à 35 minutes. N’ouvrez pas la porte pendant les 25 premières minutes. ' +
          'Les choux sont cuits quand ils sont bien dorés — y compris dans les fissures — et légers. ' +
          'Percez le dessous de chacun avec la pointe d’un couteau, éteignez le four et remettez-les 5 ' +
          'minutes, porte entrouverte, pour les sécher.',
        voix:
          'Au four, et là, c’est un serment : on n’ouvre pas. Vingt-cinq minutes minimum. À ' +
          'l’intérieur, l’eau de la pâte devient vapeur, la vapeur pousse, le chou gonfle comme un ' +
          'ballon, et l’œuf fige la paroi. Ouvrir la porte, c’est faire tomber la température d’un ' +
          'coup, et le ballon retombe. Vers trente minutes, regardez à travers la vitre : bien dorés, et ' +
          'les fissures dorées aussi, pas blondes. Un chou pâle dans les fissures est un chou encore ' +
          'humide qui s’affaissera en refroidissant. Sortez-les, percez le dessous de chacun, et ' +
          'remettez-les cinq minutes dans le four éteint, porte entrouverte : l’intérieur sèche, et ' +
          'ils resteront croustillants.',
        piege: 'Ouvrir « juste pour voir » à quinze minutes. Ils s’effondrent, et rien ne les relève.',
        reussite: 'Des choux dorés jusque dans les fissures, creux, qui sonnent léger quand on les tape.',
      },
      {
        titre: 'La crème : jaunes, sucre, fécule',
        scene: 'bol',
        duree: '5 min',
        minuterie: null,
        texte:
          'Fendez {{vanille}}, grattez les graines dans {{lait-creme}}, chauffez jusqu’au frémissement. ' +
          'Pendant ce temps, fouettez {{jaunes}}, {{sucre-creme}} et {{fecule}} jusqu’à obtenir une ' +
          'pâte lisse et pâle.',
        voix:
          'Pendant que les choux cuisent, la crème. {{lait-creme}} dans une casserole avec la vanille ' +
          'fendue et grattée, et on chauffe jusqu’au frémissement. Dans un bol, {{jaunes}}, ' +
          '{{sucre-creme}}, {{fecule}}, et on fouette jusqu’à ce que ce soit lisse, pâle, sans un ' +
          'grumeau de fécule. Le sucre protège les jaunes : tant qu’il est là, ils ne cuiront pas ' +
          'brutalement quand le lait chaud arrivera.',
        piege: 'Laisser les jaunes et le sucre attendre sans fouetter : le sucre « brûle » les jaunes et fait des grains.',
        reussite: 'Un mélange lisse, couleur crème, et un lait qui frémit sans bouillir.',
      },
      {
        titre: 'Tempérer, puis cuire jusqu’à l’ébullition',
        scene: 'thermometre',
        duree: '6 min',
        minuterie: 1,
        texte:
          'Versez un tiers du lait chaud sur les jaunes en fouettant, puis reversez tout dans la ' +
          'casserole. Cuisez à feu moyen en fouettant sans arrêt : la crème épaissit vers 185 °F. ' +
          'Continuez jusqu’à l’ébullition franche et maintenez-la une minute entière, toujours en ' +
          'fouettant, en raclant le fond et les coins.',
        voix:
          'Un tiers du lait chaud sur les jaunes, en fouettant : les jaunes se réchauffent doucement, ' +
          'sans coaguler. C’est tempérer. Puis tout retourne dans la casserole, feu moyen, et le fouet ' +
          'ne s’arrête plus. Vers cent quatre-vingt-cinq degrés, ça épaissit d’un coup — et c’est là que ' +
          'tout le monde s’arrête, à tort. Continuez. Il faut l’ébullition, de vraies bulles qui ' +
          'percent, et une minute entière en fouettant, en raclant le fond et les coins. Cette minute ' +
          'cuit la fécule complètement — plus de goût d’amidon — et détruit une enzyme du jaune qui, ' +
          'sinon, digérerait l’amidon pendant la nuit et vous rendrait une soupe au matin.',
        piege: 'Arrêter dès que ça épaissit. La crème est bonne ce soir et liquide demain.',
        reussite: 'Une crème épaisse et brillante qui a bouilli une minute, sans grumeaux, sans goût de farine.',
      },
      {
        titre: 'Refroidir vite, garnir',
        scene: 'frigo',
        duree: '1 h',
        minuterie: 60,
        texte:
          'Hors du feu, incorporez {{beurre-creme}}. Étalez la crème dans un plat large, posez une ' +
          'pellicule plastique directement à sa surface, et au frigo au moins une heure — elle doit ' +
          'passer sous 40 °F en moins de deux heures. Fouettez-la pour l’assouplir, et garnissez les ' +
          'choux par le trou du dessous, à la poche.',
        voix:
          'Hors du feu, {{beurre-creme}}, fouetté dedans : brillance et rondeur. Puis on refroidit, et ' +
          'vite : la crème dans un plat large, en couche mince, la pellicule plastique posée directement ' +
          'sur la crème pour qu’il ne se forme pas de peau, et au frigo. Œufs et lait tièdes, c’est le ' +
          'terrain de jeu des bactéries : sous quarante degrés en moins de deux heures, sans exception. ' +
          'Quand elle est froide, elle est ferme ; un coup de fouet, elle redevient souple et lisse. ' +
          'Dans la poche, la douille dans le trou du dessous de chaque chou, et on remplit jusqu’à ' +
          'sentir le chou peser dans la main. Vingt-quatre. C’était de la chimie. Vous avez le droit de ' +
          'la manger.',
        piege: 'Refroidir la crème dans la casserole, en bloc : le centre reste chaud des heures.',
        reussite: 'Une crème lisse et ferme, qui tient à la cuillère, et des choux lourds de crème et croustillants.',
      },
    ],
    debrief: {
      reussi:
        'Des choux gonflés et une crème qui tient le lendemain ? Vous avez compris deux choses que la ' +
        'moitié des pâtissiers amateurs ne comprennent jamais. Le pain vous attend — même rigueur, ' +
        'autre chimie.',
      aRefaire:
        'Choux plats : trop d’œuf, ou four ouvert trop tôt. Choux qui retombent : pas assez cuits ' +
        'dans les fissures. Crème liquide le lendemain : elle n’a pas bouilli une minute. Crème ' +
        'granuleuse : les jaunes ont cuit avant d’être tempérés. Tout ça se voit, et tout ça se corrige.',
    },
  },

  {
    id: 'pain-de-menage',
    parcoursId: 'sucre',
    chefId: 'lea',
    numero: 2,
    titre: 'Le pain de ménage : hydratation et pointage',
    accroche: 'Cinq ingrédients, un pourcentage, deux levées, et une mie qui se tient.',
    gratuit: false,
    statut: 'publiee',
    duree: 240,
    difficulte: 2,
    techniques: ['pourcentage-boulanger', 'petrir', 'pointage', 'faconner', 'cuire-le-pain', 'thermometre'],
    conseilleApres: ['peser'],
    portions: 12,
    portionsLibelle: 'tranches',
    resultat:
      'Un pain de ménage à la croûte dorée et fine, à la mie souple et régulière, qui se tranche ' +
      'sans s’émietter et fait des toasts pendant quatre jours.',
    pourquoi:
      'Le boulanger ne compte pas en tasses : il compte en pourcentage du poids de farine. Ici, ' +
      '68 % d’eau — une pâte docile, ni collante ni sèche. Quand vous saurez ce que 68 % donne dans ' +
      'vos mains, vous pourrez lire n’importe quelle recette de pain et savoir, avant de commencer, ' +
      'comment elle se comportera.\n\n' +
      'Le pétrissage aligne les protéines de la farine en un réseau — le gluten — qui retiendra le ' +
      'gaz de la levure. Le pointage, la première levée, laisse la levure produire ce gaz et développe ' +
      'le goût. Le façonnage tend la surface pour que le pain monte au lieu de s’étaler. Et la ' +
      'cuisson, on la mesure : 200 à 205 °F au cœur, parce qu’un pain qui sonne creux peut encore ' +
      'être gommeux au centre. Puis on attend une heure : la mie continue de cuire en refroidissant, ' +
      'et un pain coupé chaud est un pain qui colle au couteau.',
    materiel: [
      'Une balance de cuisine',
      'Un grand bol et une pellicule plastique ou un linge',
      'Un moule à pain de 23 × 13 cm (9 × 5 po)',
      'Un thermomètre à lecture instantanée',
      'Une grille pour le refroidissement',
    ],
    temperatures: [
      { quoi: 'L’eau de la pâte', f: 95, note: 'Tiède au doigt ; au-dessus de 120 °F, la levure souffre' },
      { quoi: 'La pièce pour lever', f: 77, note: '75 à 78 °F : la levure y est à son aise. Plus froid, c’est plus long, pas raté' },
      { quoi: 'Le four', f: 400, note: 'Préchauffé trente minutes, pas dix' },
      { quoi: 'Le cœur du pain', f: 203, note: '200 à 205 °F : la mie est cuite' },
    ],
    ingredients: [
      { cle: 'farine', q: 500, u: 'g', nom: 'Farine tout usage non blanchie', note: 'La farine à pain donne une mie plus élastique ; les deux fonctionnent', rayon: 'pantry' },
      { cle: 'eau', q: 340, u: 'g', nom: 'Eau tiède', note: '68 % du poids de farine, à 95 °F environ', rayon: null },
      { cle: 'sel', q: 10, u: 'g', nom: 'Sel', note: '2 % : c’est le sel qui donne du goût et discipline la levure', rayon: 'pantry' },
      { cle: 'levure', q: 4, u: 'g', nom: 'Levure instantanée', note: 'Une cuillère à thé un peu bombée', substitution: '5 g de levure sèche active, réveillée dans l’eau tiède 5 minutes', rayon: 'pantry' },
      { cle: 'sucre', q: 15, u: 'g', nom: 'Sucre ou miel', note: 'Une cuillère à soupe : le pain de ménage est légèrement sucré', rayon: 'pantry' },
      { cle: 'beurre', q: 20, u: 'g', nom: 'Beurre mou', note: 'Pour la mie souple et la croûte fine', rayon: 'dairy' },
    ],
    etapes: [
      {
        titre: 'L’hydratation : 68 %',
        scene: 'balance',
        duree: '5 min',
        minuterie: null,
        texte:
          'Pesez {{farine}} et {{eau}}. Le rapport eau / farine — ici 340 / 500, soit 68 % — ' +
          's’appelle l’hydratation. Plus il monte, plus la mie est ouverte et la pâte collante. 68 %, ' +
          'c’est la pâte idéale pour apprendre : elle se pétrit à la main sans coller aux doigts.',
        voix:
          'Aujourd’hui, on apprend à lire une recette de pain avant de la faire. Le boulanger compte ' +
          'tout par rapport à la farine. {{farine}}, c’est cent pour cent. {{eau}}, c’est soixante-huit ' +
          'pour cent. Le sel, deux pour cent. Ce nombre, soixante-huit, c’est l’hydratation, et c’est ' +
          'lui qui décide de tout : une pâte à soixante pour cent est ferme comme de la pâte à ' +
          'modeler, une pâte à quatre-vingts pour cent coule entre les doigts et fait de grandes ' +
          'alvéoles. Soixante-huit, c’est docile. Quand vous saurez ce que ça fait dans vos mains, vous ' +
          'saurez lire toutes les recettes du monde. L’eau, tiède au doigt : autour de quatre-vingt-' +
          'quinze degrés. Chaude, elle tuerait la levure.',
        piege: 'Mesurer la farine à la tasse : selon qu’on la tasse ou non, on a de 120 à 160 g. Le pourcentage n’a alors plus aucun sens.',
        reussite: 'Farine et eau pesées au gramme, et une eau qui fait « tiède » au doigt, pas « chaud ».',
      },
      {
        titre: 'Mélanger, puis attendre',
        scene: 'bol',
        duree: '20 min',
        minuterie: 20,
        texte:
          'Dans le bol : {{farine}}, {{levure}}, {{sucre}}, puis {{eau}}. Mélangez à la main juste ' +
          'jusqu’à ce qu’il ne reste plus de farine sèche — une pâte grossière et collante. Couvrez et ' +
          'laissez 20 minutes. Le sel et le beurre attendent.',
        voix:
          'La farine, la levure et le sucre dans le bol, l’eau par-dessus, et vous mélangez à la main, ' +
          'juste assez pour qu’il n’y ait plus de farine sèche. C’est moche, collant, irrégulier — ' +
          'parfait. Couvrez, et laissez vingt minutes. Ce repos, c’est du pétrissage gratuit : la farine ' +
          'boit l’eau, le gluten commence à se former tout seul, et dans vingt minutes la pâte sera ' +
          'déjà plus lisse sans que vous ayez rien fait. Le sel et le beurre, on les met après : le ' +
          'sel resserre le gluten et le gras l’enrobe — les deux freinent ce qu’on veut laisser ' +
          'démarrer.',
        piege: 'Mettre le sel en contact direct avec la levure dans le bol sec : il la déshydrate.',
        reussite: 'Après vingt minutes, la pâte a perdu son aspect grumeleux et s’étire déjà un peu sans casser.',
      },
      {
        titre: 'Pétrir jusqu’au voile',
        scene: 'petrissage',
        duree: '10 min',
        minuterie: 10,
        texte:
          'Ajoutez {{sel}} et {{beurre}}. Pétrissez sur le comptoir, sans farine : poussez la pâte ' +
          'loin de vous avec la paume, repliez-la, tournez d’un quart de tour, recommencez. 8 à 10 ' +
          'minutes. Test du voile : un morceau étiré entre les doigts doit devenir translucide sans ' +
          'se déchirer.',
        voix:
          '{{sel}}, {{beurre}} en morceaux, et on pétrit. Sur le comptoir, sans ajouter de farine — ' +
          'chaque poignée de farine change l’hydratation qu’on a pesée. La pâte colle au début : ' +
          'raclez-la, continuez, elle décollera. Le geste : la paume pousse la pâte loin de vous, on ' +
          'la replie sur elle-même, un quart de tour, et encore. Huit à dix minutes. Vous sentez la ' +
          'pâte changer : elle devient lisse, élastique, elle revient quand on la pousse. Le test ' +
          'final : prenez un morceau, étirez-le doucement entre vos doigts en tournant. S’il devient ' +
          'une fenêtre translucide, un voile, sans se déchirer, le gluten est prêt. S’il se déchire, ' +
          'trois minutes de plus.',
        piege: 'Ajouter de la farine parce que ça colle. Ça colle pendant cinq minutes, puis ça cesse. La farine, elle, reste.',
        reussite: 'Le voile passe la lumière, la pâte est lisse comme une joue et rebondit sous le doigt.',
      },
      {
        titre: 'Le pointage',
        scene: 'bol',
        duree: '1 h à 1 h 30',
        minuterie: 75,
        texte:
          'Boulez la pâte, mettez-la dans le bol légèrement huilé, couvrez. Laissez lever 1 h à 1 h 30 ' +
          'à 75-78 °F, jusqu’à ce qu’elle ait doublé. Cuisine froide ? Le four éteint, lumière allumée. ' +
          'Test : un doigt enfoncé laisse une empreinte qui remonte lentement.',
        voix:
          'La pâte en boule, dans un bol à peine huilé, couverte. Et on la laisse vivre. La levure ' +
          'mange le sucre et souffle du gaz ; le gluten qu’on a construit le retient. Une heure, une ' +
          'heure et demie, à une température de vingt-cinq degrés environ — soixante-quinze, soixante-' +
          'dix-huit Fahrenheit. Si votre cuisine est froide, le four éteint avec la lumière allumée ' +
          'fait une petite étuve parfaite. On ne compte pas les minutes, on regarde le volume : doublé. ' +
          'Et le test du doigt : enfoncez-le, l’empreinte doit remonter lentement. Si elle remonte ' +
          'd’un coup, pas encore. Si elle ne remonte pas du tout, on a trop attendu — mais ce n’est ' +
          'pas grave, on enchaîne vite.',
        piege: 'Poser le bol sur un radiateur ou près du four qui chauffe : la pâte lève trop vite et le goût n’a pas le temps de venir.',
        reussite: 'Volume doublé, surface bombée et lisse, empreinte du doigt qui remonte lentement.',
      },
      {
        titre: 'Façonner',
        scene: 'petrissage',
        duree: '5 min',
        minuterie: null,
        texte:
          'Dégazez doucement la pâte avec la paume, aplatissez-la en rectangle de la largeur du moule. ' +
          'Roulez-la sur elle-même en serrant à chaque tour, pincez la soudure, et déposez-la dans le ' +
          'moule beurré, soudure en dessous. La surface doit être tendue comme un tambour.',
        voix:
          'On sort la pâte sur le comptoir et on la dégaze doucement — les grosses bulles, pas toutes. ' +
          'Aplatissez-la en rectangle, aussi large que le moule est long. Et on roule : en partant du ' +
          'haut, on replie et on serre à chaque tour, en tirant légèrement la pâte vers soi pour tendre ' +
          'la surface. Cette tension, c’est ce qui fera monter le pain au four au lieu de l’étaler. ' +
          'Pincez la soudure sur toute la longueur, et dans le moule, soudure en dessous. Tapez ' +
          'doucement la surface du doigt : elle doit être tendue, comme un tambour.',
        piege: 'Rouler mou, sans tendre : le pain lève de côté et la mie fait un trou sous la croûte.',
        reussite: 'Un boudin régulier, lisse et tendu, qui remplit le fond du moule sans toucher les bords.',
      },
      {
        titre: 'L’apprêt',
        scene: 'bol',
        duree: '45 à 60 min',
        minuterie: 50,
        texte:
          'Couvrez lâchement et laissez lever 45 à 60 minutes, jusqu’à ce que le dôme dépasse le bord ' +
          'du moule de 2 à 3 cm. Test : une pression du doigt laisse une empreinte qui remonte ' +
          'lentement et pas complètement. Allumez le four à 400 °F à mi-parcours : il lui faut 30 minutes.',
        voix:
          'La seconde levée, l’apprêt. Couvrez sans serrer, et laissez encore quarante-cinq minutes, ' +
          'une heure. Le dôme doit dépasser le moule de deux ou trois centimètres. Au milieu de ' +
          'l’attente, allumez le four à quatre cents : un four met trente minutes à être vraiment ' +
          'chaud, pas dix. Le test, cette fois : appuyez du doigt sur le côté du pain. L’empreinte ' +
          'remonte lentement, et pas tout à fait. C’est le moment exact. Si elle remonte vite, dix ' +
          'minutes de plus. Si elle ne remonte plus, enfournez tout de suite, avant qu’il ne retombe.',
        piege: 'Attendre « qu’il monte encore un peu ». Un pain sur-levé s’effondre au four et la croûte se ride.',
        reussite: 'Un dôme régulier à 2 ou 3 cm au-dessus du bord, et une empreinte qui remonte à moitié.',
      },
      {
        titre: 'Cuire à cœur',
        scene: 'four',
        duree: '30 à 35 min',
        minuterie: 30,
        texte:
          'Enfournez au centre du four à 400 °F, 30 à 35 minutes. Le pain est cuit quand la croûte est ' +
          'brun doré et que le thermomètre, planté par le côté jusqu’au centre, indique 200 à 205 °F. ' +
          'Démoulez aussitôt.',
        voix:
          'Au four, au centre, trente à trente-cinq minutes. Les dix premières minutes, il monte encore ' +
          '— c’est la poussée au four, la levure qui s’affole dans la chaleur avant de mourir. Puis la ' +
          'croûte prend couleur. On ne se fie pas au son creux, qui ment souvent : le thermomètre, ' +
          'planté par le côté, jusqu’au centre. Deux cents à deux cent cinq degrés, et la mie est ' +
          'cuite ; en dessous, elle sera gommeuse. Sortez-le et démoulez-le tout de suite, sinon la ' +
          'vapeur enfermée ramollit les côtés.',
        piege: 'Le laisser refroidir dans le moule : les côtés deviennent mous et humides.',
        reussite: 'Croûte brun doré, 200 à 205 °F au centre, et le pain sort du moule d’un bloc.',
      },
      {
        titre: 'Attendre une heure',
        scene: 'assiette',
        duree: '1 h',
        minuterie: 60,
        texte:
          'Laissez refroidir sur une grille, une heure, avant de trancher. La mie est encore en train ' +
          'de cuire : l’amidon se fige en refroidissant. Coupé chaud, le pain colle au couteau et la mie ' +
          'devient gommeuse en séchant. Conservez-le dans un sac en papier, ou tranché au congélateur.',
        voix:
          'Et maintenant, la partie la plus difficile de toute la leçon : on attend une heure. Sur une ' +
          'grille, pour que l’air passe dessous. Vous entendrez la croûte craquer en refroidissant — ' +
          'c’est le chant du pain. À l’intérieur, la mie continue de cuire : l’amidon, encore mou, se ' +
          'fige en refroidissant. Coupez maintenant, et la mie colle au couteau, s’écrase, et devient ' +
          'gommeuse en séchant. Coupez dans une heure, et elle est souple, régulière, et elle le ' +
          'restera. Dans un sac en papier, il se garde trois ou quatre jours. Tranché au congélateur, ' +
          'trois mois. Cinq ingrédients et un pourcentage : vous savez faire du pain.',
        piege: 'Trancher chaud parce que ça sent trop bon. Une tranche gommeuse et un pain qui sèche vite.',
        reussite: 'Une mie souple et régulière, qui se tranche net, et une croûte fine qui craque.',
      },
    ],
    debrief: {
      reussi:
        'La mie se tient et la croûte chante ? Vous connaissez maintenant votre 68 %. Essayez 72 % la ' +
        'prochaine fois, et regardez ce que quatre points changent : c’est comme ça qu’on devient boulanger.',
      aRefaire:
        'Pain dense : pétrissage trop court, ou levée trop courte. Pain effondré : apprêt trop long. ' +
        'Mie gommeuse : pas 200 °F au centre, ou coupé chaud. Croûte pâle : four pas assez préchauffé. ' +
        'Le pain se refait le lendemain, et il coûte un dollar.',
    },
  },

  {
    id: 'feuilletage-rapide',
    parcoursId: 'sucre',
    chefId: 'lea',
    numero: 3,
    titre: 'La pâte feuilletée rapide : six tours, mille feuilles',
    accroche: 'Du beurre froid en gros morceaux, six pliages, et la physique fait le reste.',
    gratuit: false,
    statut: 'en-preparation',
    duree: 90,
    difficulte: 3,
    techniques: ['feuilletage', 'abaisser'],
    conseilleApres: ['sablage'],
    portions: 8,
    resultat: 'Une pâte feuilletée en une heure, qui monte en feuillets nets, pour les chaussons, les palmiers et la galette.',
    pourquoi: '',
    materiel: [],
    ingredients: [],
    etapes: [],
    debrief: { reussi: '', aRefaire: '' },
  },
];

/* =========================================================================
   Accès pratiques
   ========================================================================= */

export const leconParId = (id) => LECONS.find((l) => l.id === id) ?? null;
export const parcoursParId = (id) => PARCOURS.find((p) => p.id === id) ?? null;

/** Les leçons d'un parcours, dans l'ordre. */
export function leconsDuParcours(parcoursId) {
  return LECONS.filter((l) => l.parcoursId === parcoursId).sort((a, b) => a.numero - b.numero);
}

/** Les leçons publiées, tous parcours confondus, dans l'ordre des parcours. */
export function leconsPubliees() {
  const rang = new Map(PARCOURS.map((p) => [p.id, p.ordre]));
  return LECONS.filter((l) => l.statut === 'publiee').sort(
    (a, b) => rang.get(a.parcoursId) - rang.get(b.parcoursId) || a.numero - b.numero,
  );
}

/** La leçon qui enseigne une technique donnée, s'il y en a une de publiée. */
export function leconPourTechnique(techniqueId) {
  return (
    LECONS.find((l) => l.statut === 'publiee' && l.techniques.includes(techniqueId)) ??
    LECONS.find((l) => l.techniques.includes(techniqueId)) ??
    null
  );
}
