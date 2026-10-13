/**
 * La Brigade — les chefs qui enseignent.
 *
 * Cinq personnages entièrement originaux. Aucun n'emprunte le visage, le nom
 * ni la manière d'une personne réelle : ils appartiennent à l'application, ce
 * qui permet de les décliner sans risque en capsules, en vidéos, en affiches.
 *
 * Chaque chef porte trois choses :
 *   sa pédagogie   — la façon dont il explique, qui teinte toute la narration
 *                    de ses leçons ;
 *   sa voix        — hauteur et débit pour la synthèse vocale du navigateur,
 *                    plus un genre qui sert à choisir une voix cohérente ;
 *   son portrait   — décrit en paramètres (peau, coiffure, veste…) et dessiné
 *                    par `portraitChef()` : une seule fonction, cinq visages,
 *                    et un style graphique commun qui fait « marque ».
 */

export const CHEFS = [
  {
    id: 'aurele',
    prenom: 'Aurèle',
    nom: 'Aurèle Fontaine',
    titre: 'Chef Aurèle',
    role: 'Le Technicien',
    devise: 'Un geste juste vaut mille recettes.',
    presentation:
      'Trente ans de brigades classiques, et une conviction : la technique n’est ' +
      'pas une contrainte, c’est une grammaire. Une fois qu’on la possède, on ' +
      'écrit ce qu’on veut. Aurèle ne saute jamais une étape et explique toujours ' +
      'le pourquoi avant le comment.',
    pedagogie: 'Précis, calme, méthodique. Il regarde vos mains plus que votre assiette.',
    specialites: ['Couteau', 'Fonds et sauces', 'Émulsions'],
    teinte: 214,
    genre: 'm',
    voix: { pitch: 0.85, rate: 0.95 },
    portrait: {
      peau: '#f3d2b3',
      peauOmbre: '#d9ad86',
      cheveux: '#a9b0b8',
      coiffure: 'court',
      barbe: 'poivre',
      lunettes: '#4a5563',
      veste: '#1f3b5c',
      col: 'v',
      toque: true,
      foulard: '#b23a48',
    },
  },
  {
    id: 'rosalie',
    prenom: 'Rosalie',
    nom: 'Rosalie Bouchard',
    titre: 'Mamie Rosalie',
    role: 'La Mémoire',
    devise: 'On ne cuisine pas pour hier : on cuisine pour que quelqu’un s’en souvienne.',
    presentation:
      'Née au bord du fleuve, Rosalie a nourri quatre générations et tient ses ' +
      'recettes dans un cahier taché de mélasse. Elle enseigne au toucher et à ' +
      'l’odeur, avec une histoire par étape — mais ne vous y trompez pas : ses ' +
      'chiffres sont justes, elle les a vérifiés cinquante fois.',
    pedagogie: 'Chaleureuse, patiente, un brin taquine. Elle raconte, puis elle fait faire.',
    specialites: ['Cuisine du Québec', 'Pâtes brisées', 'Mijotés'],
    teinte: 350,
    genre: 'f',
    voix: { pitch: 1.1, rate: 0.9 },
    portrait: {
      peau: '#f6d7c4',
      peauOmbre: '#dcae95',
      cheveux: '#f2f2f2',
      coiffure: 'chignon',
      lunettes: '#c9a227',
      veste: '#b83244',
      col: 'rond',
      tablier: '#f6ead9',
      motifTablier: 'fleurs',
      broche: '#c9a227',
    },
  },
  {
    id: 'amadou',
    prenom: 'Amadou',
    nom: 'Amadou Sarr',
    titre: 'Chef Amadou',
    role: 'Le Feu',
    devise: 'Le feu ne se commande pas, il se lit.',
    presentation:
      'Amadou a appris la cuisine devant un brasero et l’a perfectionnée sur les ' +
      'fourneaux des grandes tables. Sa spécialité : la chaleur — la lire, la ' +
      'doser, l’attendre. Il vous apprendra à saisir sans coller, à rôtir au ' +
      'thermomètre et à bâtir un ragoût couche par couche.',
    pedagogie: 'Énergique et généreux. Il parle de rythme, de patience et d’oreille.',
    specialites: ['Saisie et rôtis', 'Ragoûts', 'Épices'],
    teinte: 24,
    genre: 'm',
    voix: { pitch: 0.8, rate: 1.0 },
    portrait: {
      peau: '#6b3f2a',
      peauOmbre: '#4e2c1c',
      cheveux: '#141414',
      coiffure: 'ras',
      barbe: 'courte',
      veste: '#f4f4f4',
      col: 'v',
      tablier: '#e0641a',
      motifTablier: 'rayures',
    },
  },
  {
    id: 'naoko',
    prenom: 'Naoko',
    nom: 'Naoko Ishida',
    titre: 'Chef Naoko',
    role: 'La Précision',
    devise: 'Une texture, c’est une température qu’on a respectée.',
    presentation:
      'Formée à la cuisine de saison, Naoko travaille au degré et à la seconde. ' +
      'Elle enseigne le riz, le bouillon clair, la peau croustillante et le poisson ' +
      'mi-cuit : des plats simples en apparence, où tout se joue dans le détail.',
    pedagogie: 'Concise, sensorielle. Elle nomme ce qu’on doit voir, entendre et sentir.',
    specialites: ['Riz et bouillons', 'Poissons', 'Cuissons courtes'],
    teinte: 262,
    genre: 'f',
    voix: { pitch: 1.05, rate: 1.0 },
    portrait: {
      peau: '#f0c9a6',
      peauOmbre: '#d4a37d',
      cheveux: '#1b1b26',
      meche: '#7c5cff',
      coiffure: 'carre',
      veste: '#2b2d6b',
      col: 'droit',
      boucles: '#e2b04a',
    },
  },
  {
    id: 'lea',
    prenom: 'Léa',
    nom: 'Léa Marchand',
    titre: 'Chef Léa',
    role: 'La Chimiste',
    devise: 'La pâtisserie, c’est de la chimie qu’on a le droit de manger.',
    presentation:
      'Léa a quitté un laboratoire pour un fournil et n’a jamais lâché sa balance. ' +
      'Elle explique la pâte à choux par l’amidon, le pain par l’hydratation et la ' +
      'crème pâtissière par la température. Avec elle, on comprend — donc on réussit ' +
      'du premier coup.',
    pedagogie: 'Joueuse et rigoureuse. Chaque nombre a une raison, et elle la donne.',
    specialites: ['Pâtes cuites', 'Crèmes', 'Pain'],
    teinte: 320,
    genre: 'f',
    voix: { pitch: 1.15, rate: 1.05 },
    portrait: {
      peau: '#f7dcc8',
      peauOmbre: '#dfb59a',
      cheveux: '#c8552b',
      coiffure: 'boucles',
      lunettes: '#2f2f2f',
      taches: true,
      veste: '#ffffff',
      liseré: '#e0559b',
      col: 'v',
      thermometre: true,
    },
  },
];

export const chefParId = (id) => CHEFS.find((c) => c.id === id) ?? CHEFS[0];

/* =========================================================================
   Portraits

   Un buste vu de face dans un médaillon rond, en aplats de couleur. Tout est
   décrit en coordonnées d'une boîte de 240 × 240 ; l'attribut `viewBox` fait
   le reste, quelle que soit la taille d'affichage.

   L'ordre de dessin compte : veste, cou, oreilles, tête, barbe, cheveux,
   visage, accessoires. Les cheveux longs recouvrent les oreilles, les
   cheveux courts les laissent voir — sans qu'on ait rien de plus à décider.
   ========================================================================= */

/** Les coiffures, chacune un fragment SVG. */
const COIFFURES = {
  court: ({ cheveux }) =>
    `<path d="M76 104 C70 62 92 48 120 48 C148 48 170 62 164 104 C158 84 146 74 120 74 C94 74 82 84 76 104 Z" fill="${cheveux}"/>`,

  ras: ({ cheveux }) =>
    `<path d="M77 100 C74 58 96 45 120 45 C144 45 166 58 163 100 C156 78 138 70 120 70 C102 70 84 78 77 100 Z" fill="${cheveux}"/>`,

  chignon: ({ cheveux }) => `
    <circle cx="120" cy="46" r="19" fill="${cheveux}"/>
    <path d="M76 104 C72 60 94 50 120 50 C146 50 168 60 164 104 C158 86 146 78 120 78 C94 78 82 86 76 104 Z" fill="${cheveux}"/>
    <path d="M84 96 C90 84 100 78 112 76" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M156 96 C150 84 140 78 128 76" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>`,

  carre: ({ cheveux, meche }) => `
    <path d="M72 140 C70 90 72 54 120 48 C168 54 170 90 168 140 L154 140 C160 116 158 100 150 90 C140 80 100 80 90 90 C82 100 80 116 86 140 Z" fill="${cheveux}"/>
    <path d="M128 52 C146 56 156 70 158 92 C156 78 144 66 130 62 Z" fill="${meche ?? cheveux}"/>`,

  boucles: ({ cheveux }) => {
    const boucles = [];
    // Une couronne de boucles autour du haut de la tête, une seconde plus
    // petite en dessous : ça fait du volume sans perdre le visage.
    for (let angle = 195; angle <= 345; angle += 15) {
      const rad = (angle * Math.PI) / 180;
      const r = angle % 30 === 0 ? 17 : 13;
      boucles.push(
        `<circle cx="${(120 + Math.cos(rad) * 50).toFixed(1)}" cy="${(102 + Math.sin(rad) * 52).toFixed(1)}" r="${r}" fill="${cheveux}"/>`,
      );
    }
    for (const [cx, cy] of [[66, 120], [174, 120], [70, 138], [170, 138]]) {
      boucles.push(`<circle cx="${cx}" cy="${cy}" r="11" fill="${cheveux}"/>`);
    }
    return `${boucles.join('')}<path d="M78 104 C78 68 96 56 120 56 C144 56 162 68 162 104 C154 86 140 78 120 78 C100 78 86 86 78 104 Z" fill="${cheveux}"/>`;
  },
};

const BARBES = {
  poivre: ({ cheveux }) =>
    `<path d="M78 112 C82 152 100 166 120 166 C140 166 158 152 162 112 C158 140 142 152 120 152 C98 152 82 140 78 112 Z" fill="${cheveux}" opacity=".85"/>`,
  courte: ({ cheveux }) =>
    `<path d="M78 114 C82 150 100 162 120 162 C140 162 158 150 162 114 C158 140 142 150 120 150 C98 150 82 140 78 114 Z" fill="${cheveux}" opacity=".9"/>`,
};

const MOTIFS_TABLIER = {
  fleurs: (id) => `
    <pattern id="fleurs-${id}" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="9" cy="9" r="2.4" fill="#d9536a"/>
      <circle cx="9" cy="4.5" r="1.6" fill="#f2a5b3"/><circle cx="13.5" cy="9" r="1.6" fill="#f2a5b3"/>
      <circle cx="9" cy="13.5" r="1.6" fill="#f2a5b3"/><circle cx="4.5" cy="9" r="1.6" fill="#f2a5b3"/>
    </pattern>`,
  rayures: (id) => `
    <pattern id="rayures-${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" fill="#e0641a"/>
      <rect width="4" height="14" fill="#f4c14d"/>
      <rect x="8" width="2.5" height="14" fill="#1e7a4a"/>
    </pattern>`,
};

/**
 * Dessine le portrait d'un chef.
 *
 *   taille    largeur et hauteur d'affichage, en pixels CSS
 *   parle     true pour la bouche ouverte — la capsule l'alterne au rythme
 *             de la narration
 *   fond      couleur du médaillon ; par défaut, une teinte pâle du chef
 */
export function portraitChef(chef, { taille = 96, parle = false, fond, classe = '' } = {}) {
  const p = chef.portrait;
  const id = chef.id;
  const couleurFond = fond ?? `hsl(${chef.teinte} 60% 88%)`;

  const defs = [`<clipPath id="medaillon-${id}"><circle cx="120" cy="120" r="118"/></clipPath>`];
  if (p.motifTablier) defs.push(MOTIFS_TABLIER[p.motifTablier](id));

  // --- Vêtements -----------------------------------------------------------
  let veste = `<path d="M22 250 C22 180 66 158 120 158 C174 158 218 180 218 250 Z" fill="${p.veste}"/>`;

  if (p.col === 'v') {
    veste += `
      <path d="M96 160 L120 200 L144 160 L134 155 L120 182 L106 155 Z" fill="#ffffff"/>
      <path d="M96 160 L120 200 L144 160" stroke="${p.liseré ?? 'rgba(0,0,0,.12)'}" stroke-width="3" fill="none" stroke-linejoin="round"/>
      ${[186, 204, 222].map((y) => `<circle cx="100" cy="${y}" r="3" fill="#fff" opacity=".9"/><circle cx="140" cy="${y}" r="3" fill="#fff" opacity=".9"/>`).join('')}`;
  } else if (p.col === 'droit') {
    veste += `
      <path d="M100 158 L120 174 L140 158 L140 168 L120 184 L100 168 Z" fill="${p.peau}"/>
      <path d="M96 158 L120 178 L144 158" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/>
      <path d="M120 178 L120 250" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
      ${[194, 214, 234].map((y) => `<circle cx="120" cy="${y}" r="3" fill="#e2b04a"/>`).join('')}`;
  } else if (p.col === 'rond') {
    veste += `
      <path d="M92 160 C100 176 140 176 148 160 L146 156 C136 168 104 168 94 156 Z" fill="#ffffff"/>
      <path d="M120 176 L120 250" stroke="rgba(0,0,0,.15)" stroke-width="2"/>
      ${[196, 216, 236].map((y) => `<circle cx="120" cy="${y}" r="3.2" fill="#f2f2f2"/>`).join('')}`;
  }

  if (p.tablier) {
    const remplissage = p.motifTablier ? `url(#${p.motifTablier}-${id})` : p.tablier;
    veste += `
      <path d="M70 250 L70 206 C70 196 78 190 88 190 L152 190 C162 190 170 196 170 206 L170 250 Z" fill="${p.tablier}"/>
      <path d="M74 250 L74 206 C74 200 80 194 88 194 L152 194 C160 194 166 200 166 206 L166 250 Z" fill="${remplissage}" opacity=".95"/>
      <path d="M92 194 C92 178 100 168 110 166 M148 194 C148 178 140 168 130 166" stroke="${p.tablier}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }

  if (p.foulard) {
    veste += `
      <path d="M100 160 C108 176 132 176 140 160 L146 168 C134 186 106 186 94 168 Z" fill="${p.foulard}"/>
      <path d="M118 176 L112 200 L124 196 L126 176 Z" fill="${p.foulard}"/>`;
  }

  if (p.broche) {
    veste += `<circle cx="140" cy="176" r="5" fill="${p.broche}"/><circle cx="140" cy="176" r="2" fill="#fff" opacity=".8"/>`;
  }

  if (p.thermometre) {
    veste += `
      <rect x="150" y="196" width="26" height="22" rx="3" fill="#fff" stroke="${p.liseré}" stroke-width="2"/>
      <rect x="160" y="184" width="5" height="26" rx="2.5" fill="#e8eef5" stroke="#8a97a8" stroke-width="1.2"/>
      <rect x="161.5" y="192" width="2" height="16" fill="#d9363e"/>
      <circle cx="162.5" cy="186" r="2.5" fill="#d9363e"/>`;
  }

  // --- Tête ----------------------------------------------------------------
  const cou = `<rect x="103" y="130" width="34" height="44" rx="12" fill="${p.peau}"/>
    <path d="M103 138 C110 150 130 150 137 138 L137 130 L103 130 Z" fill="${p.peauOmbre}" opacity=".45"/>`;
  const oreilles = `<circle cx="77" cy="112" r="9" fill="${p.peau}"/><circle cx="163" cy="112" r="9" fill="${p.peau}"/>
    <circle cx="77" cy="112" r="4" fill="${p.peauOmbre}" opacity=".5"/><circle cx="163" cy="112" r="4" fill="${p.peauOmbre}" opacity=".5"/>`;
  const tete = `<ellipse cx="120" cy="106" rx="44" ry="50" fill="${p.peau}"/>`;
  const barbe = p.barbe ? BARBES[p.barbe](p) : '';
  const cheveux = COIFFURES[p.coiffure]?.(p) ?? '';

  const boucleOreille = p.boucles
    ? `<circle cx="77" cy="124" r="3.5" fill="${p.boucles}"/><circle cx="163" cy="124" r="3.5" fill="${p.boucles}"/>`
    : '';

  // --- Visage --------------------------------------------------------------
  const sourcils = `
    <path d="M94 88 Q104 81 113 87" stroke="${p.cheveux}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M127 87 Q136 81 146 88" stroke="${p.cheveux}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const yeux = `
    <ellipse cx="104" cy="100" rx="4.6" ry="5.6" fill="#26262e"/>
    <ellipse cx="136" cy="100" rx="4.6" ry="5.6" fill="#26262e"/>
    <circle cx="105.8" cy="98" r="1.6" fill="#fff"/><circle cx="137.8" cy="98" r="1.6" fill="#fff"/>`;
  const nez = `<path d="M120 104 Q113 119 121 121" stroke="${p.peauOmbre}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const joues = `<circle cx="93" cy="121" r="7" fill="#e8808a" opacity=".22"/><circle cx="147" cy="121" r="7" fill="#e8808a" opacity=".22"/>`;
  const taches = p.taches
    ? [[98, 116], [104, 120], [110, 115], [130, 115], [136, 120], [142, 116]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${p.peauOmbre}" opacity=".7"/>`)
        .join('')
    : '';
  const bouche = parle
    ? `<ellipse cx="120" cy="134" rx="9" ry="7" fill="#6b2430"/><ellipse cx="120" cy="131" rx="7" ry="3" fill="#fff"/>`
    : `<path d="M106 130 Q120 143 134 130" stroke="#7a2e3a" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const lunettes = p.lunettes
    ? `<g fill="none" stroke="${p.lunettes}" stroke-width="2.6">
        <circle cx="104" cy="100" r="13.5"/><circle cx="136" cy="100" r="13.5"/>
        <path d="M117.5 98 Q120 95 122.5 98"/><path d="M90.5 98 L82 96 M149.5 98 L158 96"/>
      </g>`
    : '';

  // --- Coiffe --------------------------------------------------------------
  const toque = p.toque
    ? `<path d="M80 62 C74 22 96 10 120 12 C144 10 166 22 160 62 Z" fill="#ffffff"/>
       <path d="M96 22 C98 40 100 52 100 62 M120 14 C120 36 120 50 120 62 M144 22 C142 40 140 52 140 62" stroke="#dfe5ec" stroke-width="2" fill="none"/>
       <rect x="78" y="56" width="84" height="14" rx="4" fill="#f4f6f8" stroke="#dfe5ec" stroke-width="1.5"/>`
    : '';

  return `<svg class="portrait ${classe}" viewBox="0 0 240 240" width="${taille}" height="${taille}" role="img" aria-label="${chef.titre}, ${chef.role}">
    <defs>${defs.join('')}</defs>
    <circle cx="120" cy="120" r="118" fill="${couleurFond}"/>
    <g clip-path="url(#medaillon-${id})">
      ${veste}${cou}${oreilles}${tete}${barbe}${cheveux}${boucleOreille}
      ${sourcils}${yeux}${nez}${joues}${taches}${bouche}${lunettes}${toque}
    </g>
  </svg>`;
}
